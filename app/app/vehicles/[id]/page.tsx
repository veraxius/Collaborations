"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  daysUntil,
  documentTypeLabel,
  expiryStatus,
  formatDate,
} from "@/lib/expiry";
import { StatusBadge } from "../../status-badge";

type Doc = { id: string; title: string; type: string; expiresAt: string };

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  type: string;
  status: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  odometerKm?: number | null;
  notes?: string | null;
  documents: Doc[];
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  function load() {
    return api<{ vehicle: Vehicle }>(`/api/vehicles/${id}`)
      .then((d) => setVehicle(d.vehicle))
      .catch((err) => setError(err instanceof Error ? err.message : "Not found"));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (k !== "id" && v) body[k] = String(v);
    });
    try {
      await api(`/api/vehicles/${id}`, { method: "PATCH", body: body as any });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this vehicle and all its documents?")) return;
    try {
      await api(`/api/vehicles/${id}`, { method: "DELETE" });
      router.push("/app/vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleRenew(docId: string, expiresAt: string) {
    if (!expiresAt) return;
    try {
      await api(`/api/documents/${docId}/renew`, {
        method: "POST",
        body: { expiresAt } as any,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renew failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  if (!vehicle) {
    return (
      <div className="card py-10 text-center text-neutral-500">
        {error || "Vehicle not found."}
      </div>
    );
  }

  return (
    <div>
      <Link href="/app/vehicles" className="text-sm font-medium text-accent-600">
        ‹ Vehicles
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {vehicle.name}
          <span className="ml-3 text-lg font-normal text-neutral-400">{vehicle.plate}</span>
        </h1>
        <Link href={`/app/documents/new?vehicle=${vehicle.id}`} className="btn-primary">
          Add document
        </Link>
      </div>

      <form onSubmit={handleSave} className="card mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="name">Name / unit</label>
            <input className="input" id="name" name="name" required defaultValue={vehicle.name} />
          </div>
          <div>
            <label className="label" htmlFor="plate">Plate</label>
            <input className="input" id="plate" name="plate" required defaultValue={vehicle.plate} />
          </div>
          <div>
            <label className="label" htmlFor="type">Type</label>
            <select className="input" id="type" name="type" defaultValue={vehicle.type}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue={vehicle.status}>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="make">Make</label>
            <input className="input" id="make" name="make" defaultValue={vehicle.make ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <input className="input" id="model" name="model" defaultValue={vehicle.model ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="year">Year</label>
            <input className="input" id="year" name="year" type="number" min="1950" max="2100" defaultValue={vehicle.year ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="odometerKm">Odometer (km)</label>
            <input className="input" id="odometerKm" name="odometerKm" type="number" min="0" defaultValue={vehicle.odometerKm ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="vin">VIN</label>
            <input className="input" id="vin" name="vin" defaultValue={vehicle.vin ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Notes</label>
            <input className="input" id="notes" name="notes" defaultValue={vehicle.notes ?? ""} />
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">
        Documents ({vehicle.documents.length})
      </h2>
      <div className="card mt-3 p-0">
        {vehicle.documents.length === 0 ? (
          <p className="px-6 py-10 text-center text-neutral-400">
            No documents for this vehicle yet.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {vehicle.documents.map((doc) => {
              const days = daysUntil(doc.expiresAt);
              return (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/app/documents/${doc.id}`}
                      className="font-medium hover:text-accent-600"
                    >
                      {doc.title}
                    </Link>
                    <p className="text-sm text-neutral-400">
                      {documentTypeLabel(doc.type)} · expires {formatDate(doc.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <StatusBadge status={expiryStatus(doc.expiresAt)} />
                      <p className="mt-1 text-xs tabular-nums text-neutral-400">
                        {days < 0 ? `${-days}d ago` : `${days}d left`}
                      </p>
                    </div>
                    <RenewInline docId={doc.id} onRenew={handleRenew} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card mt-10 flex items-center justify-between border-red-100">
        <div>
          <p className="font-medium text-red-600">Delete this vehicle</p>
          <p className="text-sm text-neutral-400">
            Removes the vehicle and its {vehicle.documents.length} document
            {vehicle.documents.length === 1 ? "" : "s"}. This cannot be undone.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function RenewInline({
  docId,
  onRenew,
}: {
  docId: string;
  onRenew: (id: string, date: string) => void;
}) {
  const [date, setDate] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        className="input w-36 py-1.5 text-xs"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <button
        type="button"
        className="btn-secondary px-3 py-1.5 text-xs"
        onClick={() => onRenew(docId, date)}
      >
        Renew
      </button>
    </div>
  );
}
