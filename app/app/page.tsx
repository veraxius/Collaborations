"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreRing } from "@/components/charts";
import { api } from "@/lib/api";
import {
  daysUntil,
  documentTypeLabel,
  expiryStatus,
  timeAgo,
} from "@/lib/expiry";
import { StatusBadge } from "./status-badge";

type Doc = {
  id: string;
  title: string;
  type: string;
  expiresAt: string;
  vehicle?: { name: string; plate: string } | null;
  driver?: { name: string } | null;
};

type Event = { id: string; label: string; createdAt: string };

type DashboardData = {
  counts: { expired: number; expiring: number; ok: number };
  score: number;
  vehicleCount: number;
  driverCount: number;
  documents: Doc[];
  events: Event[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <div className="card py-10 text-center text-neutral-500">
        {error || "Could not load dashboard."}
      </div>
    );
  }

  const { counts, score, vehicleCount, driverCount, documents, events } = data;
  const attention = documents
    .filter((d) => expiryStatus(d.expiresAt) !== "ok")
    .slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/app/analytics" className="btn-secondary">
            Analytics
          </Link>
          <Link href="/app/documents/new" className="btn-primary">
            Add document
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <ScoreRing score={score} size={92} />
          <div>
            <p className="text-sm font-medium text-neutral-400">Fleet health</p>
            <p className="mt-0.5 text-sm leading-snug text-neutral-500">
              {counts.expired > 0
                ? "Documents need action"
                : counts.expiring > 0
                  ? "Renewals coming up"
                  : "All in order"}
            </p>
          </div>
        </div>
        <Link href="/app/documents?status=expired" className="card transition hover:shadow-lift">
          <p className="text-sm font-medium text-neutral-400">Expired</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-red-500">
            {counts.expired}
          </p>
        </Link>
        <Link href="/app/documents?status=expiring" className="card transition hover:shadow-lift">
          <p className="text-sm font-medium text-neutral-400">Expiring in 30 days</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-amber-500">
            {counts.expiring}
          </p>
        </Link>
        <Link href="/app/documents?status=ok" className="card transition hover:shadow-lift">
          <p className="text-sm font-medium text-neutral-400">Up to date</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-emerald-500">
            {counts.ok}
          </p>
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/app/vehicles" className="card flex items-baseline justify-between py-4 transition hover:shadow-lift">
          <span className="text-sm font-medium text-neutral-500">Vehicles</span>
          <span className="text-2xl font-semibold tabular-nums">{vehicleCount}</span>
        </Link>
        <Link href="/app/drivers" className="card flex items-baseline justify-between py-4 transition hover:shadow-lift">
          <span className="text-sm font-medium text-neutral-500">Drivers</span>
          <span className="text-2xl font-semibold tabular-nums">{driverCount}</span>
        </Link>
        <Link href="/app/documents" className="card flex items-baseline justify-between py-4 transition hover:shadow-lift">
          <span className="text-sm font-medium text-neutral-500">Documents</span>
          <span className="text-2xl font-semibold tabular-nums">{documents.length}</span>
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Needs attention</h2>
          {attention.length === 0 ? (
            <div className="card mt-3 py-10 text-center text-neutral-400">
              {documents.length === 0 ? (
                <>
                  No documents yet.{" "}
                  <Link href="/app/documents/new" className="font-medium text-accent-600">
                    Add your first document
                  </Link>{" "}
                  to start tracking expirations.
                </>
              ) : (
                "Everything is up to date."
              )}
            </div>
          ) : (
            <div className="card mt-3 divide-y divide-neutral-100 p-0">
              {attention.map((doc) => {
                const days = daysUntil(doc.expiresAt);
                return (
                  <Link
                    key={doc.id}
                    href={`/app/documents/${doc.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="truncate text-sm text-neutral-400">
                        {documentTypeLabel(doc.type)}
                        {doc.vehicle && ` · ${doc.vehicle.name} (${doc.vehicle.plate})`}
                        {doc.driver && ` · ${doc.driver.name}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={expiryStatus(doc.expiresAt)} />
                      <p className="mt-1 text-xs tabular-nums text-neutral-400">
                        {days < 0
                          ? `${-days} day${days === -1 ? "" : "s"} ago`
                          : `${days} day${days === 1 ? "" : "s"} left`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          {events.length === 0 ? (
            <div className="card mt-3 py-10 text-center text-sm text-neutral-400">
              Activity will appear here.
            </div>
          ) : (
            <div className="card mt-3 divide-y divide-neutral-100 p-0">
              {events.map((e) => (
                <div key={e.id} className="px-5 py-3.5">
                  <p className="text-sm leading-snug text-neutral-700">{e.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(e.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
