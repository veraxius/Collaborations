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
  { value: "permit", label: "Permit" },
  { value: "registration", label: "Registration" },
  { value: "tax", label: "Tax / IFTA" },
  { value: "certification", label: "Certification" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

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
