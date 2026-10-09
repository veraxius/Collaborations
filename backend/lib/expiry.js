export const EXPIRING_WINDOW_DAYS = 30;

export const DOCUMENT_TYPES = [
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
  { value: "background_check", label: "Background check" },
  { value: "training", label: "Training" },
  { value: "lift_inspection", label: "Lift / securement inspection" },
  { value: "contract", label: "Contract / agreement" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export const VERTICALS = [
  { value: "trucking", label: "Trucking" },
  { value: "nemt", label: "Non-emergency medical transportation" },
  { value: "last-mile", label: "Contracted last-mile delivery" },
  { value: "shuttle", label: "Independent shuttle fleet" },
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
