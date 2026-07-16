export const EXPIRING_WINDOW_DAYS = 30;

export const DOCUMENT_TYPES = [
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

export const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "trailer", label: "Trailer" },
  { value: "van", label: "Van" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "other", label: "Other" },
];

export const VEHICLE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "In maintenance" },
  { value: "inactive", label: "Inactive" },
];

export const DRIVER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "inactive", label: "Inactive" },
];

export const CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS", "CLP", "COP", "PEN", "UYU",
];

export function daysUntil(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function expiryStatus(expiresAt) {
  const days = daysUntil(expiresAt);
  if (days < 0) return "expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "ok";
}

export function documentTypeLabel(value) {
  return DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function oneOf(value, options, fallback) {
  return options.some((o) => o.value === value) ? value : fallback;
}
