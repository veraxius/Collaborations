"use server";

import { headers } from "next/headers";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "fleetSize" | "message", string>>;
};

const FLEET_SIZES = [
  "1–5 trucks",
  "6–15 trucks",
  "16–50 trucks",
  "51–100 trucks",
  "More than 100 trucks",
];

/**
 * Basic in-memory rate limiting per IP: max 5 submissions per 10 minutes.
 * Good enough for a single-instance deployment (Railway).
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (recent.length >= RATE_MAX) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot: bots fill every field. Silently accept and drop.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const fleetSize = String(formData.get("fleetSize") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!isValidEmail(email)) fieldErrors.email = "Please enter a valid email.";
  if (!FLEET_SIZES.includes(fleetSize))
    fieldErrors.fleetSize = "Please select your fleet size.";
  if (!message) fieldErrors.message = "Please enter a message.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return {
      status: "error",
      message: "Too many messages in a short time. Please try again later.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "FleetGuard <onboarding@resend.dev>";
  const to =
    process.env.CONTACT_TO_EMAIL ??
    from.match(/<(.+)>/)?.[1] ??
    from;

  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set; message dropped");
    return { status: "error" };
  }

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `[FleetGuard contact] ${name}${company ? ` — ${company}` : ""} (${fleetSize})`,
        html: `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px">
          <p><strong>Name:</strong> ${escape(name)}</p>
          <p><strong>Email:</strong> ${escape(email)}</p>
          ${company ? `<p><strong>Company:</strong> ${escape(company)}</p>` : ""}
          <p><strong>Fleet size:</strong> ${escape(fleetSize)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escape(message)}</p>
        </div>`,
      }),
    });

    if (!res.ok) {
      console.error("[contact] Resend error:", res.status, await res.text());
      return { status: "error" };
    }
  } catch (err) {
    console.error("[contact] Failed to send:", err);
    return { status: "error" };
  }

  return { status: "success" };
}
