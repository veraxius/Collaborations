import crypto from "crypto";
import { safeEqual } from "./security.js";
import { escapeHtml } from "./security.js";
import { emailShell, appUrl } from "./email-templates.js";
import { BRAND_NAME } from "./brand.js";

/** Lemon Squeezy signs the raw body with HMAC-SHA256 (hex) in X-Signature. */
export function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody ?? "").digest("hex");
  return safeEqual(String(signature), expected);
}

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "subscription_unpaused",
  "subscription_paused",
  "subscription_cancelled",
  "subscription_expired",
]);

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Apply a Lemon Squeezy webhook to the matching company (matched by the
 * buyer's email, which the checkout link pre-fills). Idempotent: running the
 * same event twice leaves the same state. Returns what happened for logging.
 */
export async function applyBillingEvent(prisma, body, { sendEmail } = {}) {
  const event = String(body?.meta?.event_name ?? "");
  const attrs = body?.data?.attributes ?? {};
  const email = String(attrs.user_email ?? "").trim().toLowerCase();
  // The in-app checkout link carries the account id as custom data, so the
  // purchase is matched even if the buyer typed a different email at checkout.
  const accountId = String(body?.meta?.custom_data?.company_id ?? "").trim();
  if (!email && !accountId) return { handled: false, reason: "no_email", event };

  /** The account this event belongs to: by id first, then by the buyer's email. */
  async function findCompany() {
    if (accountId) {
      const byId = await prisma.company.findUnique({ where: { id: accountId } });
      if (byId) return byId;
    }
    return email ? prisma.company.findUnique({ where: { email } }) : null;
  }

  if (event === "subscription_payment_failed") {
    const company = await findCompany();
    if (!company) return { handled: false, reason: "no_company", event };
    await prisma.company.update({ where: { id: company.id }, data: { subscriptionStatus: "past_due" } });
    if (sendEmail) {
      const html = emailShell({
        heading: "Your payment didn't go through",
        bodyHtml: `<p>We couldn't charge your card for ${escapeHtml(BRAND_NAME)}. Please update your payment method so your plan stays active.</p>`,
        cta: { label: "Update billing", url: `${appUrl()}/app/settings` },
      });
      await sendEmail(company.email, `[${BRAND_NAME}] Payment failed`, html).catch(() => {});
    }
    return { handled: true, status: "past_due", event };
  }

  if (!SUBSCRIPTION_EVENTS.has(event)) return { handled: false, reason: "ignored", event };

  const company = await findCompany();
  if (!company) return { handled: false, reason: "no_company", event };

  const status = String(attrs.status ?? "active"); // active, on_trial, paused, past_due, unpaid, cancelled, expired
  await prisma.company.update({
    where: { id: company.id },
    data: {
      subscriptionStatus: status,
      lsCustomerId: attrs.customer_id != null ? String(attrs.customer_id) : company.lsCustomerId,
      lsSubscriptionId: body?.data?.id != null ? String(body.data.id) : company.lsSubscriptionId,
      lsPortalUrl: attrs.urls?.customer_portal ?? company.lsPortalUrl ?? null,
      planRenewsAt: toDate(attrs.renews_at),
      planEndsAt: toDate(attrs.ends_at),
    },
  });
  return { handled: true, status, event };
}
