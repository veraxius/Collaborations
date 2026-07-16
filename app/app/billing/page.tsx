"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { daysUntil } from "@/lib/expiry";
import { useCompany } from "@/lib/auth-client";

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-400">Loading billing…</p>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const { company, access } = useCompany();
  const [lemonConfigured, setLemonConfigured] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    api<{ lemonConfigured: boolean }>("/api/billing")
      .then((d) => setLemonConfigured(d.lemonConfigured))
      .catch(() => {});
  }, []);

  async function startCheckout() {
    setError("");
    setPending("checkout");
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPending(null);
    }
  }

  async function openPortal() {
    setError("");
    setPending("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal unavailable");
      setPending(null);
    }
  }

  if (!company) return null;

  const active = company.subscriptionStatus === "active";
  const trialDaysLeft = daysUntil(company.trialEndsAt);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>

      {success && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Subscription activated — thank you! It may take a few seconds to reflect here.
        </p>
      )}
      {canceled && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. You can subscribe whenever you are ready.
        </p>
      )}

      <div className="card mt-6">
        <p className="text-sm font-medium text-neutral-500">Current plan</p>
        {active ? (
          <>
            <p className="mt-1 text-xl font-semibold text-emerald-700">Fleet plan — active</p>
            <p className="mt-2 text-sm text-neutral-600">
              Unlimited vehicles, drivers and documents, with email reminders.
            </p>
            <button
              type="button"
              className="btn-secondary mt-6"
              onClick={openPortal}
              disabled={pending === "portal"}
            >
              {pending === "portal" ? "Opening…" : "Manage subscription"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-xl font-semibold">
              Free trial{" "}
              {access
                ? `— ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                : "— ended"}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Subscribe to the Fleet plan for <strong>$29/month</strong> to keep
              unlimited access and email reminders.
            </p>
            {lemonConfigured ? (
              <button
                type="button"
                className="btn-primary mt-6 px-6 py-2.5"
                onClick={startCheckout}
                disabled={pending === "checkout"}
              >
                {pending === "checkout" ? "Redirecting…" : "Subscribe — $29/month"}
              </button>
            ) : (
              <p className="mt-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
                Payments are not configured yet. Set LEMONSQUEEZY_API_KEY,
                LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_VARIANT_ID in your
                backend environment to enable checkout.
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
