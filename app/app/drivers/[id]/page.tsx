"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  DRIVER_STATUSES,
  daysUntil,
  documentTypeLabel,
  expiryStatus,
  formatDate,
} from "@/lib/expiry";
import { StatusBadge } from "../../status-badge";

type Doc = { id: string; title: string; type: string; expiresAt: string };

type Driver = {
  id: string;
  name: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  licenseClass?: string | null;
  hiredAt?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  documents: Doc[];
};

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  function load() {
    return api<{ driver: Driver }>(`/api/drivers/${id}`)
      .then((d) => setDriver(d.driver))
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
      if (v) body[k] = String(v);
    });
    try {
      await api(`/api/drivers/${id}`, { method: "PATCH", body: body as any });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this driver and all their documents?")) return;
    try {
      await api(`/api/drivers/${id}`, { method: "DELETE" });
      router.push("/app/drivers");
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

  if (!driver) {
    return (
      <div className="card py-10 text-center text-neutral-500">
        {error || "Driver not found."}
      </div>
    );
  }

  return (
    <div>
      <Link href="/app/drivers" className="text-sm font-medium text-accent-600">
        ‹ Drivers
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{driver.name}</h1>
        <Link href={`/app/documents/new?driver=${driver.id}`} className="btn-primary">
          Add document
        </Link>
      </div>

      <form onSubmit={handleSave} className="card mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input className="input" id="name" name="name" required defaultValue={driver.name} />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue={driver.status}>
              {DRIVER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="licenseNumber">License number</label>
            <input className="input" id="licenseNumber" name="licenseNumber" defaultValue={driver.licenseNumber ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="licenseClass">License class</label>
            <input className="input" id="licenseClass" name="licenseClass" defaultValue={driver.licenseClass ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" defaultValue={driver.email ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input className="input" id="phone" name="phone" defaultValue={driver.phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="hiredAt">Hired on</label>
            <input
              className="input"
              id="hiredAt"
              name="hiredAt"
              type="date"
              defaultValue={driver.hiredAt ? formatDate(driver.hiredAt) : ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="birthDate">Date of birth</label>
            <input
              className="input"
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={driver.birthDate ? formatDate(driver.birthDate) : ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <input className="input" id="notes" name="notes" defaultValue={driver.notes ?? ""} />
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
        Documents ({driver.documents.length})
      </h2>
      <div className="card mt-3 p-0">
        {driver.documents.length === 0 ? (
          <p className="px-6 py-10 text-center text-neutral-400">
            No documents for this driver yet.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {driver.documents.map((doc) => {
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
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-3 border-red-100">
        <div>
          <p className="font-medium text-red-600">Delete this driver</p>
          <p className="text-sm text-neutral-400">
            Removes the driver and their {driver.documents.length} document
            {driver.documents.length === 1 ? "" : "s"}. This cannot be undone.
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
