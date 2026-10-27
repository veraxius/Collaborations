import { expiryStatus } from "./expiry.js";

export function countStatuses(docs, now) {
  const counts = { expired: 0, expiring: 0, ok: 0 };
  for (const d of docs) counts[expiryStatus(d.expiresAt, now)]++;
  return counts;
}

/** 0-100: up-to-date documents count fully, expiring ones half, expired ones zero. */
export function healthScore({ expired, expiring, ok }) {
  const total = expired + expiring + ok;
  if (total === 0) return 100;
  return Math.round((100 * (ok + 0.5 * expiring)) / total);
}
