"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileDownloadButton } from "@/components/file-download-button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/expiry";
import { DocumentForm } from "../document-form";

type Vehicle = { id: string; name: string; plate: string };
type Driver = { id: string; name: string };

type Doc = {
  id: string;
  title: string;
  type: string;
  expiresAt: string;
  issuedAt?: string | null;
  referenceNumber?: string | null;
  issuer?: string | null;
  cost?: number | null;
  currency: string;
  notes?: string | null;
  fileName?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
};

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [renewDate, setRenewDate] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ document: Doc }>(`/api/documents/${id}`),
      api<{ vehicles: Vehicle[] }>("/api/vehicles"),
      api<{ drivers: Driver[] }>("/api/drivers"),
    ])
      .then(([d, v, dr]) => {
        setDoc(d.document);
        setVehicles(v.vehicles);
        setDrivers(dr.drivers);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    if (!renewDate) return;
    try {
      await api(`/api/documents/${id}/renew`, {
        method: "POST",
        body: { expiresAt: renewDate } as any,
      });
      const d = await api<{ document: Doc }>(`/api/documents/${id}`);
      setDoc(d.document);
      setRenewDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renew failed");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      router.push("/app/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  if (!doc) {
    return (
      <div className="card py-10 text-center text-neutral-500">
        {error || "Document not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/documents" className="text-sm font-medium text-accent-600">
        ‹ Documents
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit document</h1>
        {doc.fileName && (
          <FileDownloadButton fileName={doc.fileName} label="Download file" />
        )}
      </div>

      <DocumentForm
        vehicles={vehicles.map((v) => ({ id: v.id, label: `${v.name} (${v.plate})` }))}
        drivers={drivers.map((d) => ({ id: d.id, label: d.name }))}
        initial={{
          id: doc.id,
          title: doc.title,
          type: doc.type,
          owner: doc.vehicleId
            ? `vehicle:${doc.vehicleId}`
            : doc.driverId
              ? `driver:${doc.driverId}`
              : "",
          referenceNumber: doc.referenceNumber ?? "",
          issuer: doc.issuer ?? "",
          issuedAt: doc.issuedAt ? formatDate(doc.issuedAt) : "",
          expiresAt: formatDate(doc.expiresAt),
          cost: doc.cost,
          currency: doc.currency,
          notes: doc.notes ?? "",
          hasFile: Boolean(doc.fileName),
        }}
        submitLabel="Save changes"
      />

      <div className="card mt-6">
        <p className="font-medium">Renew</p>
        <p className="mt-1 text-sm text-neutral-400">
          Renewing sets a new expiry date, restarts the reminder cycle, and
          records whether the renewal was on time — it feeds your analytics.
        </p>
        <form onSubmit={handleRenew} className="mt-4 flex items-center gap-2">
          <input
            className="input w-44"
            type="date"
            value={renewDate}
            onChange={(e) => setRenewDate(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Renew</button>
        </form>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="card mt-6 flex items-center justify-between border-red-100">
        <div>
          <p className="font-medium text-red-600">Delete this document</p>
          <p className="text-sm text-neutral-400">This cannot be undone.</p>
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
