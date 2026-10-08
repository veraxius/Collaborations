/**
 * Build-time branding for private (white-label) installations.
 * Everything defaults to the FleetGuard SaaS look, so the public site is
 * unaffected when none of these variables are set.
 */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "FleetGuard";
export const BRAND_LOGO_URL = process.env.NEXT_PUBLIC_BRAND_LOGO_URL || "";
export const IS_PRIVATE = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "private";

/** Optional accent overrides (hex). `on` is the text color used on accent buttons. */
export const BRAND_ACCENT = process.env.NEXT_PUBLIC_BRAND_ACCENT || "";
export const BRAND_ACCENT_DARK = process.env.NEXT_PUBLIC_BRAND_ACCENT_DARK || "";
export const BRAND_ON_ACCENT = process.env.NEXT_PUBLIC_BRAND_ON_ACCENT || "";

/** Inline CSS variables for <html>, only emitted for the overrides that are set. */
export function brandCssVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  if (BRAND_ACCENT) vars["--accent-500"] = BRAND_ACCENT;
  if (BRAND_ACCENT_DARK) {
    vars["--accent-600"] = BRAND_ACCENT_DARK;
    vars["--accent-700"] = BRAND_ACCENT_DARK;
  }
  if (BRAND_ON_ACCENT) vars["--on-accent"] = BRAND_ON_ACCENT;
  return vars;
}
