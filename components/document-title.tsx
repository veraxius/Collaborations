"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function titleForPath(pathname: string): string {
  if (pathname === "/app" || pathname === "/app/") return "FleetGuard";
  if (pathname === "/" || pathname === "") return "FleetGuard";

  const exact: Record<string, string> = {
    "/app/analytics": "Analytics",
    "/app/documents": "Documents",
    "/app/documents/new": "New document",
    "/app/vehicles": "Vehicles",
    "/app/drivers": "Drivers",
    "/app/settings": "Settings",
    "/app/price": "Price",
    "/pricing": "Price",
    "/faq": "FAQ",
    "/contact": "Contact",
    "/login": "Log in",
    "/register": "Sign up",
    "/signup": "Sign up",
    "/terms": "Terms",
    "/privacy": "Privacy",
    "/onboarding": "Onboarding",
  };

  if (exact[pathname]) return `FleetGuard — ${exact[pathname]}`;

  if (pathname.startsWith("/app/documents/")) return "FleetGuard — Document";
  if (pathname.startsWith("/app/vehicles/")) return "FleetGuard — Vehicle";
  if (pathname.startsWith("/app/drivers/")) return "FleetGuard — Driver";
  if (pathname.startsWith("/app/")) return "FleetGuard — App";
  if (pathname.startsWith("/dashboard")) return "FleetGuard — Dashboard";
  if (pathname.startsWith("/onboarding")) return "FleetGuard — Onboarding";

  // Fallback: last path segment, title-cased
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  const label = segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return label ? `FleetGuard — ${label}` : "FleetGuard";
}

/** Keeps the browser tab title in sync with the current route. */
export function DocumentTitle() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}
