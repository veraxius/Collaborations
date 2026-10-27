import { cleanUsdot } from "./deadlines.js";

/**
 * Carrier lookup by USDOT number through FMCSA's QCMobile API.
 * Needs a free web key (FMCSA_WEBKEY). The response shape is read defensively
 * because third-party guides and FMCSA's own docs disagree on some fields.
 */
export class DotLookupError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.code = code; // bad_usdot | not_configured | upstream
  }
}

export function parseCarrier(data) {
  const content = data?.content;
  const carrier = content?.carrier ?? (Array.isArray(content) ? content[0]?.carrier : null);
  if (!carrier || typeof carrier !== "object") return null;
  const allowed = String(carrier.allowedToOperate ?? "").toUpperCase();
  return {
    usdot: carrier.dotNumber != null ? String(carrier.dotNumber) : null,
    legalName: carrier.legalName ? String(carrier.legalName) : null,
    dbaName: carrier.dbaName ? String(carrier.dbaName) : null,
    allowedToOperate: allowed === "Y" ? true : allowed === "N" ? false : null,
    powerUnits: Number.isFinite(Number(carrier.totalPowerUnits)) ? Number(carrier.totalPowerUnits) : null,
  };
}

export async function lookupCarrier(input, { webKey = process.env.FMCSA_WEBKEY, fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const usdot = cleanUsdot(input);
  if (!usdot) throw new DotLookupError("bad_usdot", "Enter a valid USDOT number.");
  if (!webKey) throw new DotLookupError("not_configured", "USDOT lookup is not configured.");

  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${usdot}?webKey=${encodeURIComponent(webKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (res.status === 404) return null;
    if (!res.ok) throw new DotLookupError("upstream", `FMCSA responded ${res.status}`);
    return parseCarrier(await res.json());
  } catch (err) {
    if (err instanceof DotLookupError) throw err;
    // Never include the URL (it carries the key) in the error.
    throw new DotLookupError("upstream", err?.name === "AbortError" ? "FMCSA timed out" : "FMCSA request failed");
  } finally {
    clearTimeout(timer);
  }
}
