import crypto from "crypto";

export function isLemonConfigured() {
  return Boolean(
    process.env.LEMONSQUEEZY_BUY_LINK ||
      (process.env.LEMONSQUEEZY_API_KEY &&
        process.env.LEMONSQUEEZY_STORE_ID &&
        process.env.LEMONSQUEEZY_VARIANT_ID)
  );
}

export function buildCheckoutUrl(company) {
  const buyLink = process.env.LEMONSQUEEZY_BUY_LINK;
  if (!buyLink) throw new Error("LEMONSQUEEZY_BUY_LINK is not set");
  const url = new URL(buyLink);
  url.searchParams.set("checkout[email]", company.email);
  url.searchParams.set("checkout[custom][company_id]", company.id);
  return url.toString();
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function getCustomerPortalUrl(subscriptionId) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey || !subscriptionId) return null;
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.attributes?.urls?.customer_portal ?? null;
}
