import prisma from "./prisma.js";
import { daysUntil, documentTypeLabel, expiryStatus } from "./expiry.js";

export function countStatuses(docs) {
  const counts = { expired: 0, expiring: 0, ok: 0 };
  for (const d of docs) counts[expiryStatus(d.expiresAt)]++;
  return counts;
}

export function healthScore({ expired, expiring, ok }) {
  const total = expired + expiring + ok;
  if (total === 0) return 100;
  return Math.round((100 * (ok + 0.5 * expiring)) / total);
}

export async function captureSnapshot(companyId) {
  const docs = await prisma.document.findMany({
    where: { companyId },
    select: { expiresAt: true },
  });
  const counts = countStatuses(docs);
  const score = healthScore(counts);
  const date = new Date().toISOString().slice(0, 10);
  try {
    await prisma.complianceSnapshot.upsert({
      where: { companyId_date: { companyId, date } },
      update: { score, ...counts },
      create: { companyId, date, score, ...counts },
    });
  } catch {
    // race ok
  }
}

export async function logEvent(companyId, kind, label, extra = {}) {
  await prisma.activityEvent.create({
    data: {
      companyId,
      kind,
      label,
      onTime: extra.onTime ?? null,
      daysDelta: extra.daysDelta ?? null,
    },
  });
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthBuckets(count, direction) {
  const now = new Date();
  const buckets = [];
  for (let i = 0; i < count; i++) {
    const offset = direction === "future" ? i : i - (count - 1);
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 1));
    const year = start.getUTCFullYear();
    const label =
      year === now.getUTCFullYear()
        ? MONTH_NAMES[start.getUTCMonth()]
        : `${MONTH_NAMES[start.getUTCMonth()]} ${String(year).slice(2)}`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

export async function getAnalytics(companyId) {
  const since = new Date();
  since.setDate(since.getDate() - 92);
  const renewWindowStart = monthBuckets(6, "past")[0].start;

  const [docs, snapshots, renewEvents, feed] = await Promise.all([
    prisma.document.findMany({
      where: { companyId },
      select: { expiresAt: true, type: true, cost: true, currency: true },
    }),
    prisma.complianceSnapshot.findMany({
      where: { companyId, date: { gte: since.toISOString().slice(0, 10) } },
      orderBy: { date: "asc" },
    }),
    prisma.activityEvent.findMany({
      where: { companyId, kind: "document_renewed", createdAt: { gte: renewWindowStart } },
      select: { onTime: true, createdAt: true },
    }),
    prisma.activityEvent.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, label: true, createdAt: true },
    }),
  ]);

  const counts = countStatuses(docs);
  const total = docs.length;
  const score = healthScore(counts);

  const trend = snapshots.map((s) => ({ label: s.date.slice(5), value: s.score }));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 30);
  const target = targetDate.toISOString().slice(0, 10);
  const past = [...snapshots].reverse().find((s) => s.date <= target);
  const delta30 = past ? score - past.score : null;

  const now = new Date();
  const future = monthBuckets(6, "future");
  const upcoming = future.map((b, i) => ({
    label: b.label,
    value: docs.filter((d) => {
      const t = new Date(d.expiresAt).getTime();
      return t >= Math.max(now.getTime(), b.start.getTime()) && t < b.end.getTime();
    }).length,
    highlight: i === 0,
  }));

  const past6 = monthBuckets(6, "past");
  const renewals = past6.map((b) => ({
    label: b.label,
    a: renewEvents.filter((e) => e.createdAt >= b.start && e.createdAt < b.end && e.onTime === true).length,
    b: renewEvents.filter((e) => e.createdAt >= b.start && e.createdAt < b.end && e.onTime === false).length,
  }));

  const costed = docs.filter((d) => d.cost != null && new Date(d.expiresAt).getTime() >= now.getTime());
  const currencyFreq = new Map();
  for (const d of costed) currencyFreq.set(d.currency, (currencyFreq.get(d.currency) ?? 0) + 1);
  const topCurrency = [...currencyFreq.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "USD";
  const budgetMonths = future.map((b) => ({
    label: b.label,
    value: Math.round(
      costed
        .filter(
          (d) =>
            d.currency === topCurrency &&
            new Date(d.expiresAt).getTime() >= Math.max(now.getTime(), b.start.getTime()) &&
            new Date(d.expiresAt).getTime() < b.end.getTime()
        )
        .reduce((sum, d) => sum + (d.cost ?? 0), 0)
    ),
  }));

  const typeMap = new Map();
  for (const d of docs) {
    const entry = typeMap.get(d.type) ?? { total: 0, bad: 0 };
    entry.total++;
    if (expiryStatus(d.expiresAt) === "expired") entry.bad++;
    typeMap.set(d.type, entry);
  }
  const types = [...typeMap.entries()]
    .map(([type, v]) => ({ label: documentTypeLabel(type), ...v }))
    .sort((x, y) => y.total - x.total);

  return {
    counts,
    total,
    score,
    delta30,
    trend,
    upcoming,
    renewals,
    renewalsTotal: renewEvents.length,
    budget: {
      currency: topCurrency,
      months: budgetMonths,
      mixed: currencyFreq.size > 1,
      total: budgetMonths.reduce((s, m) => s + m.value, 0),
    },
    types,
    feed,
  };
}

export { daysUntil };
