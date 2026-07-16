"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AreaChart,
  BarChart,
  HBarList,
  ScoreRing,
  StackedBarChart,
  scoreColor,
} from "@/components/charts";
import { api } from "@/lib/api";
import { formatMoney, timeAgo } from "@/lib/expiry";

type AnalyticsData = {
  counts: { expired: number; expiring: number; ok: number };
  total: number;
  score: number;
  delta30: number | null;
  trend: { label: string; value: number }[];
  upcoming: { label: string; value: number; highlight?: boolean }[];
  renewals: { label: string; a: number; b: number }[];
  renewalsTotal: number;
  budget: {
    currency: string;
    months: { label: string; value: number }[];
    mixed: boolean;
    total: number;
  };
  types: { label: string; total: number; bad: number }[];
  feed: { id: string; label: string; createdAt: string }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AnalyticsData>("/api/analytics")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading analytics…</p>;
  }

  if (error || !data) {
    return (
      <div className="card py-10 text-center text-neutral-500">
        {error || "Could not load analytics."}
      </div>
    );
  }

  const a = data;
  const hasDocs = a.total > 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-neutral-500">
        How your fleet compliance is performing over time.
      </p>

      {!hasDocs ? (
        <div className="card mt-8 py-16 text-center text-neutral-400">
          Add vehicles, drivers and documents first — analytics will build
          itself from your data.{" "}
          <Link href="/app/documents/new" className="font-medium text-accent-600">
            Add a document
          </Link>
        </div>
      ) : (
        <>
          <div className="card mt-8 flex flex-wrap items-center gap-8">
            <ScoreRing score={a.score} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-400">Fleet health score</p>
              <p className="mt-1 text-lg font-medium leading-snug">
                {a.score >= 85
                  ? "Your fleet is in great shape."
                  : a.score >= 60
                    ? "Some renewals need your attention."
                    : "Action needed: expired documents are hurting your score."}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {a.counts.ok} up to date · {a.counts.expiring} expiring soon ·{" "}
                {a.counts.expired} expired — {a.total} documents total
                {a.delta30 !== null && (
                  <span
                    className="ml-2 font-semibold tabular-nums"
                    style={{ color: a.delta30 >= 0 ? "#10b981" : "#ef4444" }}
                  >
                    {a.delta30 >= 0 ? "+" : ""}
                    {a.delta30} vs 30 days ago
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold tracking-tight">Compliance trend</h2>
              <p className="mb-4 mt-0.5 text-sm text-neutral-400">
                Daily fleet health score, last 90 days
              </p>
              <AreaChart points={a.trend} />
              {a.trend.length < 3 && (
                <p className="mt-3 text-xs text-neutral-400">
                  The trend builds one point per day — check back in a few days
                  to see your history take shape.
                </p>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold tracking-tight">Upcoming expirations</h2>
              <p className="mb-4 mt-0.5 text-sm text-neutral-400">
                Documents expiring per month, next 6 months
              </p>
              <BarChart bars={a.upcoming} />
            </div>

            <div className="card">
              <h2 className="font-semibold tracking-tight">Renewal discipline</h2>
              <p className="mb-4 mt-0.5 text-sm text-neutral-400">
                Renewals done before vs after the deadline, last 6 months
              </p>
              {a.renewalsTotal === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400">
                  No renewals recorded yet. When a document is renewed with the
                  Renew button, it lands here — on time or late.
                </p>
              ) : (
                <StackedBarChart groups={a.renewals} aLabel="On time" bLabel="Late" />
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold tracking-tight">Renewal budget</h2>
              <p className="mb-4 mt-0.5 text-sm text-neutral-400">
                Cost of documents expiring per month ({a.budget.currency})
                {a.budget.mixed && " — other currencies excluded"}
              </p>
              {a.budget.total === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400">
                  Add a cost to your documents to plan the renewal budget per
                  month.
                </p>
              ) : (
                <BarChart
                  bars={a.budget.months}
                  formatValue={(v) => (v === 0 ? "" : formatMoney(v, a.budget.currency))}
                />
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold tracking-tight">Documents by type</h2>
              <p className="mb-4 mt-0.5 text-sm text-neutral-400">
                Where your paperwork concentrates — red is expired
              </p>
              <HBarList rows={a.types} />
            </div>

            <div className="card p-0">
              <div className="px-6 pt-6">
                <h2 className="font-semibold tracking-tight">Recent activity</h2>
                <p className="mt-0.5 text-sm text-neutral-400">Latest 12 events</p>
              </div>
              <div className="mt-3 max-h-80 divide-y divide-neutral-100 overflow-y-auto">
                {a.feed.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-neutral-400">
                    No activity yet.
                  </p>
                ) : (
                  a.feed.map((e) => (
                    <div key={e.id} className="px-6 py-3">
                      <p className="text-sm leading-snug text-neutral-700">{e.label}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(e.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-300">
            Score:{" "}
            <span style={{ color: scoreColor(90) }}>85-100 healthy</span> ·{" "}
            <span style={{ color: scoreColor(70) }}>60-84 watch</span> ·{" "}
            <span style={{ color: scoreColor(30) }}>below 60 act now</span>
          </p>
        </>
      )}
    </div>
  );
}
