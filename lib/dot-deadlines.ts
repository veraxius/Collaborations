/**
 * Recurring federal deadlines for small motor carriers.
 * Sources: FMCSA (MCS-150 biennial update), IRS (Form 2290 HVUT), IFTA Inc.
 * (quarterly returns) and UCR. Always confirm with the issuing agency.
 */
export type Deadline = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  detail: string;
};

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** MCS-150: month from the last digit (1-9 = Jan-Sep, 0 = Oct); odd/even year from the second-to-last digit. */
export function mcs150Months(usdot: string): { month: number; evenYears: boolean } | null {
  const digits = usdot.replace(/\D/g, "");
  if (digits.length < 2) return null;
  const last = Number(digits[digits.length - 1]);
  const prev = Number(digits[digits.length - 2]);
  return { month: last === 0 ? 10 : last, evenYears: prev % 2 === 0 };
}

export function buildDeadlines(opts: {
  usdot: string;
  hasHeavyVehicles: boolean;
  usesIfta: boolean;
  from?: Date;
  months?: number;
}): Deadline[] {
  const from = opts.from ?? new Date();
  const horizon = new Date(from);
  horizon.setUTCMonth(horizon.getUTCMonth() + (opts.months ?? 24));
  const start = iso(from.getUTCFullYear(), from.getUTCMonth() + 1, from.getUTCDate());
  const end = iso(horizon.getUTCFullYear(), horizon.getUTCMonth() + 1, horizon.getUTCDate());
  const out: Deadline[] = [];
  const add = (d: Deadline) => {
    if (d.date >= start && d.date <= end) out.push(d);
  };

  for (let y = from.getUTCFullYear(); y <= horizon.getUTCFullYear(); y++) {
    const mcs = mcs150Months(opts.usdot);
    if (mcs && (y % 2 === 0) === mcs.evenYears) {
      add({
        id: `mcs150-${y}`,
        title: "MCS-150 biennial update",
        date: iso(y, mcs.month, lastDay(y, mcs.month)),
        detail: "Update your motor carrier registration with FMCSA by the last day of this month.",
      });
    }
    add({
      id: `ucr-${y}`,
      title: "UCR annual registration",
      date: iso(y, 12, 31),
      detail: "Unified Carrier Registration for the coming year. Pay before the year ends.",
    });
    if (opts.hasHeavyVehicles) {
      add({
        id: `hvut-${y}`,
        title: "Form 2290 (HVUT) due",
        date: iso(y, 8, 31),
        detail: "Heavy Vehicle Use Tax for the tax period starting July 1 (vehicles 55,000 lbs and over).",
      });
    }
    if (opts.usesIfta) {
      for (const [m, label] of [
        [1, "Q4 (Oct-Dec)"],
        [4, "Q1 (Jan-Mar)"],
        [7, "Q2 (Apr-Jun)"],
        [10, "Q3 (Jul-Sep)"],
      ] as const) {
        add({
          id: `ifta-${y}-${m}`,
          title: `IFTA return, ${label}`,
          date: iso(y, m, m === 1 || m === 7 ? 31 : m === 4 ? 30 : 31),
          detail: "Quarterly fuel tax return, due the last day of the month after the quarter ends.",
        });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** RFC 5545 all-day events with two alarms (14 and 3 days before). */
export function toICS(deadlines: Deadline[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FleetGuard//DOT Calendar//EN", "CALSCALE:GREGORIAN"];
  for (const d of deadlines) {
    const day = d.date.replace(/-/g, "");
    const next = new Date(`${d.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const endDay = next.toISOString().slice(0, 10).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${d.id}@fleetguard`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${endDay}`,
      `SUMMARY:${esc(d.title)}`,
      `DESCRIPTION:${esc(d.detail)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(d.title)} in 14 days`,
      "TRIGGER:-P14D",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(d.title)} in 3 days`,
      "TRIGGER:-P3D",
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
