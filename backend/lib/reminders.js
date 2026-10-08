import prisma from "./prisma.js";
import { sendEmail } from "./email.js";
import { captureSnapshot } from "./analytics.js";
import { daysUntil, documentTypeLabel } from "./expiry.js";
import { escapeHtml } from "./security.js";
import { BRAND_NAME } from "./brand.js";

const REMINDER_OFFSETS = [30, 15, 7, 1];

export async function runReminderSweep() {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 31);

  const documents = await prisma.document.findMany({
    where: { expiresAt: { lte: horizon } },
    include: { company: true, vehicle: true, driver: true },
  });

  let sent = 0;
  const appUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  for (const doc of documents) {
    const days = daysUntil(doc.expiresAt);
    const already = doc.sentReminders.split(",").filter(Boolean);

    let marker = null;
    if (days < 0) marker = "expired";
    else {
      const offset = REMINDER_OFFSETS.filter((o) => days <= o).sort((a, b) => a - b)[0];
      if (offset !== undefined) marker = String(offset);
    }
    if (!marker || already.includes(marker)) continue;

    const subjectPrefix =
      marker === "expired" ? "EXPIRED" : `Expires in ${days} day${days === 1 ? "" : "s"}`;
    const owner = doc.vehicle
      ? `Vehicle: ${doc.vehicle.name} (${doc.vehicle.plate})`
      : doc.driver
        ? `Driver: ${doc.driver.name}`
        : "Company document";
    const dateStr = new Date(doc.expiresAt).toISOString().slice(0, 10);

    try {
      await sendEmail(
        doc.company.email,
        `[${BRAND_NAME}] ${subjectPrefix}: ${doc.title}`,
        `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:520px">
          <p style="font-size:16px;font-weight:700;color:#101820;margin:0 0 16px">${escapeHtml(BRAND_NAME)}</p>
          <h2 style="color:${marker === "expired" ? "#c62828" : "#101820"};margin:0 0 12px">Document ${marker === "expired" ? "expired" : `expires in ${days} day${days === 1 ? "" : "s"}`}</h2>
          <p><strong>${escapeHtml(doc.title)}</strong> (${escapeHtml(documentTypeLabel(doc.type))})</p>
          <p>${escapeHtml(owner)}</p>
          <p>Expiry date: <strong>${dateStr}</strong></p>
          <p><a href="${appUrl}/app/documents/${doc.id}" style="display:inline-block;background:#101820;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Renew or update it</a></p>
          <p style="color:#888;font-size:12px">Once renewed, update the date in ${escapeHtml(BRAND_NAME)} and the countdown resets.</p>
        </div>`
      );
      await prisma.document.update({
        where: { id: doc.id },
        data: { sentReminders: [...already, marker].join(",") },
      });
      sent++;
    } catch (err) {
      console.error(`Failed reminder for ${doc.id}:`, err);
    }
  }

  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const c of companies) {
    try {
      await captureSnapshot(c.id);
    } catch (err) {
      console.error(`Snapshot failed for ${c.id}:`, err);
    }
  }

  return { sent };
}
