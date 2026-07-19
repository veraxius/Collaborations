"use client";

import { Check } from "lucide-react";
import { CHECKOUT_URL } from "@/components/marketing/config";

const PLAN_BULLETS = [
  "Unlimited trucks and drivers",
  "Unlimited documents and files",
  "Email reminders at 30, 15, 7, and 1 day",
  "Traffic-light dashboard and analytics",
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
    <div className="mx-auto mt-10 max-w-md">
      {/* The whole card is the checkout link */}
      <a
        href={CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mk-card block p-8 text-center transition hover:shadow-[0_14px_36px_rgb(16_24_32/0.14)]"
      >
        <h3 className="font-condensed text-2xl font-semibold text-asphalt">
          Fleet plan
        </h3>
        <p className="mt-4 font-plex text-5xl font-medium text-asphalt">
          $29
          <span className="text-2xl text-asphalt/60">/mo</span>
        </p>
        <p className="mt-2 font-plex text-sm text-asphalt/60">
          Everything included. One flat price.
        </p>
        <PlanBullets bullets={PLAN_BULLETS} />
        <span className="mk-btn mk-btn-primary mt-8 w-full">
          Subscribe — $29/month
        </span>
      </a>
      <p className="mt-4 text-center text-sm text-asphalt/60">
        Want to look around first? Create a free account and explore the app —
        no credit card required.
      </p>
    </div>
  );
}
