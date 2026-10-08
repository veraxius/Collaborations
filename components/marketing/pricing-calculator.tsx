"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { CHECKOUT_URL, SIGNUP_ROUTE } from "@/components/marketing/config";

const FREE_BULLETS = [
  "Up to 3 vehicles and 3 drivers",
  "Unlimited documents and files",
  "Email reminders at 30, 15, 7, and 1 day",
  "Traffic-light dashboard",
  "No credit card, no time limit",
];

const PLAN_BULLETS = [
  "Unlimited trucks and drivers",
  "Unlimited documents and files",
  "Email reminders at 30, 15, 7, and 1 day",
  "Traffic-light dashboard and analytics",
  "AI assistant and CSV export",
  "Cancel anytime",
];

function PlanBullets({ bullets }: { bullets: string[] }) {
  return (
    <ul className="mt-6 space-y-3 text-left">
      {bullets.map((bullet) => (
        <li key={bullet} className="flex items-start gap-2.5">
          <Check
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-compliance-green"
          />
          <span className="text-[15px] leading-snug text-asphalt/80">
            {bullet}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PricingCalculator() {
  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
      <div className="mk-card flex flex-col p-8 text-center">
        <h3 className="font-condensed text-2xl font-semibold text-asphalt">Starter</h3>
        <p className="mt-4 font-plex text-5xl font-medium text-asphalt">
          $0
          <span className="text-2xl text-asphalt/60">/mo</span>
        </p>
        <p className="mt-2 font-plex text-sm text-asphalt/60">For owner-operators and tiny fleets.</p>
        <PlanBullets bullets={FREE_BULLETS} />
        <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-secondary mt-auto w-full pt-0">
          Start free
        </Link>
      </div>

      <a
        href={CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mk-card flex flex-col p-8 text-center shadow-[0_14px_36px_rgb(16_24_32/0.10)] transition hover:shadow-[0_14px_36px_rgb(16_24_32/0.14)]"
      >
        <h3 className="font-condensed text-2xl font-semibold text-asphalt">Fleet</h3>
        <p className="mt-4 font-plex text-5xl font-medium text-asphalt">
          $29
          <span className="text-2xl text-asphalt/60">/mo</span>
        </p>
        <p className="mt-2 font-plex text-sm text-asphalt/60">
          One flat price. No per-truck fees.
        </p>
        <PlanBullets bullets={PLAN_BULLETS} />
        <span className="mk-btn mk-btn-primary mt-8 w-full">Subscribe — $29/month</span>
      </a>
      <p className="text-center text-[15px] text-asphalt/75 md:col-span-2">
        Large fleet, agency or consultant?{" "}
        <Link
          href="/enterprise"
          className="font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4"
        >
          Get your own private, branded installation
        </Link>
        .
      </p>
    </div>
  );
}
