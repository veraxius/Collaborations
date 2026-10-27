import { FREE_LIMITS, isPaid } from "./plan.js";
import { IS_PRIVATE } from "./brand.js";

export const companyIsPaid = (company) => isPaid(company, { isPrivate: IS_PRIVATE });

/** The owner as a "user", for the same shape the UI gets for team members. */
export function ownerUser(company) {
  return { email: company.email, name: company.contactName || company.name, role: "owner" };
}

/** What the browser is allowed to know about a company (never the password hash). */
export function publicCompany(company, user = null) {
  const paid = companyIsPaid(company);
  return {
    plan: paid ? "pro" : "free",
    limits: paid ? null : FREE_LIMITS,
    id: company.id,
    name: company.name,
    email: company.email,
    contactName: company.contactName,
    phone: company.phone,
    country: company.country,
    vertical: company.vertical,
    usdot: company.usdot ?? null,
    emailVerified: company.emailVerified,
    reminderOffsets: company.reminderOffsets,
    reminderEmails: company.reminderEmails,
    notifyDrivers: company.notifyDrivers,
    weeklyDigest: company.weeklyDigest,
    createdAt: company.createdAt,
    user: user ?? ownerUser(company),
  };
}

/** An error payload when the free plan has no room for another vehicle or driver, else null. */
export async function checkPlanLimit(prisma, companyId, kind) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || companyIsPaid(company)) return null;
  const count =
    kind === "vehicles"
      ? await prisma.vehicle.count({ where: { companyId } })
      : await prisma.driver.count({ where: { companyId } });
  if (count < FREE_LIMITS[kind]) return null;
  return {
    code: "plan_limit",
    error: `The free plan includes up to ${FREE_LIMITS[kind]} ${kind}. Upgrade to FleetGuard ($29/month) for unlimited.`,
  };
}
