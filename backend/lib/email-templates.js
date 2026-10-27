import { escapeHtml } from "./security.js";
import { BRAND_NAME } from "./brand.js";

/**
 * One consistent, simple HTML email. `bodyHtml` must already be safe HTML:
 * build it with escapeHtml() for any user-provided value.
 */
export function emailShell({ heading, bodyHtml, cta, footer, brand = BRAND_NAME, headingColor = "#101820" }) {
  const button = cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#101820;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;max-width:540px;color:#101820;line-height:1.5">
  <p style="font-size:16px;font-weight:700;margin:0 0 18px">${escapeHtml(brand)}</p>
  <h2 style="color:${headingColor};margin:0 0 14px;font-size:22px">${escapeHtml(heading)}</h2>
  ${bodyHtml}
  ${button}
  ${footer ? `<p style="color:#888;font-size:12px;margin-top:28px">${footer}</p>` : ""}
</div>`;
}

export function appUrl() {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
