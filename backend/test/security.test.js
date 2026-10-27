import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret-for-unit-tests";

const { escapeHtml, parseIntOrNull, parseFloatOrNull, safeEqual, rateLimit, securityHeaders } = await import("../lib/security.js");
const { signPurposeToken, verifyPurposeToken, fingerprint } = await import("../lib/tokens.js");
const { signToken, makeRequireAuth, requireWrite, requireOwner } = await import("../lib/auth.js");

function fakeRes() {
  return {
    code: 200,
    body: undefined,
    headers: {},
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
    set(h, v) { if (typeof h === "string") this.headers[h] = v; else Object.assign(this.headers, h); return this; },
  };
}

test("escapeHtml neutralizes markup", () => {
  assert.equal(escapeHtml(`<img src=x onerror="a">&'`), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;'");
  assert.equal(escapeHtml(null), "");
});

test("number parsers never return NaN", () => {
  assert.equal(parseIntOrNull("12"), 12);
  assert.equal(parseIntOrNull("abc"), null);
  assert.equal(parseIntOrNull(""), null);
  assert.equal(parseFloatOrNull("1.5"), 1.5);
  assert.equal(parseFloatOrNull("x"), null);
});

test("safeEqual compares strings of any length without throwing", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual(undefined, "undefined"), false, "non-strings never match");
  assert.equal(safeEqual(undefined, undefined), false);
});

test("rate limiter blocks after the maximum and sets Retry-After", () => {
  const limit = rateLimit({ windowMs: 60_000, max: 3, bucket: "t1" });
  let passed = 0;
  const res = fakeRes();
  for (let i = 0; i < 5; i++) limit({ ip: "1.2.3.4" }, res, () => passed++);
  assert.equal(passed, 3);
  assert.equal(res.code, 429);
  assert.ok(Number(res.headers["Retry-After"]) > 0);
  // another IP is unaffected
  let other = 0;
  limit({ ip: "9.9.9.9" }, fakeRes(), () => other++);
  assert.equal(other, 1);
});

test("security headers are set", () => {
  const res = fakeRes();
  securityHeaders({}, res, () => {});
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(res.headers["X-Frame-Options"], "DENY");
});

test("purpose tokens: valid only for the right purpose, subject and state", () => {
  const t = signPurposeToken("reset", "user-1", "hash-A", "1h");
  assert.equal(verifyPurposeToken(t, "reset", "user-1", "hash-A"), true);
  assert.equal(verifyPurposeToken(t, "invite", "user-1", "hash-A"), false, "other purpose");
  assert.equal(verifyPurposeToken(t, "reset", "user-2", "hash-A"), false, "other subject");
  assert.equal(verifyPurposeToken(t, "reset", "user-1", "hash-B"), false, "state changed (password set)");
  assert.equal(verifyPurposeToken("garbage", "reset", "user-1", "hash-A"), false);
  assert.equal(verifyPurposeToken(undefined, "reset", "user-1", "hash-A"), false);
});

test("purpose tokens expire", () => {
  const expired = signPurposeToken("verify", "c1", "x", "-10s");
  assert.equal(verifyPurposeToken(expired, "verify", "c1", "x"), false);
});

test("a token from another secret is rejected", () => {
  const forged = jwt.sign({ sub: "user-1", purpose: "reset" }, "some-other-secret", { expiresIn: "1h" });
  assert.equal(verifyPurposeToken(forged, "reset", "user-1", "hash-A"), false);
});

function reqWith(token) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

const OWNER = { id: "c1", email: "owner@x.com", name: "Acme", passwordHash: "owner-hash" };
const MEMBER = { id: "m1", companyId: "c1", email: "dispatch@x.com", name: "Dee", role: "manager", passwordHash: "member-hash" };

function prismaFake({ company = OWNER, member = MEMBER } = {}) {
  return {
    company: { findUnique: async () => company },
    teamMember: { findUnique: async () => member },
  };
}

async function authenticate(prisma, token) {
  const req = reqWith(token);
  const res = fakeRes();
  let nexted = false;
  await makeRequireAuth(prisma)(req, res, () => { nexted = true; });
  return { req, res, nexted };
}

test("auth: owner session passes and carries the owner role", async () => {
  const { req, nexted } = await authenticate(prismaFake(), signToken(OWNER));
  assert.equal(nexted, true);
  assert.equal(req.role, "owner");
  assert.equal(req.companyId, "c1");
});

test("auth: missing, malformed and forged tokens are rejected", async () => {
  for (const token of [undefined, "abc", jwt.sign({ companyId: "c1", pv: "x" }, "wrong-secret")]) {
    const { res, nexted } = await authenticate(prismaFake(), token);
    assert.equal(nexted, false);
    assert.equal(res.code, 401);
  }
});

test("auth: tokens without a password fingerprint (old sessions) are rejected", async () => {
  const old = jwt.sign({ companyId: "c1", email: "owner@x.com" }, process.env.JWT_SECRET);
  const { res } = await authenticate(prismaFake(), old);
  assert.equal(res.code, 401);
});

test("auth: changing the password signs out existing sessions", async () => {
  const token = signToken(OWNER);
  const changed = { ...OWNER, passwordHash: "new-hash" };
  const { res, nexted } = await authenticate(prismaFake({ company: changed }), token);
  assert.equal(nexted, false);
  assert.equal(res.code, 401);
});

test("auth: a deleted company cannot use its token", async () => {
  const { res } = await authenticate(prismaFake({ company: null }), signToken(OWNER));
  assert.equal(res.code, 401);
});

test("auth: member role comes from the database, not the token", async () => {
  const token = signToken(OWNER, MEMBER); // issued as manager
  const demoted = { ...MEMBER, role: "viewer" };
  const { req, nexted } = await authenticate(prismaFake({ member: demoted }), token);
  assert.equal(nexted, true);
  assert.equal(req.role, "viewer");
});

test("auth: a removed member is signed out immediately", async () => {
  const { res, nexted } = await authenticate(prismaFake({ member: null }), signToken(OWNER, MEMBER));
  assert.equal(nexted, false);
  assert.equal(res.code, 401);
});

test("auth: a member from another company is rejected", async () => {
  const stranger = { ...MEMBER, companyId: "other" };
  const { res } = await authenticate(prismaFake({ member: stranger }), signToken(OWNER, MEMBER));
  assert.equal(res.code, 401);
});

test("auth: an invitation that was never accepted cannot sign in", async () => {
  const pending = { ...MEMBER, passwordHash: "" };
  const { res } = await authenticate(prismaFake({ member: pending }), signToken(OWNER, MEMBER));
  assert.equal(res.code, 401);
});

test("roles: viewers are read-only and only owners reach owner routes", () => {
  const run = (mw, role) => {
    const res = fakeRes();
    let ok = false;
    mw({ role }, res, () => { ok = true; });
    return { ok, code: res.code };
  };
  assert.deepEqual(run(requireWrite, "viewer"), { ok: false, code: 403 });
  assert.equal(run(requireWrite, "manager").ok, true);
  assert.equal(run(requireWrite, "owner").ok, true);
  assert.deepEqual(run(requireOwner, "manager"), { ok: false, code: 403 });
  assert.equal(run(requireOwner, "owner").ok, true);
});

test("fingerprint is stable and does not reveal the hash", () => {
  assert.equal(fingerprint("abc"), fingerprint("abc"));
  assert.notEqual(fingerprint("abc"), fingerprint("abd"));
  assert.equal(fingerprint("abc").length, 16);
});
