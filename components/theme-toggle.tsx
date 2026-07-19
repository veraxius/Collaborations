"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "fg_theme"; // "light" | "dark"; absent = follow the browser/OS

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Circular light/dark toggle for the app. Behavior:
 * - No saved choice → follows the browser/OS preference live (auto dark at
 *   night, light by day, if the user's browser does that). Defaults to light
 *   when the browser has no dark preference.
 * - Clicking sets an explicit choice. If that choice matches the system
 *   preference, the override is dropped so auto-switching keeps working.
 * - The `dark` class lives on <html> only while an /app page is mounted, so
 *   the marketing site stays light.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    setDark(stored ? stored === "dark" : systemPrefersDark());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) setDark(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next === systemPrefersDark()) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
    >
      {dark ? (
        /* Sun */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
          </g>
        </svg>
      ) : (
        /* Moon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.6 14.2A8.6 8.6 0 0 1 9.8 3.4a8.6 8.6 0 1 0 10.8 10.8Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
