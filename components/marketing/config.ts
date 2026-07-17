/**
 * Shared constants for the marketing site.
 *
 * Auth routes verified in the codebase:
 * - Sign in:  app/(auth)/login/page.tsx  -> /login
 * - Sign up:  app/(auth)/register/page.tsx -> /register  (/signup redirects here)
 * - Product:  app/app/* -> /app
 */
export const SIGNIN_ROUTE = "/login";
export const SIGNUP_ROUTE = "/register";
export const DASHBOARD_ROUTE = "/app";

/**
 * Support email shown across the marketing site. No real support address
 * exists in the repo config, so when NEXT_PUBLIC_SUPPORT_EMAIL is unset the
 * site omits email mentions and points to /contact instead.
 */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

export const SITE_NAME = "FleetGuard";
