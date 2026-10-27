import { test } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "test-secret-for-unit-tests";
process.env.FRONTEND_URL = "https://app.example.com";

const { runReminderSweep, runWeeklyDigest, runOnboardingNudge, buildReminderEmail, buildReminderSms, ownerRecipients, dueText } =
  await import("../lib/reminders.js");

const NOW = new Date("2026-10-09T12:00:00Z");
const inDays = (n) => new Date(NOW.getTime() + n * 86400000);

function company(overrides = {}) {
  return {
    id: "c1",
    name: "Acme Freight",
    email: "Owner@Acme.com",
    emailVerified: true,
    reminderOffsets: "30,15,7,1",
    reminderEmails: "",
    notifyDrivers: false,
    team: [],
    ...overrides,
  };
}

function doc(daysLeft, overrides = {}) {
  return {
    id: `d${daysLeft}`,
    title: "DOT medical card",
    type: "medical_card",
    expiresAt: inDays(daysLeft),
    sentReminders: "",
    vehicle: null,
    driver: null,
    company: company(),
    ...overrides,
  };
}

function harness(documents, { failOwner = false, companies = [{ id: "c1" }] } = {}) {
  const emails = [];
  const sms = [];
  const updates = [];
  return {
    emails,
    sms,
    updates,
    deps: {
      now: NOW,
      log: { error() {} },
      prisma: {
        document: {
          findMany: async () => documents,
          update: async (arg) => { updates.push(arg); },
        },
        company: {
          findMany: async () => companies,
          update: async (arg) => { updates.push({ company: arg }); },
        },
      },
      captureSnapshot: async () => {},
      sendEmail: async (to, subject, html) => {
        if (failOwner && to === "owner@acme.com") throw new Error("provider down");
        emails.push({ to, subject, html });
      },
      sendSms: async (to, body) => { sms.push({ to, body }); },
    },
  };
}

test("sends the 7-day reminder once and records it", async () => {
  const h = harness([doc(7)]);
  const r = await runReminderSweep(h.deps);
  assert.equal(r.sent, 1);
  assert.equal(h.emails.length, 1);
  assert.equal(h.emails[0].to, "owner@acme.com");
  assert.match(h.emails[0].subject, /Expires in 7 days: DOT medical card/);
  assert.equal(h.updates[0].data.sentReminders, "7");
});

test("does not repeat a reminder that was already sent", async () => {
  const h = harness([doc(7, { sentReminders: "7" })]);
  const r = await runReminderSweep(h.deps);
  assert.equal(r.sent, 0);
  assert.equal(h.emails.length, 0);
});

test("a document added late gets the closest reminder once", async () => {
  const h = harness([doc(20)]);
  await runReminderSweep(h.deps);
  assert.equal(h.updates[0].data.sentReminders, "30");
});

test("expired documents trigger an EXPIRED alert once", async () => {
  const h = harness([doc(-3)]);
  await runReminderSweep(h.deps);
  assert.match(h.emails[0].subject, /EXPIRED: DOT medical card/);
  assert.equal(h.updates[0].data.sentReminders, "expired");
  const again = harness([doc(-3, { sentReminders: "expired" })]);
  assert.equal((await runReminderSweep(again.deps)).sent, 0);
});

test("far-away documents are left alone", async () => {
  const h = harness([doc(200)]);
  assert.equal((await runReminderSweep(h.deps)).sent, 0);
});

test("unverified accounts never receive email", async () => {
  const h = harness([doc(7, { company: company({ emailVerified: false }) })]);
  const r = await runReminderSweep(h.deps);
  assert.equal(r.sent, 0);
  assert.equal(r.skipped, 1);
  assert.equal(h.emails.length, 0);
});

test("a failed send to the owner is not recorded, so it is retried", async () => {
  const h = harness([doc(7)], { failOwner: true });
  const r = await runReminderSweep(h.deps);
  assert.equal(r.sent, 0);
  assert.equal(r.failed, 1);
  assert.equal(h.updates.length, 0, "must not mark as sent");
});

test("custom offsets per company", async () => {
  const c = company({ reminderOffsets: "3" });
  assert.equal((await runReminderSweep(harness([doc(7, { company: c })]).deps)).sent, 0);
  const h = harness([doc(2, { company: c })]);
  await runReminderSweep(h.deps);
  assert.equal(h.updates[0].data.sentReminders, "3");
});

test("invalid stored offsets fall back to the default schedule", async () => {
  const h = harness([doc(7, { company: company({ reminderOffsets: "garbage" }) })]);
  assert.equal((await runReminderSweep(h.deps)).sent, 1);
});

test("extra recipients and accepted managers are included; viewers and pending invites are not", async () => {
  const c = company({
    reminderEmails: "boss@acme.com, ops@acme.com",
    team: [
      { email: "mgr@acme.com", role: "manager", passwordHash: "h" },
      { email: "view@acme.com", role: "viewer", passwordHash: "h" },
      { email: "pending@acme.com", role: "manager", passwordHash: "" },
    ],
  });
  assert.deepEqual(ownerRecipients(c), ["owner@acme.com", "boss@acme.com", "ops@acme.com", "mgr@acme.com"]);
  const h = harness([doc(7, { company: c })]);
  await runReminderSweep(h.deps);
  assert.deepEqual(h.emails.map((e) => e.to), ["owner@acme.com", "boss@acme.com", "ops@acme.com", "mgr@acme.com"]);
});

test("driver notifications are opt-in and use email and SMS", async () => {
  const driver = { name: "Marcus", email: "marcus@x.com", phone: "(415) 555-0123" };
  const off = harness([doc(7, { driver, company: company({ notifyDrivers: false }) })]);
  await runReminderSweep(off.deps);
  assert.equal(off.emails.length, 1);
  assert.equal(off.sms.length, 0);

  const on = harness([doc(7, { driver, company: company({ notifyDrivers: true }) })]);
  await runReminderSweep(on.deps);
  assert.equal(on.emails.length, 2);
  assert.equal(on.emails[1].to, "marcus@x.com");
  assert.match(on.emails[1].subject, /Your DOT medical card expires in 7 days/);
  assert.equal(on.sms.length, 1);
  assert.match(on.sms[0].body, /DOT medical card expires in 7 days/);
});

test("a driver SMS failure does not block the owner's reminder", async () => {
  const h = harness([doc(7, { driver: { name: "M", phone: "4155550123" }, company: company({ notifyDrivers: true }) })]);
  h.deps.sendSms = async () => { throw new Error("twilio down"); };
  const r = await runReminderSweep(h.deps);
  assert.equal(r.sent, 1);
});

test("email content escapes user-provided text", () => {
  const { html } = buildReminderEmail({
    doc: { id: "d", title: '<script>alert("x")</script>', type: "other", expiresAt: inDays(7), vehicle: null, driver: null },
    days: 7,
    company: company(),
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("https://app.example.com/app/documents/d"));
});

test("due text and SMS wording", () => {
  assert.equal(dueText(1), "expires in 1 day");
  assert.equal(dueText(0), "expires today");
  assert.equal(dueText(-1), "expired 1 day ago");
  assert.equal(dueText(-5), "expired 5 days ago");
  const body = buildReminderSms({ doc: { title: "CDL", expiresAt: inDays(7) }, days: 7, company: { name: "Acme" } });
  assert.match(body, /Your CDL expires in 7 days \(2026-10-16\)/);
});

test("weekly digest: only companies with something to report, and only if opted in", async () => {
  const sent = [];
  const mk = (id, docs) => ({ ...company({ id, email: `${id}@x.com` }), documents: docs.map((d) => ({ ...d, vehicle: null, driver: null })) });
  const companies = [
    mk("a", [{ id: "1", title: "Late", type: "insurance", expiresAt: inDays(-2) }]),
    mk("b", [{ id: "2", title: "Fine", type: "insurance", expiresAt: inDays(200) }]),
    mk("c", []),
  ];
  const r = await runWeeklyDigest({
    now: NOW,
    log: { error() {} },
    prisma: { company: { findMany: async (arg) => { assert.equal(arg.where.weeklyDigest, true); assert.equal(arg.where.emailVerified, true); return companies; } } },
    sendEmail: async (to, subject, html) => { sent.push({ to, subject, html }); },
  });
  assert.equal(r.sent, 1);
  assert.equal(sent[0].to, "a@x.com");
  assert.match(sent[0].subject, /1 expired, 1 need attention/);
  assert.ok(sent[0].html.includes("/app/settings"), "has an opt-out link");
});

test("onboarding nudge sends once and records it", async () => {
  const sent = [];
  const updates = [];
  const r = await runOnboardingNudge({
    now: NOW,
    log: { error() {} },
    prisma: {
      company: {
        findMany: async (arg) => {
          assert.equal(arg.where.nudgeSentAt, null);
          assert.deepEqual(arg.where.documents, { none: {} });
          return [company({ id: "n1", email: "new@x.com" })];
        },
        update: async (arg) => { updates.push(arg); },
      },
    },
    sendEmail: async (to, subject) => { sent.push({ to, subject }); },
  });
  assert.equal(r.sent, 1);
  assert.equal(sent[0].to, "new@x.com");
  assert.equal(updates[0].where.id, "n1");
  assert.equal(updates[0].data.nudgeSentAt, NOW);
});
