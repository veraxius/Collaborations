"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/fleetguard-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyProvider, logout, resendVerification, useCompany } from "@/lib/auth-client";
import { IS_PRIVATE } from "@/lib/brand";

const nav = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/documents", label: "Documents" },
  { href: "/app/vehicles", label: "Vehicles" },
  { href: "/app/drivers", label: "Drivers" },
  ...(IS_PRIVATE ? [] : [{ href: "/app/price", label: "Upgrade" }]),
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { company, loading, refresh, setCompany } = useCompany();
  const [resent, setResent] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!company) return null;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  async function handleResend() {
    setResent("sending");
    try {
      await resendVerification();
      setResent("sent");
    } catch {
      setResent("error");
    }
  }

  const isOwnerRole = (company.user?.role ?? "owner") === "owner";

  return (
    <CompanyProvider value={{ company, refresh, setCompany }}>
      <div className="min-h-screen">
        <header className="glass-header sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <Link href="/app" className="shrink-0 text-[15px]">
              <Logo size={24} />
            </Link>
            {/* Full nav only where it truly fits; below lg it moves to its own scrollable row */}
            <nav className="hidden gap-1 lg:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition hover:bg-neutral-100 hover:text-neutral-900 ${
                    pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
              <Link
                href="/app/settings"
                className="hidden max-w-40 truncate text-sm text-neutral-400 transition hover:text-neutral-700 md:inline"
              >
                {company.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="whitespace-nowrap text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
              >
                Log out
              </button>
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 lg:hidden">
            {[...nav, { href: "/app/settings", label: "Settings" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {company.emailVerified === false && isOwnerRole && (
          <div className="bg-red-50 text-red-900">
            <p className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
              <b>Confirm your email to receive reminders.</b> We sent a link to {company.email}.{" "}
              {resent === "sent" ? (
                <span className="font-semibold">Sent. Check your inbox.</span>
              ) : (
                <button type="button" onClick={handleResend} disabled={resent === "sending"} className="font-semibold underline">
                  {resent === "sending" ? "Sending…" : "Send it again"}
                </button>
              )}
              {resent === "error" && <span className="ml-2">Couldn&apos;t send it. Try again later.</span>}
            </p>
          </div>
        )}

        {company.plan === "free" && company.limits && isOwnerRole && (
          <div className="bg-amber-50 text-amber-900">
            <p className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
              Free plan: up to {company.limits.vehicles} vehicles and {company.limits.drivers} drivers.{" "}
              <Link href="/app/price" className="font-semibold underline">
                Go unlimited for $29/month
              </Link>
            </p>
          </div>
        )}

        {company.user?.role === "viewer" && (
          <div className="bg-neutral-100 text-neutral-700">
            <p className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">You have read-only access to this account.</p>
          </div>
        )}

        <main className="mx-auto min-h-[75vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </CompanyProvider>
  );
}
