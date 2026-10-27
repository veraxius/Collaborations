"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { api } from "@/lib/api";
import { register } from "@/lib/auth-client";
import { VERTICALS } from "@/lib/expiry";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [vertical, setVertical] = useState("trucking");
  // ?plan=fleet comes from the pricing page: after sign-up go straight to the plan page.
  const [wantsFleet, setWantsFleet] = useState(false);
  const [name, setName] = useState("");
  const [usdot, setUsdot] = useState("");
  const [lookup, setLookup] = useState<{ state: "idle" | "loading" | "found" | "missing"; text?: string }>({ state: "idle" });

  /** Look the carrier up by USDOT to prefill the company name. Entirely optional: any failure is silent. */
  async function lookupUsdot() {
    const digits = usdot.replace(/\D/g, "");
    if (digits.length < 3) return;
    setLookup({ state: "loading" });
    try {
      const data = await api<{ carrier: { legalName: string | null; allowedToOperate: boolean | null } }>(`/api/dot/${digits}`);
      const found = data.carrier.legalName;
      if (found && !name.trim()) setName(found);
      setLookup({ state: "found", text: found ? `Found: ${found}` : "Found" });
    } catch (err) {
      const status = (err as { status?: number }).status;
      setLookup(status === 404 ? { state: "missing", text: "We couldn't find that USDOT number." } : { state: "idle" });
    }
  }

  // Niche landing pages link here with ?vertical=nemt (etc.) to preselect it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("vertical");
    if (v && VERTICALS.some((o) => o.value === v)) setVertical(v);
    setWantsFleet(params.get("plan") === "fleet");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await register(name, String(fd.get("email")), String(fd.get("password")), vertical, usdot);
      router.push(wantsFleet ? "/app/price" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card w-full max-w-md">
      <div className="text-center">
        <Link href="/" className="inline-block text-[15px]">
          <Logo size={28} />
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-neutral-500">Free to start. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="usdot">USDOT number <span className="font-normal text-neutral-400">(optional)</span></label>
          <input
            className="input"
            id="usdot"
            inputMode="numeric"
            autoComplete="off"
            value={usdot}
            onChange={(e) => setUsdot(e.target.value.replace(/\D/g, "").slice(0, 9))}
            onBlur={lookupUsdot}
            placeholder="e.g. 1234567"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            {lookup.state === "loading"
              ? "Looking it up…"
              : lookup.text ?? "We'll add your MCS-150 update date as your first reminder."}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="name">Company name</label>
          <input
            className="input"
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Logistics"
          />
        </div>
        <div>
          <label className="label" htmlFor="vertical">What do you operate?</label>
          <select
            className="input"
            id="vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          >
            {VERTICALS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary w-full py-2.5" disabled={pending}>
          {pending ? "Please wait…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link className="font-medium text-accent-600" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
