"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { SIGNUP_ROUTE } from "@/components/marketing/config";

const MONTHLY_PER_TRUCK = 5;
const MONTHLY_MIN = 79;
const ANNUAL_PER_TRUCK = 50;
const ANNUAL_MIN = 790;

function monthlyPrice(trucks: number) {
  return Math.max(MONTHLY_MIN, trucks * MONTHLY_PER_TRUCK);
}

function annualPrice(trucks: number) {
  return Math.max(ANNUAL_MIN, trucks * ANNUAL_PER_TRUCK);
}

const MONTHLY_BULLETS = [
  "14-day free trial, no credit card",
  "Email reminders at 30, 15, 7, and 1 day",
  "Cancel anytime",
  "White-glove onboarding available (+$149 one-time): send us your documents, we load your whole fleet",
];

const ANNUAL_BULLETS = [
  "Everything in Monthly",
  "2 months free",
  "White-glove onboarding included — we load your fleet for you",
  "Lock your price for 12 months",
];

function PlanBullets({ bullets }: { bullets: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
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
  const [trucks, setTrucks] = useState(8);

  const monthly = monthlyPrice(trucks);
  const annual = annualPrice(trucks);

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <div className="mk-card px-6 py-7 sm:px-9">
        <label
          htmlFor="truck-count"
          className="mk-label !mb-0 text-center sm:text-left"
        >
          How many trucks run under your authority?
        </label>
        <div className="mt-4 flex items-center gap-5">
          <input
            id="truck-count"
            type="range"
            min={1}
            max={100}
            value={trucks}
            onChange={(e) => setTrucks(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-signal-amber"
            aria-valuetext={`${trucks} trucks`}
          />
          <output
            htmlFor="truck-count"
            className="w-14 shrink-0 text-right font-plex text-2xl font-medium text-asphalt"
          >
            {trucks}
          </output>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Monthly */}
        <div className="mk-card flex flex-col p-8">
          <h3 className="font-condensed text-2xl font-semibold text-asphalt">
            Monthly
          </h3>
          <p className="mt-4 font-plex text-5xl font-medium text-asphalt">
            ${monthly.toLocaleString("en-US")}
            <span className="text-2xl text-asphalt/60">/mo</span>
          </p>
          <p className="mt-2 font-plex text-sm text-asphalt/60">
            $5 per truck per month · $79/month minimum
          </p>
          <PlanBullets bullets={MONTHLY_BULLETS} />
          <div className="mt-8 flex flex-1 items-end">
            <Link
              href={SIGNUP_ROUTE}
              className="mk-btn mk-btn-secondary w-full"
            >
              Start free trial
            </Link>
          </div>
        </div>

        {/* Annual */}
        <div className="mk-card relative flex flex-col p-8 shadow-[0_14px_36px_rgb(16_24_32/0.11)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[18px] bg-signal-amber/5"
          />
          <p className="mk-eyebrow absolute -top-3.5 left-6 bg-signal-amber text-asphalt">
            Best value — 2 months free
          </p>
          <h3 className="relative font-condensed text-2xl font-semibold text-asphalt">
            Annual
          </h3>
          <p className="mt-4 font-plex text-5xl font-medium text-asphalt">
            ${annual.toLocaleString("en-US")}
            <span className="text-2xl text-asphalt/60">/yr</span>
          </p>
          <p className="mt-2 font-plex text-sm text-asphalt/60">
            $50 per truck per year · $790/year minimum
          </p>
          <p className="mt-1 text-sm text-asphalt/70">
            That&apos;s 2 months free vs. monthly.
          </p>
          <PlanBullets bullets={ANNUAL_BULLETS} />
          <div className="mt-8 flex flex-1 items-end">
            <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary w-full">
              Start free trial
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-[15px] text-asphalt/70">
        Running more than 100 trucks, or managing several companies?{" "}
        <Link
          href="/contact"
          className="font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4 hover:text-asphalt/80"
        >
          Talk to us →
        </Link>
      </p>
    </div>
  );
}
