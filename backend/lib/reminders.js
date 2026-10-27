import { sendEmail as realSendEmail } from "./email.js";
import { sendSms as realSendSms } from "./sms.js";
import { daysUntil, documentTypeLabel } from "./expiry.js";
import { escapeHtml } from "./security.js";
import { BRAND_NAME } from "./brand.js";
import { emailShell, appUrl } from "./email-templates.js";
import { isValidEmail, normalizeOffsets, parseEmails, pickMarker } from "./reminder-config.js";
import { normalizePhone } from "./phone.js";
import { countStatuses } from "./scoring.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Real dependencies by default; tests pass fakes. Heavy modules load lazily. */
async function resolveDeps(deps = {}) {
  return {
    prisma: deps.prisma ?? (await import("./prisma.js")).default,
    captureSnapshot: deps.captureSnapshot ?? (await import("./analytics.js")).captureSnapshot,
    sendEmail: deps.sendEmail ?? realSendEmail,
    sendSms: deps.sendSms ?? realSendSms,
    now: deps.now ?? new Date(),
    log: deps.log ?? console,
  };
}

function ownerLabel(doc) {
  if (doc.vehicle) return `Vehicle: ${doc.vehicle.name} (${doc.vehicle.plate})`;
  if (doc.driver) return `Driver: ${doc.driver.name}`;
  return "Company document";
}

const dateOnly = (d) => new Date(d).toISOString().slice(0, 10);

export function dueText(days) {
  if (days < 0) return `expired ${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "expires today";
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
}

/** Owner, extra recipients and accepted managers. The owner is always first. */
export function ownerRecipients(company) {
  const set = new Set([String(company.email).toLowerCase()]);
  for (const e of parseEmails(company.reminderEmails) ?? []) set.add(e);
  for (const m of company.team ?? []) {
    if (m.passwordHash && m.role === "manager" && isValidEmail(m.email)) set.add(m.email.toLowerCase());
  }
  return [...set];
}

export function buildReminderEmail({ doc, days, forDriver = false, brand = BRAND_NAME, company }) {
  const expired = days < 0;
  const subject = forDriver
    ? `[${brand}] Your ${doc.title} ${dueText(days)}`
    : `[${brand}] ${expired ? "EXPIRED" : dueText(days).replace("expires", "Expires")}: ${doc.title}`;
  const url = `${appUrl()}/app/documents/${doc.id}`;
  const bodyHtml = forDriver
    ? `<p>Your <strong>${escapeHtml(doc.title)}</strong> (${escapeHtml(documentTypeLabel(doc.type))}) ${escapeHtml(dueText(days))}.</p>
       <p>Expiry date: <strong>${dateOnly(doc.expiresAt)}</strong></p>
       <p>Please renew it and let ${escapeHtml(company.name)} know.</p>`
    : `<p><strong>${escapeHtml(doc.title)}</strong> (${escapeHtml(documentTypeLabel(doc.type))})</p>
       <p>${escapeHtml(ownerLabel(doc))}</p>
       <p>Expiry date: <strong>${dateOnly(doc.expiresAt)}</strong> (${escapeHtml(dueText(days))})</p>`;
  const html = emailShell({
    brand,
    heading: expired ? "Document expired" : `Document ${dueText(days)}`,
    headingColor: expired ? "#c62828" : "#101820",
    bodyHtml,
    cta: forDriver ? undefined : { label: "Renew or update it", url },
    footer: forDriver ? undefined : "Once renewed, update the date and the countdown resets.",
  });
  return { subject, html };
}

export function buildReminderSms({ doc, days, company, brand = BRAND_NAME }) {
  return `[${brand}] Your ${doc.title} ${dueText(days)} (${dateOnly(doc.expiresAt)}). Please renew it and tell ${company.name}.`;
}

/**
 * Send the reminders that are due. Safe to run more than once a day: each
 * (document, reminder) pair is recorded after the owner's email is accepted,
 * and a failed send is retried on the next run.
 */
export async function runReminderSweep(deps = {}) {
  const { prisma, sendEmail, sendSms, captureSnapshot, now, log } = await resolveDeps(deps);
  const horizon = new Date(now.getTime() + 366 * DAY_MS);
  const documents = await prisma.document.findMany({
    where: { expiresAt: { lte: horizon } },
    include: { company: { include: { team: true } }, vehicle: true, driver: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of documents) {
    const company = doc.company;
    // Never email addresses that nobody has proven to own.
    if (!company.emailVerified) {
      skipped++;
      continue;
    }
    const days = daysUntil(doc.expiresAt, now);
    const marker = pickMarker(days, normalizeOffsets(company.reminderOffsets));
    const already = String(doc.sentReminders ?? "").split(",").filter(Boolean);
    if (!marker || already.includes(marker)) continue;

    const { subject, html } = buildReminderEmail({ doc, days, company });
    const recipients = ownerRecipients(company);
    try {
      await sendEmail(recipients[0], subject, html);
    } catch (err) {
      failed++;
      log.error(`[reminders] could not email owner for document ${doc.id}:`, err?.message ?? err);
      continue; // not recorded: retried on the next run
    }
    for (const extra of recipients.slice(1)) {
      try {
        await sendEmail(extra, subject, html);
      } catch (err) {
        log.error(`[reminders] extra recipient failed for document ${doc.id}:`, err?.message ?? err);
      }
    }

    if (company.notifyDrivers && doc.driver) {
      if (doc.driver.email && isValidEmail(doc.driver.email)) {
        try {
          const mail = buildReminderEmail({ doc, days, company, forDriver: true });
          await sendEmail(doc.driver.email, mail.subject, mail.html);
        } catch (err) {
          log.error(`[reminders] driver email failed for document ${doc.id}:`, err?.message ?? err);
        }
      }
      if (normalizePhone(doc.driver.phone)) {
        try {
          await sendSms(doc.driver.phone, buildReminderSms({ doc, days, company }));
        } catch (err) {
          log.error(`[reminders] driver SMS failed for document ${doc.id}:`, err?.message ?? err);
        }
      }
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { sentReminders: [...already, marker].join(",") },
    });
    sent++;
  }

  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const c of companies) {
    try {
      await captureSnapshot(c.id);
    } catch (err) {
      log.error(`[reminders] snapshot failed for ${c.id}:`, err?.message ?? err);
    }
  }

  return { sent, failed, skipped };
}

/** Monday summary of what needs attention. Skipped when there is nothing to report. */
export async function runWeeklyDigest(deps = {}) {
  const { prisma, sendEmail, now, log } = await resolveDeps(deps);
  const companies = await prisma.company.findMany({
    where: { weeklyDigest: true, emailVerified: true },
    include: { documents: { include: { vehicle: true, driver: true } } },
  });

  let sent = 0;
  for (const company of companies) {
    const docs = company.documents ?? [];
    const counts = countStatuses(docs, now);
    const attention = docs
      .filter((d) => daysUntil(d.expiresAt, now) <= 30)
      .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    if (attention.length === 0) continue;

    const rows = attention
      .slice(0, 10)
      .map((d) => {
        const days = daysUntil(d.expiresAt, now);
        const color = days < 0 ? "#c62828" : "#8a5a00";
        return `<tr><td style="padding:6px 0"><strong>${escapeHtml(d.title)}</strong><br><span style="color:#666;font-size:13px">${escapeHtml(ownerLabel(d))}</span></td><td style="padding:6px 0;text-align:right;color:${color};white-space:nowrap">${escapeHtml(dueText(days))}</td></tr>`;
      })
      .join("");
    const more = attention.length > 10 ? `<p style="color:#666">…and ${attention.length - 10} more.</p>` : "";
    const html = emailShell({
      heading: "Your week in compliance",
      bodyHtml: `<p>${counts.expired} expired, ${counts.expiring} expiring within 30 days, ${counts.ok} up to date.</p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>${more}`,
      cta: { label: "Open your dashboard", url: `${appUrl()}/app` },
      footer: `You get this summary every Monday. <a href="${escapeHtml(appUrl())}/app/settings" style="color:#888">Turn it off in Settings</a>.`,
    });

    const to = [String(company.email).toLowerCase(), ...(parseEmails(company.reminderEmails) ?? [])];
    try {
      await sendEmail(to[0], `[${BRAND_NAME}] ${counts.expired > 0 ? `${counts.expired} expired, ` : ""}${attention.length} need attention`, html);
      for (const extra of to.slice(1)) await sendEmail(extra, `[${BRAND_NAME}] Weekly summary`, html).catch(() => {});
      sent++;
    } catch (err) {
      log.error(`[digest] failed for ${company.id}:`, err?.message ?? err);
    }
  }
  return { sent };
}

/** One friendly nudge to accounts that signed up 3-14 days ago and still have no documents. */
export async function runOnboardingNudge(deps = {}) {
  const { prisma, sendEmail, now, log } = await resolveDeps(deps);
  const companies = await prisma.company.findMany({
    where: {
      nudgeSentAt: null,
      emailVerified: true,
      createdAt: { gte: new Date(now.getTime() - 14 * DAY_MS), lte: new Date(now.getTime() - 3 * DAY_MS) },
      documents: { none: {} },
    },
  });

  let sent = 0;
  for (const company of companies) {
    const html = emailShell({
      heading: "Your first reminder is one document away",
      bodyHtml: `<p>Add one document with its expiry date and ${escapeHtml(BRAND_NAME)} will warn you before it lapses. The quick-start list fills in the expiry for you.</p>`,
      cta: { label: "Add your first document", url: `${appUrl()}/app/documents/new` },
      footer: "We only send this once.",
    });
    try {
      await sendEmail(company.email, `[${BRAND_NAME}] Add your first document`, html);
      await prisma.company.update({ where: { id: company.id }, data: { nudgeSentAt: now } });
      sent++;
    } catch (err) {
      log.error(`[nudge] failed for ${company.id}:`, err?.message ?? err);
    }
  }
  return { sent };
}
