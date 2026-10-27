/** Reminder settings: parsing and the "which reminder is due now" rule. */
export const DEFAULT_OFFSETS = [30, 15, 7, 1];
export const MAX_OFFSETS = 6;
export const MAX_EXTRA_EMAILS = 5;

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/**
 * Parse "30, 15, 7, 1" (or an array) into unique whole days between 1 and 365,
 * largest first. Returns null when the input is not valid.
 */
export function parseOffsets(input) {
  const parts = Array.isArray(input) ? input : String(input ?? "").split(/[\s,;]+/);
  const values = [];
  for (const raw of parts) {
    if (raw === "" || raw === null || raw === undefined) continue;
    if (!/^\d+$/.test(String(raw).trim())) return null;
    const n = Number(raw);
    if (n < 1 || n > 365) return null;
    values.push(n);
  }
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.length === 0 || unique.length > MAX_OFFSETS) return null;
  return unique;
}

/** Offsets for a stored value, falling back to the default when it is missing or invalid. */
export function normalizeOffsets(stored) {
  return parseOffsets(stored) ?? [...DEFAULT_OFFSETS];
}

/**
 * Which reminder, if any, should go out for a document with `days` left?
 * "expired" once the date has passed, otherwise the smallest offset that is
 * still >= days. The caller skips markers it has already sent.
 */
export function pickMarker(days, offsets) {
  if (days < 0) return "expired";
  const candidates = offsets.filter((o) => days <= o);
  if (candidates.length === 0) return null;
  return String(Math.min(...candidates));
}

/** Parse a comma separated list of emails. Returns null when any entry is invalid or there are too many. */
export function parseEmails(input) {
  const list = (Array.isArray(input) ? input : String(input ?? "").split(/[,;\s]+/))
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(list)];
  if (unique.length > MAX_EXTRA_EMAILS) return null;
  if (!unique.every((e) => e.length <= 200 && EMAIL_RE.test(e))) return null;
  return unique;
}

export function isValidEmail(value) {
  return typeof value === "string" && value.length <= 200 && EMAIL_RE.test(value.trim());
}
