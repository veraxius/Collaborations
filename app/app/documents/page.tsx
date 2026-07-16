"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FileDownloadButton } from "@/components/file-download-button";
import { api } from "@/lib/api";
import {
  DOCUMENT_TYPES,
  daysUntil,
  documentTypeLabel,
  expiryStatus,
  formatDate,
  formatMoney,
} from "@/lib/expiry";
import { StatusBadge } from "../status-badge";

type Doc = {
  id: string;
  title: string;
  type: string;
  expiresAt: string;
  referenceNumber?: string | null;
  issuer?: string | null;
  cost?: number | null;
  currency: string;
  fileName?: string | null;
  vehicle?: { name: string; plate: string } | null;
  driver?: { name: string } | null;
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-400">Loading documents…</p>}>
      <DocumentsContent />
    </Suspense>
  );
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const type = searchParams.get("type") ?? "";

  const [documents, setDocuments] = useState<Doc[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (type) qs.set("type", type);
    const q = qs.toString();
    return api<{ documents: Doc[] }>(`/api/documents${q ? `?${q}` : ""}`)
      .then((d) => setDocuments(d.documents))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [status, type]);

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

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/api/documents/${docId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const filtered = Boolean(status || type);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading documents…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <Link href="/app/documents/new" className="btn-primary">
          Add document
        </Link>
      </div>

      <form
        action="/app/documents"
        method="GET"
        className="card mt-6 flex flex-wrap items-end gap-3 py-4"
      >
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select className="input w-44" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring soon</option>
            <option value="ok">Up to date</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select className="input w-44" id="type" name="type" defaultValue={type}>
            <option value="">All types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Apply</button>
        {filtered && (
          <Link
            href="/app/documents"
            className="px-2 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-700"
          >
            Clear
          </Link>
        )}
        <span className="ml-auto text-sm tabular-nums text-neutral-400">
          {documents.length} document{documents.length === 1 ? "" : "s"}
        </span>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="card mt-4 p-0">
        {documents.length === 0 ? (
          <p className="px-6 py-12 text-center text-neutral-400">
            {filtered ? (
              "Nothing matches these filters."
            ) : (
              <>
                No documents yet.{" "}
                <Link href="/app/documents/new" className="font-medium text-accent-600">
                  Add the first one
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {documents.map((doc) => {
              const days = daysUntil(doc.expiresAt);
              return (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/documents/${doc.id}`}
                      className="font-medium hover:text-accent-600"
                    >
                      {doc.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {documentTypeLabel(doc.type)}
                      {doc.vehicle && ` · ${doc.vehicle.name} (${doc.vehicle.plate})`}
                      {doc.driver && ` · ${doc.driver.name}`}
                      {doc.referenceNumber && ` · ${doc.referenceNumber}`}
                      {doc.issuer && ` · ${doc.issuer}`}
                      {" · "}
                      {formatDate(doc.expiresAt)}
                      {doc.cost != null && ` · ${formatMoney(doc.cost, doc.currency)}`}
                      {doc.fileName && (
                        <>
                          {" · "}
                          <FileDownloadButton
                            fileName={doc.fileName}
                            label="file"
                            className="inline text-sm font-medium text-accent-600 hover:underline bg-transparent p-0 rounded-none"
                          />
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <StatusBadge status={expiryStatus(doc.expiresAt)} />
                      <p className="mt-1 text-xs tabular-nums text-neutral-400">
                        {days < 0
                          ? `${-days} day${days === -1 ? "" : "s"} ago`
                          : `${days} day${days === 1 ? "" : "s"} left`}
                      </p>
                    </div>

                    <RenewInline docId={doc.id} onRenew={handleRenew} />

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        title="New expiry date"
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
