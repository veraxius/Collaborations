"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "./api";

export type Role = "owner" | "manager" | "viewer";

export type Company = {
  id: string;
  name: string;
  email: string;
  contactName?: string | null;
  phone?: string | null;
  country?: string | null;
  vertical?: string;
  usdot?: string | null;
  emailVerified?: boolean;
  reminderOffsets?: string;
  reminderEmails?: string;
  notifyDrivers?: boolean;
  weeklyDigest?: boolean;
  plan?: "free" | "pro";
  limits?: { vehicles: number; drivers: number; team: number } | null;
  /** The signed-in person (the owner, or a team member). */
  user?: { email: string; name: string; role: Role };
};

/** Viewers can look but not change anything. */
export function canEdit(company: Company | null | undefined): boolean {
  return company?.user?.role !== "viewer";
}

export function isOwner(company: Company | null | undefined): boolean {
  return (company?.user?.role ?? "owner") === "owner";
}

export function useCompany(requireAuth = true) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setCompany(null);
      setLoading(false);
      if (requireAuth) router.replace("/login");
      return;
    }
    try {
      const data = await api<{ company: Company }>("/api/me");
      setCompany(data.company);
    } catch {
      setToken(null);
      setCompany(null);
      if (requireAuth) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [requireAuth, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { company, loading, refresh, setCompany };
}

type CompanyContextValue = {
  company: Company | null;
  refresh: () => Promise<void>;
  setCompany: (c: Company | null) => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

/** Shares the signed-in company with every page under /app so they do not each fetch it again. */
export function CompanyProvider({ value, children }: { value: CompanyContextValue; children: ReactNode }) {
  return createElement(CompanyContext.Provider, { value }, children);
}

/** The company from the app layout. Falls back to an empty value outside of it. */
export function useCurrentCompany(): CompanyContextValue {
  return useContext(CompanyContext) ?? { company: null, refresh: async () => {}, setCompany: () => {} };
}

type Session = { token: string; company: Company };

async function startSession(path: string, body: Record<string, unknown>): Promise<Company> {
  const data = await api<Session>(path, { method: "POST", body: body as unknown as BodyInit });
  setToken(data.token);
  return data.company;
}

export const login = (email: string, password: string) => startSession("/api/auth/login", { email, password });

export const register = (name: string, email: string, password: string, vertical = "trucking", usdot = "") =>
  startSession("/api/auth/register", { name, email, password, vertical, usdot });

export async function requestPasswordReset(email: string) {
  await api("/api/auth/forgot", { method: "POST", body: { email } as unknown as BodyInit });
}

export const resetPassword = (id: string, token: string, password: string, kind: "c" | "m" = "c") =>
  startSession("/api/auth/reset", { id, token, password, kind });

export const acceptInvite = (id: string, token: string, password: string) =>
  startSession("/api/auth/accept-invite", { id, token, password });

export async function verifyEmail(id: string, token: string) {
  await api("/api/auth/verify", { method: "POST", body: { id, token } as unknown as BodyInit });
}

export async function resendVerification() {
  await api("/api/auth/resend-verification", { method: "POST" });
}

/** Changes the password and keeps this browser signed in with the fresh token. */
export async function changePassword(current: string, next: string) {
  const data = await api<{ ok: boolean; token?: string }>("/api/me/password", {
    method: "POST",
    body: { current, next } as unknown as BodyInit,
  });
  if (data.token) setToken(data.token);
}

export function logout() {
  setToken(null);
}
