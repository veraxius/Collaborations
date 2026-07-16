"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { getToken } from "@/lib/api";

const features = [
  {
    title: "One glance, full picture.",
    body: "A traffic-light dashboard shows every policy, inspection and license across your fleet. Nothing hides.",
  },
  {
    title: "Reminders that pay for themselves.",
    body: "Automatic emails 30, 15, 7 and 1 day before anything expires. One prevented violation covers years of FleetGuard.",
  },
  {
    title: "Paperwork, attached.",
    body: "The PDF or photo of every document lives next to its expiry date. Audits stop being a scavenger hunt.",
  },
];

const steps = [
  { n: "1", title: "Add your fleet", body: "Trucks and drivers, in minutes." },
  { n: "2", title: "Log the documents", body: "Insurance, inspections, licenses, permits." },
  { n: "3", title: "Relax", body: "We watch the calendar for you." },
];

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, []);

  return (
    <main>
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="shrink-0">
            <Logo size={26} className="text-[15px]" />
          </span>
          <nav className="flex shrink-0 items-center justify-end gap-2">
            {loggedIn ? (
              <Link href="/app" className="btn-primary">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-neutral-500 transition hover:text-neutral-900"
                >
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Start free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-28 pt-28 text-center sm:pt-36">
        <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
          Fleet documents expire.
          <br />
          Your trucks shouldn&apos;t stop.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-pretty text-xl leading-relaxed text-neutral-500">
          Insurance, inspections, licenses and permits — tracked, with an email
          before anything lapses.
        </p>
        <div className="mt-10 flex items-center justify-center gap-6">
          <Link href="/signup" className="btn-primary px-7 py-3 text-base">
            Start free trial
          </Link>
          <a href="#how" className="text-base font-medium text-accent-500 hover:underline">
            Learn more ›
          </a>
        </div>
        <p className="mt-5 text-sm text-neutral-400">
          14 days free. No credit card required.
        </p>
      </section>

      <section className="bg-neutral-100/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-3xl bg-white p-8 shadow-lift">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-neutral-50 p-5">
                <p className="text-xs font-medium text-neutral-400">Expired</p>
                <p className="mt-1 text-3xl font-semibold text-red-500">1</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-5">
                <p className="text-xs font-medium text-neutral-400">Expiring soon</p>
                <p className="mt-1 text-3xl font-semibold text-amber-500">3</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-5">
                <p className="text-xs font-medium text-neutral-400">Up to date</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-500">24</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                ["Liability insurance — Truck 08", "6 days left", "text-amber-600"],
                ["DOT inspection — Truck 12", "Expired", "text-red-500"],
              ].map(([title, status, tone]) => (
                <div
                  key={title as string}
                  className="flex items-center justify-between rounded-2xl bg-neutral-50 px-5 py-4"
                >
                  <span className="text-sm font-medium text-neutral-700">{title}</span>
                  <span className={`text-sm font-medium ${tone}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto grid max-w-5xl gap-16 px-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="text-center sm:text-left">
              <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-neutral-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-20 bg-neutral-100/40 py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            Up and running in one afternoon.
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <p className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-accent-500 shadow-soft">
                  {s.n}
                </p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-neutral-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-28">
        <div className="mx-auto max-w-sm px-6 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">One plan.</h2>
          <p className="mt-3 text-lg text-neutral-500">Everything included. Cancel anytime.</p>

          <div className="mt-12">
            <p className="text-6xl font-semibold tracking-tight">
              $29
              <span className="ml-1 text-xl font-normal text-neutral-400">/mo</span>
            </p>
            <ul className="mt-10 space-y-4 text-[15px] text-neutral-600">
              <li>Unlimited vehicles and drivers</li>
              <li>Unlimited documents and files</li>
              <li>Email reminders — 30 / 15 / 7 / 1 days</li>
              <li>Traffic-light dashboard</li>
              <li>Performance analytics and trends</li>
            </ul>
            <Link href="/signup" className="btn-primary mt-12 w-full py-3 text-base">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-neutral-100/40 py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-balance text-4xl font-semibold tracking-tight">
            The cheapest insurance is the reminder you didn&apos;t miss.
          </h2>
          <Link href="/signup" className="btn-primary mt-10 px-8 py-3 text-base">
            Start 14-day free trial
          </Link>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} FleetGuard
      </footer>
    </main>
  );
}
