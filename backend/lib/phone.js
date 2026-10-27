/**
 * Normalize a phone number to E.164 ("+14155550123") or return null.
 * Numbers with a leading "+" are kept as long as they have 8-15 digits.
 * Without a "+", 10 digits (or 11 starting with 1) are treated as US/Canada.
 */
export function normalizePhone(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const plus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (plus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
