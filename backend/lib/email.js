import { Resend } from "resend";

export async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "FleetGuard <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
