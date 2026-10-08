/**
 * Deployment settings. One codebase, two ways to run it:
 *  - SaaS (default): open sign-up, free/paid plans.
 *  - Private instance (DEPLOYMENT_MODE=private): dedicated install for one
 *    customer. Unlimited use, branded, and sign-up closes after the first
 *    admin account is created (unless ALLOW_REGISTRATION=1).
 */
export const BRAND_NAME = process.env.BRAND_NAME || "FleetGuard";
export const IS_PRIVATE = process.env.DEPLOYMENT_MODE === "private";
export const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION === "1";
