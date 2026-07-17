"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoIcon } from "@/components/ui/fleetguard-logo";
import { getToken } from "@/lib/api";
import {
  DASHBOARD_ROUTE,
  SIGNIN_ROUTE,
  SIGNUP_ROUTE,
} from "@/components/marketing/config";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#what-we-track", label: "What we track" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoIcon size={26} />
      <span
        className={`font-condensed text-2xl font-bold tracking-tight ${
          dark ? "text-chalk" : "text-asphalt"
        }`}
      >
        FleetGuard
      </span>
    </span>
  );
}

export function MarketingNavbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-chalk transition-[padding] duration-200 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="FleetGuard home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-asphalt/70 transition-colors hover:text-asphalt"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loggedIn ? (
            <Link
              href={DASHBOARD_ROUTE}
              className="mk-btn mk-btn-primary px-5 py-2 text-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={SIGNIN_ROUTE}
                className="mk-btn mk-btn-secondary px-5 py-2 text-sm"
              >
                Sign in
              </Link>
              <Link
                href={SIGNUP_ROUTE}
                className="mk-btn mk-btn-primary px-5 py-2 text-sm"
              >
                Start free trial
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-asphalt lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 top-0 z-50 flex flex-col bg-asphalt lg:hidden">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              aria-label="FleetGuard home"
              onClick={() => setMenuOpen(false)}
            >
              <Wordmark dark />
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-chalk"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col items-start gap-2 px-6 pt-8"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-condensed text-3xl font-semibold text-chalk transition-colors hover:text-signal-amber"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-8 flex w-full flex-col gap-3">
              {loggedIn ? (
                <Link
                  href={DASHBOARD_ROUTE}
                  onClick={() => setMenuOpen(false)}
                  className="mk-btn mk-btn-primary w-full"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={SIGNUP_ROUTE}
                    onClick={() => setMenuOpen(false)}
                    className="mk-btn mk-btn-primary w-full"
                  >
                    Start free trial
                  </Link>
                  <Link
                    href={SIGNIN_ROUTE}
                    onClick={() => setMenuOpen(false)}
                    className="mk-btn mk-btn-secondary-dark w-full"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
