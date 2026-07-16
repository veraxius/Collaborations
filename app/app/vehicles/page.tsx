"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  expiryStatus,
  formatDate,
  labelFor,
} from "@/lib/expiry";
import { Pill, StatusBadge } from "../status-badge";

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  type: string;
  status: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  documents: { expiresAt: string }[];
  _count: { documents: number };
};

const statusTone = { active: "green", maintenance: "amber", inactive: "neutral" } as const;

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  function load() {
    return api<{ vehicles: Vehicle[] }>("/api/vehicles")
      .then((d) => setVehicles(d.vehicles))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (v) body[k] = String(v);
    });
    try {
      await api("/api/vehicles", { method: "POST", body: body as any });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vehicle");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading vehicles…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>

      <form onSubmit={handleAdd} className="card mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="name">Name / unit</label>
            <input className="input" id="name" name="name" required placeholder="Truck 12" />
          </div>
          <div>
            <label className="label" htmlFor="plate">Plate</label>
            <input className="input" id="plate" name="plate" required placeholder="AB 123 CD" />
          </div>
          <div>
            <label className="label" htmlFor="type">Type</label>
            <select className="input" id="type" name="type" defaultValue="truck">
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue="active">
              {VEHICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <details>
          <summary className="cursor-pointer text-sm font-medium text-accent-600">
            More details (make, model, year, VIN, odometer, notes)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="make">Make</label>
              <input className="input" id="make" name="make" placeholder="Volvo" />
            </div>
            <div>
              <label className="label" htmlFor="model">Model</label>
              <input className="input" id="model" name="model" placeholder="FH16" />
            </div>
            <div>
              <label className="label" htmlFor="year">Year</label>
              <input className="input" id="year" name="year" type="number" min="1950" max="2100" placeholder="2021" />
            </div>
            <div>
              <label className="label" htmlFor="vin">VIN</label>
              <input className="input" id="vin" name="vin" placeholder="Chassis number" />
            </div>
            <div>
              <label className="label" htmlFor="odometerKm">Odometer (km)</label>
              <input className="input" id="odometerKm" name="odometerKm" type="number" min="0" placeholder="250000" />
            </div>
            <div>
              <label className="label" htmlFor="notes">Notes</label>
              <input className="input" id="notes" name="notes" placeholder="Optional" />
            </div>
          </div>
        </details>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add vehicle"}
        </button>
      </form>

      <div className="card mt-6 p-0">
        {vehicles.length === 0 ? (
          <p className="px-6 py-10 text-center text-neutral-400">
            No vehicles yet. Add your first unit above.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {vehicles.map((v) => {
              const next = v.documents[0];
              return (
                <Link
                  key={v.id}
                  href={`/app/vehicles/${v.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {v.name}
                      <span className="ml-2 text-sm font-normal text-neutral-400">{v.plate}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {labelFor(VEHICLE_TYPES, v.type)}
                      {v.make && ` · ${v.make}${v.model ? ` ${v.model}` : ""}`}
                      {v.year && ` · ${v.year}`}
                      {" · "}
                      {v._count.documents} document{v._count.documents === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {next && (
                      <div className="text-right">
                        <StatusBadge status={expiryStatus(next.expiresAt)} />
                        <p className="mt-1 text-xs tabular-nums text-neutral-400">
                          next: {formatDate(next.expiresAt)}
                        </p>
                      </div>
                    )}
                    <Pill
                      tone={statusTone[v.status as keyof typeof statusTone] ?? "neutral"}
                      label={labelFor(VEHICLE_STATUSES, v.status)}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
