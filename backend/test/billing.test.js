import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

process.env.JWT_SECRET = "test-secret-for-unit-tests";

const { applyBillingEvent, verifySignature } = await import("../lib/billing.js");
const { isPaid } = await import("../lib/plan.js");
const { createFakePrisma } = await import("./helpers/fakePrisma.js");

const SECRET = "whsec_test";
const sign = (raw) => crypto.createHmac("sha256", SECRET).update(raw).digest("hex");

test("signature: valid, tampered and missing", () => {
  const raw = Buffer.from('{"a":1}');
  assert.equal(verifySignature(raw, sign(raw), SECRET), true);
  assert.equal(verifySignature(Buffer.from('{"a":2}'), sign(raw), SECRET), false);
  assert.equal(verifySignature(raw, "", SECRET), false);
  assert.equal(verifySignature(raw, sign(raw), ""), false);
  assert.equal(verifySignature(raw, "deadbeef", SECRET), false);
  assert.equal(verifySignature(undefined, sign(raw), SECRET), false);
});

const event = (name, attrs, id = "sub_1") => ({ meta: { event_name: name }, data: { id, attributes: attrs } });

async function setup() {
  const prisma = createFakePrisma();
  const company = await prisma.company.create({ data: { name: "Acme", email: "buyer@acme.com", passwordHash: "h" } });
  const mails = [];
  const sendEmail = async (to, subject) => { mails.push({ to, subject }); };
  return { prisma, company, mails, sendEmail };
}

test("a new subscription unlocks the plan and stores the billing details", async () => {
  const { prisma, company, sendEmail } = await setup();
  const result = await applyBillingEvent(
    prisma,
    event("subscription_created", {
      user_email: "Buyer@Acme.com",
      status: "active",
      customer_id: 77,
      renews_at: "2026-11-09T00:00:00Z",
      ends_at: null,
      urls: { customer_portal: "https://portal.example/abc" },
    }),
    { sendEmail }
  );
  assert.equal(result.handled, true);
  const row = await prisma.company.findUnique({ where: { id: company.id } });
  assert.equal(row.subscriptionStatus, "active");
  assert.equal(row.lsCustomerId, "77");
  assert.equal(row.lsSubscriptionId, "sub_1");
  assert.equal(row.lsPortalUrl, "https://portal.example/abc");
  assert.equal(row.planRenewsAt.toISOString(), "2026-11-09T00:00:00.000Z");
  assert.equal(isPaid(row), true);
});

test("the same event twice leaves the same state", async () => {
  const { prisma, company } = await setup();
  const body = event("subscription_updated", { user_email: "buyer@acme.com", status: "active", renews_at: "2026-11-09T00:00:00Z" });
  await applyBillingEvent(prisma, body);
  const first = { ...(await prisma.company.findUnique({ where: { id: company.id } })) };
  await applyBillingEvent(prisma, body);
  assert.deepEqual(await prisma.company.findUnique({ where: { id: company.id } }), first);
});

test("cancelling keeps access until the paid period ends, then it ends", async () => {
  const { prisma, company } = await setup();
  await applyBillingEvent(prisma, event("subscription_cancelled", { user_email: "buyer@acme.com", status: "cancelled", ends_at: "2026-12-01T00:00:00Z" }));
  const row = await prisma.company.findUnique({ where: { id: company.id } });
  assert.equal(row.subscriptionStatus, "cancelled");
  assert.equal(isPaid(row, { now: new Date("2026-11-20T00:00:00Z") }), true);
  assert.equal(isPaid(row, { now: new Date("2026-12-02T00:00:00Z") }), false);
});

test("expired and paused subscriptions are not paid", async () => {
  const { prisma, company } = await setup();
  for (const [name, status] of [["subscription_expired", "expired"], ["subscription_paused", "paused"]]) {
    await applyBillingEvent(prisma, event(name, { user_email: "buyer@acme.com", status }));
    assert.equal(isPaid(await prisma.company.findUnique({ where: { id: company.id } })), false, status);
  }
});

test("a failed payment moves to past_due (still paid during the grace period) and emails the owner", async () => {
  const { prisma, company, mails, sendEmail } = await setup();
  await applyBillingEvent(prisma, event("subscription_payment_failed", { user_email: "buyer@acme.com", status: "pending" }, "inv_1"), { sendEmail });
  const row = await prisma.company.findUnique({ where: { id: company.id } });
  assert.equal(row.subscriptionStatus, "past_due");
  assert.equal(isPaid(row), true);
  assert.equal(mails.length, 1);
  assert.match(mails[0].subject, /Payment failed/);
});

test("a failed email send on payment failure does not break the webhook", async () => {
  const { prisma } = await setup();
  const result = await applyBillingEvent(prisma, event("subscription_payment_failed", { user_email: "buyer@acme.com" }), {
    sendEmail: async () => { throw new Error("provider down"); },
  });
  assert.equal(result.handled, true);
});

test("events for unknown buyers, missing emails and other event types change nothing", async () => {
  const { prisma, company } = await setup();
  assert.deepEqual(
    (await applyBillingEvent(prisma, event("subscription_created", { user_email: "stranger@x.com", status: "active" }))).reason,
    "no_company"
  );
  assert.equal((await applyBillingEvent(prisma, event("subscription_created", { status: "active" }))).reason, "no_email");
  assert.equal((await applyBillingEvent(prisma, event("order_created", { user_email: "buyer@acme.com" }))).reason, "ignored");
  assert.equal((await applyBillingEvent(prisma, { meta: {}, data: {} })).handled, false);
  assert.equal((await prisma.company.findUnique({ where: { id: company.id } })).subscriptionStatus, "trialing");
});

test("a purchase is matched by the account id even if the buyer used another email", async () => {
  const { prisma, company } = await setup();
  const body = {
    meta: { event_name: "subscription_created", custom_data: { company_id: company.id } },
    data: { id: "sub_9", attributes: { user_email: "personal-address@gmail.com", status: "active" } },
  };
  const result = await applyBillingEvent(prisma, body);
  assert.equal(result.handled, true);
  assert.equal((await prisma.company.findUnique({ where: { id: company.id } })).subscriptionStatus, "active");
});

test("an unknown account id falls back to the buyer's email, and a payment failure also matches by id", async () => {
  const { prisma, company, mails, sendEmail } = await setup();
  const viaEmail = await applyBillingEvent(prisma, {
    meta: { event_name: "subscription_created", custom_data: { company_id: "does-not-exist" } },
    data: { id: "sub_1", attributes: { user_email: "buyer@acme.com", status: "active" } },
  });
  assert.equal(viaEmail.handled, true);

  await applyBillingEvent(
    prisma,
    { meta: { event_name: "subscription_payment_failed", custom_data: { company_id: company.id } }, data: { id: "inv_2", attributes: { user_email: "other@x.com" } } },
    { sendEmail }
  );
  assert.equal((await prisma.company.findUnique({ where: { id: company.id } })).subscriptionStatus, "past_due");
  assert.equal(mails[0].to, "buyer@acme.com", "the notice goes to the account owner, not the checkout email");
});

test("an event with neither an id nor a matching email changes nothing", async () => {
  const { prisma, company } = await setup();
  const result = await applyBillingEvent(prisma, {
    meta: { event_name: "subscription_created", custom_data: { company_id: "nope" } },
    data: { id: "sub_3", attributes: { user_email: "nobody@x.com", status: "active" } },
  });
  assert.equal(result.reason, "no_company");
  assert.equal((await prisma.company.findUnique({ where: { id: company.id } })).subscriptionStatus, "trialing");
});

test("garbage dates are ignored instead of corrupting the account", async () => {
  const { prisma, company } = await setup();
  await applyBillingEvent(prisma, event("subscription_updated", { user_email: "buyer@acme.com", status: "active", renews_at: "not a date", ends_at: "???" }));
  const row = await prisma.company.findUnique({ where: { id: company.id } });
  assert.equal(row.planRenewsAt, null);
  assert.equal(row.planEndsAt, null);
});
