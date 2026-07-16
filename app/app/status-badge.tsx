import type { ExpiryStatus } from "@/lib/expiry";

const statusStyles: Record<ExpiryStatus, string> = {
  expired: "bg-red-50 text-red-600 ring-red-100",
  expiring: "bg-amber-50 text-amber-600 ring-amber-100",
  ok: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

const statusLabels: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring: "Expiring soon",
  ok: "OK",
};

export function StatusBadge({ status }: { status: ExpiryStatus }) {
  return (
    <Pill
      tone={status === "expired" ? "red" : status === "expiring" ? "amber" : "green"}
      label={statusLabels[status]}
      className={statusStyles[status]}
    />
  );
}

const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  blue: "bg-accent-50 text-accent-600 ring-accent-100",
  neutral: "bg-neutral-100 text-neutral-500 ring-neutral-200",
};

export function Pill({
  tone,
  label,
  className,
}: {
  tone: "green" | "amber" | "red" | "blue" | "neutral";
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className ?? tones[tone]}`}
    >
      {label}
    </span>
  );
}
