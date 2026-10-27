import { Resend } from "resend";

/** True when a real email provider is configured (otherwise emails are only logged). */
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send an email. Throws when the provider rejects it: the Resend SDK returns
 * `{ error }` instead of throwing, and ignoring it would mark reminders as
 * delivered when they were not.
 */
export async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}`);
    return { dev: true };
  }
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? `${process.env.BRAND_NAME || "FleetGuard"} <onboarding@resend.dev>`,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Email provider error: ${error.message ?? error.name ?? "unknown"}`);
  }
  return { id: data?.id };
}
