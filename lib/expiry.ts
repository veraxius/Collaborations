export type ExpiryStatus = "expired" | "expiring" | "ok";

export const EXPIRING_WINDOW_DAYS = 30;

function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

export function daysUntil(date: Date | string): number {
  const ms = toDate(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function expiryStatus(expiresAt: Date | string): ExpiryStatus {
  const days = daysUntil(expiresAt);
  if (days < 0) return "expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "ok";
}

export function formatDate(d: Date | string): string {
  return toDate(d).toISOString().slice(0, 10);
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

type Option = { value: string; label: string };

export const DOCUMENT_TYPES: Option[] = [
  { value: "insurance", label: "Insurance" },
  { value: "inspection", label: "Inspection" },
  { value: "license", label: "Driver license" },
  { value: "medical_card", label: "DOT medical card" },
  { value: "mvr", label: "MVR review" },
  { value: "clearinghouse", label: "Clearinghouse query" },
  { value: "drug_alcohol", label: "Drug & alcohol" },
  { value: "permit", label: "Permit" },
  { value: "registration", label: "Registration" },
  { value: "tax", label: "Tax / IFTA" },
  { value: "ucr", label: "UCR" },
  { value: "hvut", label: "HVUT (Form 2290)" },
  { value: "mcs150", label: "MCS-150 update" },
  { value: "certification", label: "Certification" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

/**
 * Common DOT items with their regulatory validity, used to prefill the
 * document form and auto-compute the expiry from the issue date.
 * `scope` says who the document normally belongs to.
 */
export type DocPreset = {
  id: string;
  title: string;
  type: string;
  scope: "driver" | "vehicle" | "company";
  months: number;
  issuer?: string;
};

export const DOC_PRESETS: DocPreset[] = [
  { id: "cdl", title: "CDL", type: "license", scope: "driver", months: 48, issuer: "State DMV" },
  { id: "medical", title: "DOT medical card", type: "medical_card", scope: "driver", months: 24, issuer: "FMCSA medical examiner" },
  { id: "mvr", title: "Annual MVR review", type: "mvr", scope: "driver", months: 12 },
  { id: "clearinghouse", title: "Clearinghouse annual query", type: "clearinghouse", scope: "driver", months: 12, issuer: "FMCSA Clearinghouse" },
  { id: "annual-inspection", title: "Annual DOT inspection", type: "inspection", scope: "vehicle", months: 12 },
  { id: "registration", title: "Vehicle registration", type: "registration", scope: "vehicle", months: 12, issuer: "State DMV" },
  { id: "hvut", title: "HVUT (Form 2290)", type: "hvut", scope: "vehicle", months: 12, issuer: "IRS" },
  { id: "coi", title: "Insurance certificate (COI)", type: "insurance", scope: "company", months: 12 },
  { id: "ucr", title: "UCR registration", type: "ucr", scope: "company", months: 12 },
  { id: "mcs150", title: "MCS-150 biennial update", type: "mcs150", scope: "company", months: 24, issuer: "FMCSA" },
  { id: "ifta", title: "IFTA license", type: "tax", scope: "company", months: 12 },
  { id: "irp", title: "IRP apportioned registration", type: "registration", scope: "company", months: 12 },
];

/** Add whole calendar months to an ISO date (YYYY-MM-DD), clamping the day. */
export function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export const VEHICLE_TYPES: Option[] = [
  { value: "truck", label: "Truck" },
  { value: "trailer", label: "Trailer" },
  { value: "van", label: "Van" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "other", label: "Other" },
];

export const VEHICLE_STATUSES: Option[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "In maintenance" },
  { value: "inactive", label: "Inactive" },
];

export const DRIVER_STATUSES: Option[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "inactive", label: "Inactive" },
];

export const CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS", "CLP", "COP", "PEN", "UYU",
];

export function labelFor(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function documentTypeLabel(value: string): string {
  return labelFor(DOCUMENT_TYPES, value);
}

export function timeAgo(d: Date | string): string {
  const date = toDate(d);
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const days = h / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return date.toISOString().slice(0, 10);
}
