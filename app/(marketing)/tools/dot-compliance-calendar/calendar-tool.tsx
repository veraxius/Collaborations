"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildDeadlines, mcs150Months, toICS } from "@/lib/dot-deadlines";
import { getApiBase } from "@/lib/api";
import { SIGNUP_ROUTE } from "@/components/marketing/config";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function CalendarTool() {
  const [usdot, setUsdot] = useState("");
  const [heavy, setHeavy] = useState(true);
  const [ifta, setIfta] = useState(true);
  const [email, setEmail] = useState("");
  const [lead, setLead] = useState<"idle" | "sending" | "done" | "error">("idle");

  const valid = mcs150Months(usdot) !== null;
  const deadlines = useMemo(
    () => (valid ? buildDeadlines({ usdot, hasHeavyVehicles: heavy, usesIfta: ifta }) : []),
    [usdot, heavy, ifta, valid]
  );

  function download() {
    const blob = new Blob([toICS(deadlines)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dot-compliance-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLead("sending");
    try {
      const res = await fetch(`${getApiBase()}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usdot, source: "tool:dot-calendar" }),
      });
      setLead(res.ok ? "done" : "error");
    } catch {
      setLead("error");
    }
  }

  return (
    <div>
      <div className="mk-card p-6 sm:p-8">
        <label htmlFor="usdot" className="block font-condensed text-xl font-semibold text-asphalt">
          Your USDOT number
        </label>
        <input
          id="usdot"
          inputMode="numeric"
          autoComplete="off"
          value={usdot}
          onChange={(e) => setUsdot(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="e.g. 1234567"
          className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-plex text-lg text-asphalt"
        />
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-asphalt/80">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={heavy} onChange={(e) => setHeavy(e.target.checked)} />
            I run vehicles of 55,000 lbs or more (Form 2290)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={ifta} onChange={(e) => setIfta(e.target.checked)} />
            I run interstate and file IFTA
          </label>
        </div>
      </div>

      {valid && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="mk-h2 text-3xl text-asphalt">Your next 24 months</h2>
            <button type="button" onClick={download} className="mk-btn mk-btn-primary">
              Add to my calendar (.ics)
            </button>
          </div>
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {deadlines.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-asphalt">{d.title}</p>
                  <p className="text-sm text-asphalt/65">{d.detail}</p>
                </div>
                <p className="shrink-0 font-plex text-sm text-asphalt">{fmt(d.date)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-asphalt/60">
            Dates follow FMCSA, IRS, IFTA and UCR rules as published. Confirm against your own
            account. This is a planning aid, not legal advice. Per-driver and per-truck items
            (CDL, medical card, annual inspection, insurance) have their own dates — that&apos;s
            what FleetGuard tracks.
          </p>

          <div className="mt-8 rounded-[24px] bg-asphalt p-6 text-chalk sm:p-10">
            <h3 className="font-condensed text-3xl font-semibold">
              Now cover every driver and every truck.
            </h3>
            <p className="mt-2 max-w-2xl text-chalk/80">
              FleetGuard emails you 30, 15, 7 and 1 day before each expiration — CDLs, medical
              cards, inspections, insurance and these filings.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary">
                Create a free account
              </Link>
            </div>
            <form onSubmit={submitLead} className="mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              {lead === "done" ? (
                <p className="text-chalk/90">Thanks! We&apos;ll send you the checklist and tips.</p>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Or just email me the checklist"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-chalk placeholder:text-chalk/50"
                  />
                  <button className="mk-btn mk-btn-secondary-dark" disabled={lead === "sending"}>
                    Send
                  </button>
                </>
              )}
            </form>
            {lead === "error" && (
              <p className="mt-2 text-sm text-red-300">Couldn&apos;t send that. Please try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
