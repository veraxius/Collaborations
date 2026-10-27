/**
 * MCS-150 biennial update schedule (FMCSA): the last digit of the USDOT number
 * sets the month (1-9 = Jan-Sep, 0 = October) and the second-to-last digit sets
 * odd or even years. The update is due by the last day of that month.
 */
export function cleanUsdot(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  return digits.length >= 3 && digits.length <= 9 ? digits : null;
}

export function mcs150Schedule(usdot) {
  const digits = String(usdot ?? "").replace(/\D/g, "");
  if (digits.length < 2) return null;
  const last = Number(digits[digits.length - 1]);
  const prev = Number(digits[digits.length - 2]);
  return { month: last === 0 ? 10 : last, evenYears: prev % 2 === 0 };
}

const iso = (d) => d.toISOString().slice(0, 10);

/** Next MCS-150 due date (YYYY-MM-DD, UTC) on or after `from`, or null. */
export function mcs150NextDue(usdot, from = new Date()) {
  const schedule = mcs150Schedule(usdot);
  if (!schedule) return null;
  const today = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  for (let year = from.getUTCFullYear(); year <= from.getUTCFullYear() + 3; year++) {
    if ((year % 2 === 0) !== schedule.evenYears) continue;
    const lastDay = Date.UTC(year, schedule.month, 0); // day 0 of next month = last day of this one
    if (lastDay >= today) return iso(new Date(lastDay));
  }
  return null;
}
