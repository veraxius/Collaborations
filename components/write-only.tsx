"use client";

import type { ReactNode } from "react";
import { canEdit, useCurrentCompany } from "@/lib/auth-client";

/**
 * Hides controls that change data from read-only (viewer) members. The server
 * enforces the same rule: this only avoids showing buttons that would fail.
 */
export function WriteOnly({ children }: { children: ReactNode }) {
  const { company } = useCurrentCompany();
  return canEdit(company) ? <>{children}</> : null;
}

/** Disables every field and button inside it for viewers. */
export function ReadOnlyFieldset({ children }: { children: ReactNode }) {
  const { company } = useCurrentCompany();
  return (
    <fieldset disabled={!canEdit(company)} className="m-0 min-w-0 border-0 p-0">
      {children}
    </fieldset>
  );
}
