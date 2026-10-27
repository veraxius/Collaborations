/** Plan rules. Pure functions so they can be tested without a database. */
export const FREE_LIMITS = { vehicles: 3, drivers: 3, team: 1 };
export const PAID_LIMITS = { team: 10 };
export const PAID_STATUSES = ["active", "on_trial", "past_due"];

/**
 * A company has the full product when its subscription is active (or in its
 * grace period), or when it cancelled but the paid period has not ended yet.
 * Private installs are licensed as a whole.
 */
export function isPaid(company, { isPrivate = false, now = new Date() } = {}) {
  if (isPrivate) return true;
  if (!company) return false;
  if (PAID_STATUSES.includes(company.subscriptionStatus)) return true;
  if (company.subscriptionStatus === "cancelled" && company.planEndsAt) {
    return new Date(company.planEndsAt).getTime() > now.getTime();
  }
  return false;
}

export function teamLimit(company, opts) {
  return isPaid(company, opts) ? PAID_LIMITS.team : FREE_LIMITS.team;
}
