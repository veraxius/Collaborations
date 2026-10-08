"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "./api";
import { IS_PRIVATE } from "./brand";

export type PublicConfig = { mode: "saas" | "private"; registrationOpen: boolean };

/** Runtime config from the API (e.g. whether sign-up is still open on a private install). */
export function usePublicConfig(): PublicConfig {
  const [config, setConfig] = useState<PublicConfig>({
    mode: IS_PRIVATE ? "private" : "saas",
    registrationOpen: !IS_PRIVATE,
  });
  useEffect(() => {
    fetch(`${getApiBase()}/api/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setConfig({ mode: c.mode, registrationOpen: Boolean(c.registrationOpen) }))
      .catch(() => {});
  }, []);
  return config;
}
