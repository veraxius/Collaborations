"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  DRIVER_STATUSES,
  expiryStatus,
  formatDate,
  labelFor,
} from "@/lib/expiry";
import { Pill, StatusBadge } from "../status-badge";

type Driver = {
  id: string;
  name: string;
  status: string;
  licenseNumber?: string | null;
  licenseClass?: string | null;
  documents: { expiresAt: string }[];
  _count: { documents: number };
};

const statusTone = { active: "green", on_leave: "amber", inactive: "neutral" } as const;

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  function load() {
    return api<{ drivers: Driver[] }>("/api/drivers")
      .then((d) => setDrivers(d.drivers))
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
      await api("/api/drivers", { method: "POST", body: body as any });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add driver");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading drivers…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>

      <form onSubmit={handleAdd} className="card mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input className="input" id="name" name="name" required placeholder="John Doe" />
          </div>
          <div>
            <label className="label" htmlFor="licenseNumber">License number</label>
            <input className="input" id="licenseNumber" name="licenseNumber" placeholder="Optional" />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue="active">
              {DRIVER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <details>
          <summary className="cursor-pointer text-sm font-medium text-accent-600">
            More details (contact, license class, dates, notes)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" placeholder="driver@company.com" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input className="input" id="phone" name="phone" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="label" htmlFor="licenseClass">License class</label>
              <input className="input" id="licenseClass" name="licenseClass" placeholder="CDL-A" />
            </div>
            <div>
              <label className="label" htmlFor="hiredAt">Hired on</label>
              <input className="input" id="hiredAt" name="hiredAt" type="date" />
            </div>
            <div>
              <label className="label" htmlFor="birthDate">Date of birth</label>
              <input className="input" id="birthDate" name="birthDate" type="date" />
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
          {pending ? "Adding…" : "Add driver"}
        </button>
      </form>

      <div className="card mt-6 p-0">
        {drivers.length === 0 ? (
          <p className="px-6 py-10 text-center text-neutral-400">
            No drivers yet. Add your first driver above.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {drivers.map((d) => {
              const next = d.documents[0];
              return (
                <Link
                  key={d.id}
                  href={`/app/drivers/${d.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {d.licenseNumber && `License ${d.licenseNumber}`}
                      {d.licenseClass && ` (${d.licenseClass})`}
                      {(d.licenseNumber || d.licenseClass) && " · "}
                      {d._count.documents} document{d._count.documents === 1 ? "" : "s"}
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
                      tone={statusTone[d.status as keyof typeof statusTone] ?? "neutral"}
                      label={labelFor(DRIVER_STATUSES, d.status)}
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
