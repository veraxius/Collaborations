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

export default function PricePage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Price</h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        One plan. Everything included.
      </p>

      <a
        href={CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="card mt-8 block text-center transition hover:shadow-lift"
      >
        <h2 className="text-xl font-semibold tracking-tight">Fleet plan</h2>
        <p className="mt-4 text-5xl font-semibold tracking-tight">
          $29
          <span className="ml-1 text-xl font-normal text-neutral-400">/mo</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Flat monthly price. No per-truck fees.
        </p>
        <ul className="mt-8 space-y-3 text-left text-[15px] text-neutral-600">
          {PLAN_BULLETS.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5">
              <Check
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <span className="btn-primary mt-8 w-full py-3 text-base">
          Subscribe — $29/month
        </span>
      </a>
      <p className="mt-4 text-center text-sm text-neutral-400">
        You can keep exploring the app for free — payment is optional.
      </p>
    </div>
  );
}
