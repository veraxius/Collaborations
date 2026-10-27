"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { checkoutUrlFor } from "@/components/marketing/config";
import { isOwner, useCurrentCompany } from "@/lib/auth-client";

const PLAN_BULLETS = [
  "Unlimited trucks and drivers (free plan: 3 + 3)",
  "Unlimited documents and files",
  "Email reminders at your own days (30, 15, 7, 1 by default)",
  "Team members with manager and viewer roles",
  "Traffic-light dashboard and analytics",
  "AI assistant and CSV export",
  "Cancel anytime",
];

export default function PricePage() {
  const { company } = useCurrentCompany();
  const owner = isOwner(company);
  const isPro = company?.plan === "pro";
  // The link is built only once the account is known, so a purchase is always tied to it.
  const checkoutUrl = company && owner ? checkoutUrlFor({ id: company.id, email: company.email }) : null;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Plans</h1>
      <p className="mt-2 text-center text-sm text-neutral-500">One paid plan. Everything included.</p>

      <div className="card mt-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Fleet plan</h2>
        <p className="mt-4 text-5xl font-semibold tracking-tight">
          $29
          <span className="ml-1 text-xl font-normal text-neutral-400">/mo</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">Flat monthly price. No per-truck fees.</p>
        <ul className="mt-8 space-y-3 text-left text-[15px] text-neutral-600">
          {PLAN_BULLETS.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5">
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="mt-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            You&apos;re on the Fleet plan.{" "}
            <Link href="/app/settings" className="font-semibold underline">Manage your subscription</Link>
          </div>
        ) : checkoutUrl ? (
          <>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 w-full py-3 text-base">
              Subscribe — $29/month
            </a>
            <p className="mt-3 text-xs text-neutral-500">
              Checkout opens in a new tab with <b>{company?.email}</b>. Keep that email: your plan switches on
              automatically a few seconds after you pay.
            </p>
          </>
        ) : (
          <p className="mt-8 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {company && !owner
              ? "Only the account owner can change the plan."
              : "Loading your account…"}
          </p>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-neutral-400">
        You can keep exploring the app for free. Payment is optional.
      </p>
    </div>
  );
}
