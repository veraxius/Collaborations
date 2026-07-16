"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "./api";

export type Company = {
  id: string;
  name: string;
  email: string;
  contactName?: string | null;
  phone?: string | null;
  country?: string | null;
};

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

export async function login(email: string, password: string) {
  const data = await api<{ token: string; company: Company }>("/api/auth/login", {
    method: "POST",
    body: { email, password } as any,
  });
  setToken(data.token);
  return data.company;
}

export async function register(name: string, email: string, password: string) {
  const data = await api<{ token: string; company: Company }>("/api/auth/register", {
    method: "POST",
    body: { name, email, password } as any,
  });
  setToken(data.token);
  return data.company;
}

export function logout() {
  setToken(null);
}
