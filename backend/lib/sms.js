import { normalizePhone } from "./phone.js";

/** True when Twilio credentials are present. Without them SMS are only logged. */
export function smsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

/**
 * Send an SMS through Twilio's REST API (no extra dependency).
 * Throws if the number is invalid or Twilio rejects the message.
 */
export async function sendSms(to, body, { fetchImpl = fetch } = {}) {
  const phone = normalizePhone(to);
  if (!phone) throw new Error("Invalid phone number");
  if (!smsConfigured()) {
    console.log(`[sms:dev] To: ${phone} | ${body}`);
    return { dev: true };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM, Body: body }).toString(),
  });
  if (!res.ok) {
    throw new Error(`SMS provider error (${res.status})`);
  }
  return { sent: true };
}
