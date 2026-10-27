import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";

process.env.JWT_SECRET = "test-secret-for-unit-tests";
process.env.FRONTEND_URL = "https://app.example.com";
process.env.RESEND_API_KEY = "re_test_key"; // makes new accounts start unverified, like production
delete process.env.DEPLOYMENT_MODE;

const { createFakePrisma } = await import("./helpers/fakePrisma.js");
const { registerAccountRoutes } = await import("../routes/account.js");
const { makeRequireAuth, requireWrite } = await import("../lib/auth.js");

const prisma = createFakePrisma();
const mails = [];
const passthrough = (_req, _res, next) => next();

let server;
let base;

before(async () => {
  const app = express();
  app.use(express.json());
  const requireAuth = makeRequireAuth(prisma);
  registerAccountRoutes(app, {
    prisma,
    requireAuth,
    limiters: { auth: passthrough, reset: passthrough, dot: passthrough },
    uploadDir: null,
    mail: async (to, subject, html) => { mails.push({ to, subject, html }); },
  });
  // a stand-in for the data routes, to check the read-only role
  app.post("/api/thing", requireAuth, requireWrite, (_req, res) => res.json({ ok: true }));
  app.get("/api/thing", requireAuth, (_req, res) => res.json({ ok: true }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json };
}

const linkParams = (html) => {
  const href = /href="([^"]+)"/.exec(html)[1].replace(/&amp;/g, "&");
  return new URL(href).searchParams;
};
const lastMailTo = (to) => [...mails].reverse().find((m) => m.to === to);

async function signUp(email, extra = {}) {
  const r = await call("POST", "/api/auth/register", { body: { name: "Acme Freight", email, password: "correct horse", ...extra } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}

test("register: validates the input", async () => {
  const bad = [
    [{ name: "", email: "a@b.co", password: "12345678" }, /company name/i],
    [{ name: "A", email: "nope", password: "12345678" }, /valid email/i],
    [{ name: "A", email: "a@b.co", password: "short" }, /at least 8/i],
    [{ name: "A", email: "a@b.co", password: "x".repeat(80) }, /too long/i],
  ];
  for (const [body, re] of bad) {
    const r = await call("POST", "/api/auth/register", { body });
    assert.equal(r.status, 400);
    assert.match(r.body.error, re);
  }
});

test("register: new accounts are unverified, get a confirmation email and never leak the hash", async () => {
  const { token, company } = await signUp("owner1@acme.com");
  assert.equal(company.emailVerified, false);
  assert.equal(company.plan, "free");
  assert.equal(company.user.role, "owner");
  assert.equal("passwordHash" in company, false);
  assert.ok(token);
  const mail = lastMailTo("owner1@acme.com");
  assert.match(mail.subject, /Confirm your email/);
});

test("register: the same email cannot be used twice, in any letter case", async () => {
  const r = await call("POST", "/api/auth/register", { body: { name: "X", email: "OWNER1@acme.com", password: "correct horse" } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /already exists/);
});

test("email verification: the link works once and a tampered one is refused", async () => {
  const { token } = await signUp("verify@acme.com");
  const params = linkParams(lastMailTo("verify@acme.com").html);
  const bad = await call("POST", "/api/auth/verify", { body: { id: params.get("id"), token: params.get("token") + "x" } });
  assert.equal(bad.status, 400);
  const ok = await call("POST", "/api/auth/verify", { body: { id: params.get("id"), token: params.get("token") } });
  assert.equal(ok.status, 200);
  const me = await call("GET", "/api/me", { token });
  assert.equal(me.body.company.emailVerified, true);
  // someone else's id with this token is refused
  const other = await call("POST", "/api/auth/verify", { body: { id: "id999", token: params.get("token") } });
  assert.equal(other.status, 400);
});

test("register with a USDOT number stores it and creates the MCS-150 reminder", async () => {
  const { company } = await signUp("dot@acme.com", { usdot: "USDOT 1234567" });
  assert.equal(company.usdot, "1234567");
  const docs = prisma.document.rows.filter((d) => d.companyId === company.id);
  assert.equal(docs.length, 1);
  assert.equal(docs[0].type, "mcs150");
  assert.match(docs[0].expiresAt.toISOString(), /-07-31T12:00:00/);
});

test("register with an invalid USDOT ignores it", async () => {
  const { company } = await signUp("nodot@acme.com", { usdot: "12" });
  assert.equal(company.usdot, null);
  assert.equal(prisma.document.rows.filter((d) => d.companyId === company.id).length, 0);
});

test("login: right password works, wrong password and unknown email look the same", async () => {
  await signUp("login@acme.com");
  const ok = await call("POST", "/api/auth/login", { body: { email: "LOGIN@acme.com ", password: "correct horse" } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const wrong = await call("POST", "/api/auth/login", { body: { email: "login@acme.com", password: "nope nope" } });
  const unknown = await call("POST", "/api/auth/login", { body: { email: "ghost@acme.com", password: "nope nope" } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
});

test("API: no token, garbage token -> 401", async () => {
  assert.equal((await call("GET", "/api/me")).status, 401);
  assert.equal((await call("GET", "/api/me", { token: "garbage" })).status, 401);
});

test("team: invite, accept, role limits and immediate revocation", async () => {
  const { token: ownerToken } = await signUp("boss@acme.com");

  // validation
  assert.equal((await call("POST", "/api/team", { token: ownerToken, body: { email: "bad", name: "A", role: "viewer" } })).status, 400);
  assert.equal((await call("POST", "/api/team", { token: ownerToken, body: { email: "d@acme.com", name: "Dee", role: "owner" } })).status, 400);

  // invite a viewer
  const invited = await call("POST", "/api/team", { token: ownerToken, body: { email: "Dee@Acme.com", name: "Dee", role: "viewer" } });
  assert.equal(invited.status, 201);
  assert.equal(invited.body.emailSent, true);
  assert.equal(invited.body.member.accepted, false);

  // the free plan allows one teammate
  const second = await call("POST", "/api/team", { token: ownerToken, body: { email: "e@acme.com", name: "Eli", role: "viewer" } });
  assert.equal(second.status, 402);
  assert.equal(second.body.code, "plan_limit");

  // a pending invitation cannot sign in
  const early = await call("POST", "/api/auth/login", { body: { email: "dee@acme.com", password: "anything goes" } });
  assert.equal(early.status, 401);

  // accept
  const params = linkParams(lastMailTo("dee@acme.com").html);
  const weak = await call("POST", "/api/auth/accept-invite", { body: { id: params.get("id"), token: params.get("token"), password: "short" } });
  assert.equal(weak.status, 400);
  const accepted = await call("POST", "/api/auth/accept-invite", { body: { id: params.get("id"), token: params.get("token"), password: "dees password" } });
  assert.equal(accepted.status, 200);
  const viewerToken = accepted.body.token;
  assert.equal(accepted.body.company.user.role, "viewer");

  // the invitation link is single use
  const reuse = await call("POST", "/api/auth/accept-invite", { body: { id: params.get("id"), token: params.get("token"), password: "another pass" } });
  assert.equal(reuse.status, 400);

  // viewer: can read, cannot write, cannot touch team, billing or settings
  assert.equal((await call("GET", "/api/thing", { token: viewerToken })).status, 200);
  assert.equal((await call("POST", "/api/thing", { token: viewerToken })).status, 403);
  assert.equal((await call("GET", "/api/team", { token: viewerToken })).status, 403);
  assert.equal((await call("POST", "/api/team", { token: viewerToken, body: { email: "z@acme.com", name: "Z", role: "manager" } })).status, 403);
  assert.equal((await call("GET", "/api/billing", { token: viewerToken })).status, 403);
  assert.equal((await call("PATCH", "/api/me", { token: viewerToken, body: { name: "Hacked" } })).status, 403);
  assert.equal((await call("PATCH", "/api/settings/notifications", { token: viewerToken, body: { weeklyDigest: false } })).status, 403);
  assert.equal((await call("DELETE", "/api/me", { token: viewerToken, body: { password: "dees password" } })).status, 403);

  // the member can also sign in with email and password
  const login = await call("POST", "/api/auth/login", { body: { email: "dee@acme.com", password: "dees password" } });
  assert.equal(login.status, 200);
  assert.equal(login.body.company.user.role, "viewer");

  // promoting to manager takes effect on the very next request
  const member = prisma.teamMember.rows.find((m) => m.email === "dee@acme.com");
  assert.equal((await call("PATCH", `/api/team/${member.id}`, { token: ownerToken, body: { role: "manager" } })).status, 200);
  assert.equal((await call("POST", "/api/thing", { token: viewerToken })).status, 200);

  // removing the member signs them out immediately
  assert.equal((await call("DELETE", `/api/team/${member.id}`, { token: ownerToken })).status, 200);
  assert.equal((await call("GET", "/api/thing", { token: viewerToken })).status, 401);
});

test("team: owners cannot touch another company's members", async () => {
  const a = await signUp("a-owner@x.com");
  const b = await signUp("b-owner@x.com");
  const invited = await call("POST", "/api/team", { token: b.token, body: { email: "b-mem@x.com", name: "B Mem", role: "viewer" } });
  const id = invited.body.member.id;
  assert.equal((await call("DELETE", `/api/team/${id}`, { token: a.token })).status, 404);
  assert.equal((await call("PATCH", `/api/team/${id}`, { token: a.token, body: { role: "manager" } })).status, 404);
  assert.equal((await call("POST", `/api/team/${id}/resend`, { token: a.token })).status, 404);
  const listA = await call("GET", "/api/team", { token: a.token });
  assert.equal(listA.body.members.length, 0);
});

test("team: a company email cannot be invited as a member", async () => {
  const { token } = await signUp("solo@x.com");
  await signUp("taken@x.com");
  const r = await call("POST", "/api/team", { token, body: { email: "taken@x.com", name: "T", role: "viewer" } });
  assert.equal(r.status, 400);
});

test("password change signs out other sessions and returns a fresh token", async () => {
  const { token: oldToken } = await signUp("pw@acme.com");
  const wrong = await call("POST", "/api/me/password", { token: oldToken, body: { current: "bad guess", next: "brand new pass" } });
  assert.equal(wrong.status, 400);
  const short = await call("POST", "/api/me/password", { token: oldToken, body: { current: "correct horse", next: "short" } });
  assert.equal(short.status, 400);
  const ok = await call("POST", "/api/me/password", { token: oldToken, body: { current: "correct horse", next: "brand new pass" } });
  assert.equal(ok.status, 200);
  assert.equal((await call("GET", "/api/me", { token: oldToken })).status, 401, "old session is dead");
  assert.equal((await call("GET", "/api/me", { token: ok.body.token })).status, 200, "new token works");
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "pw@acme.com", password: "correct horse" } })).status, 401);
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "pw@acme.com", password: "brand new pass" } })).status, 200);
});

test("password reset: same answer for unknown emails, single-use links, sessions revoked", async () => {
  const { token } = await signUp("reset@acme.com");
  const before = mails.length;
  const unknown = await call("POST", "/api/auth/forgot", { body: { email: "nobody@acme.com" } });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, { ok: true });
  assert.equal(mails.length, before, "no email for unknown accounts");

  const known = await call("POST", "/api/auth/forgot", { body: { email: "reset@acme.com" } });
  assert.deepEqual(known.body, { ok: true }, "identical response");
  const params = linkParams(lastMailTo("reset@acme.com").html);
  assert.equal(params.get("k"), "c");

  const weak = await call("POST", "/api/auth/reset", { body: { id: params.get("id"), token: params.get("token"), password: "short" } });
  assert.equal(weak.status, 400);
  const bad = await call("POST", "/api/auth/reset", { body: { id: params.get("id"), token: "x", password: "a fresh password" } });
  assert.equal(bad.status, 400);
  const ok = await call("POST", "/api/auth/reset", { body: { id: params.get("id"), token: params.get("token"), password: "a fresh password" } });
  assert.equal(ok.status, 200);
  assert.equal((await call("GET", "/api/me", { token })).status, 401, "the old session was revoked");
  const again = await call("POST", "/api/auth/reset", { body: { id: params.get("id"), token: params.get("token"), password: "yet another one" } });
  assert.equal(again.status, 400, "the link works only once");
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "reset@acme.com", password: "a fresh password" } })).status, 200);
});

test("password reset works for team members too", async () => {
  const { token } = await signUp("rm-owner@acme.com");
  await call("POST", "/api/team", { token, body: { email: "rm-member@acme.com", name: "Rae", role: "viewer" } });
  const invite = linkParams(lastMailTo("rm-member@acme.com").html);
  await call("POST", "/api/auth/accept-invite", { body: { id: invite.get("id"), token: invite.get("token"), password: "rae password" } });

  await call("POST", "/api/auth/forgot", { body: { email: "rm-member@acme.com" } });
  const params = linkParams(lastMailTo("rm-member@acme.com").html);
  assert.equal(params.get("k"), "m");
  const ok = await call("POST", "/api/auth/reset", { body: { id: params.get("id"), kind: "m", token: params.get("token"), password: "rae new password" } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.company.user.role, "viewer");
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "rm-member@acme.com", password: "rae new password" } })).status, 200);
  // a company id with a member's kind flag is rejected
  const mismatch = await call("POST", "/api/auth/reset", { body: { id: "id1", kind: "m", token: params.get("token"), password: "whatever it is" } });
  assert.equal(mismatch.status, 400);
});

test("a pending invitee who asks for a reset gets the invitation again", async () => {
  const { token } = await signUp("pi-owner@acme.com");
  await call("POST", "/api/team", { token, body: { email: "pending@acme.com", name: "Pat", role: "viewer" } });
  const before = mails.filter((m) => m.to === "pending@acme.com").length;
  await call("POST", "/api/auth/forgot", { body: { email: "pending@acme.com" } });
  const after = mails.filter((m) => m.to === "pending@acme.com");
  assert.equal(after.length, before + 1);
  assert.match(after.at(-1).subject, /invited you/);
});

test("notification settings are validated and normalized", async () => {
  const { token } = await signUp("notify@acme.com");
  const badDays = await call("PATCH", "/api/settings/notifications", { token, body: { reminderOffsets: "0, 400" } });
  assert.equal(badDays.status, 400);
  const badMail = await call("PATCH", "/api/settings/notifications", { token, body: { reminderEmails: "not an email" } });
  assert.equal(badMail.status, 400);
  const ok = await call("PATCH", "/api/settings/notifications", {
    token,
    body: { reminderOffsets: "1, 14, 30, 14", reminderEmails: "Boss@X.com, boss@x.com", notifyDrivers: true, weeklyDigest: false },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.company.reminderOffsets, "30,14,1");
  assert.equal(ok.body.company.reminderEmails, "boss@x.com");
  assert.equal(ok.body.company.notifyDrivers, true);
  assert.equal(ok.body.company.weeklyDigest, false);
});

test("profile: USDOT must be valid and can be cleared", async () => {
  const { token } = await signUp("profile@acme.com");
  assert.equal((await call("PATCH", "/api/me", { token, body: { name: "Acme", usdot: "12" } })).status, 400);
  const set = await call("PATCH", "/api/me", { token, body: { name: "Acme Inc", usdot: "7654321", vertical: "nemt" } });
  assert.equal(set.body.company.usdot, "7654321");
  assert.equal(set.body.company.vertical, "nemt");
  const cleared = await call("PATCH", "/api/me", { token, body: { name: "Acme Inc", usdot: "" } });
  assert.equal(cleared.body.company.usdot, null);
  assert.equal((await call("PATCH", "/api/me", { token, body: { name: "  " } })).status, 400);
  const bogus = await call("PATCH", "/api/me", { token, body: { name: "Acme Inc", vertical: "hacker" } });
  assert.equal(bogus.body.company.vertical, "trucking");
});

test("billing: owners see their plan; free accounts have no portal", async () => {
  const { token } = await signUp("bill@acme.com");
  const r = await call("GET", "/api/billing", { token });
  assert.equal(r.status, 200);
  assert.equal(r.body.plan, "free");
  assert.equal(r.body.portalUrl, null);
});

test("delete account: needs the password and removes everything", async () => {
  const { token, company } = await signUp("bye@acme.com", { usdot: "1234567" });
  await call("POST", "/api/team", { token, body: { email: "bye-mem@acme.com", name: "Bo", role: "viewer" } });
  assert.equal((await call("DELETE", "/api/me", { token, body: { password: "wrong one" } })).status, 400);
  assert.equal((await call("DELETE", "/api/me", { token, body: {} })).status, 400);
  assert.ok(await prisma.company.findUnique({ where: { id: company.id } }));
  assert.equal((await call("DELETE", "/api/me", { token, body: { password: "correct horse" } })).status, 200);
  assert.equal(await prisma.company.findUnique({ where: { id: company.id } }), null);
  assert.equal(prisma.teamMember.rows.filter((m) => m.companyId === company.id).length, 0);
  assert.equal(prisma.document.rows.filter((d) => d.companyId === company.id).length, 0);
  assert.equal((await call("GET", "/api/me", { token })).status, 401, "the deleted account's token is dead");
});

test("USDOT lookup: bad input and missing configuration are explained", async () => {
  delete process.env.FMCSA_WEBKEY;
  assert.equal((await call("GET", "/api/dot/12")).status, 400);
  const r = await call("GET", "/api/dot/1234567");
  assert.equal(r.status, 503);
  assert.equal(r.body.code, "not_configured");
});
