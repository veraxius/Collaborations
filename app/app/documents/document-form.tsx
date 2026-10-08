"use client";

import { CURRENCIES, DOCUMENT_TYPES, DOC_PRESETS, addMonthsISO } from "@/lib/expiry";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string };

export type DocumentInitial = {
  id?: string;
  title?: string;
  type?: string;
  owner?: string;
  referenceNumber?: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  cost?: number | null;
  currency?: string;
  notes?: string;
  hasFile?: boolean;
};

export function DocumentForm({
  vehicles,
  drivers,
  initial,
  submitLabel,
}: {
  vehicles: Option[];
  drivers: Option[];
  initial?: DocumentInitial;
  submitLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "insurance");
  const [issuedAt, setIssuedAt] = useState(initial?.issuedAt ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? "");
  const [months, setMonths] = useState<number | null>(null);
  const isEdit = Boolean(initial?.id);

  function applyPreset(id: string) {
    const preset = DOC_PRESETS.find((p) => p.id === id);
    if (!preset) {
      setMonths(null);
      return;
    }
    setTitle(preset.title);
    setType(preset.type);
    setMonths(preset.months);
    if (issuedAt) setExpiresAt(addMonthsISO(issuedAt, preset.months));
  }

  function changeIssued(value: string) {
    setIssuedAt(value);
    // Auto-compute the expiry from the regulatory validity of the chosen preset.
    if (months && value) setExpiresAt(addMonthsISO(value, months));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);

    try {
      if (isEdit) {
        await api(`/api/documents/${initial!.id}`, {
          method: "PATCH",
          formData: fd,
        });
        router.push(`/app/documents/${initial!.id}`);
      } else {
        await api("/api/documents", {
          method: "POST",
          formData: fd,
        });
        router.push("/app/documents");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
      {!isEdit && (
        <div className="rounded-xl bg-neutral-50 p-4">
          <label className="label" htmlFor="preset">Quick start: common DOT documents</label>
          <select
            className="input"
            id="preset"
            defaultValue=""
            onChange={(e) => applyPreset(e.target.value)}
          >
            <option value="">Custom document…</option>
            {(["driver", "vehicle", "company"] as const).map((scope) => (
              <optgroup key={scope} label={scope[0].toUpperCase() + scope.slice(1)}>
                {DOC_PRESETS.filter((p) => p.scope === scope).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.months >= 12 && p.months % 12 === 0 ? `${p.months / 12} yr` : `${p.months} mo`})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-neutral-500">
            Pick one, enter the issue date, and the expiry is filled in for you.
          </p>
        </div>
      )}

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input
          className="input"
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Liability insurance policy"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select className="input" id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="owner">Belongs to</label>
          <select className="input" id="owner" name="owner" defaultValue={initial?.owner ?? ""}>
            <option value="">Company (general)</option>
            {vehicles.length > 0 && (
              <optgroup label="Vehicles">
                {vehicles.map((v) => (
                  <option key={v.id} value={`vehicle:${v.id}`}>{v.label}</option>
                ))}
              </optgroup>
            )}
            {drivers.length > 0 && (
              <optgroup label="Drivers">
                {drivers.map((d) => (
                  <option key={d.id} value={`driver:${d.id}`}>{d.label}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="issuedAt">Issue date (optional)</label>
          <input
            className="input"
            id="issuedAt"
            name="issuedAt"
            type="date"
            value={issuedAt}
            onChange={(e) => changeIssued(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="expiresAt">Expiry date</label>
          <input
            className="input"
            id="expiresAt"
            name="expiresAt"
            type="date"
            required
            value={expiresAt}
            onChange={(e) => {
              setExpiresAt(e.target.value);
              setMonths(null);
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="referenceNumber">Reference / policy number</label>
          <input
            className="input"
            id="referenceNumber"
            name="referenceNumber"
            defaultValue={initial?.referenceNumber ?? ""}
            placeholder="POL-4411"
          />
        </div>
        <div>
          <label className="label" htmlFor="issuer">Issuer / authority</label>
          <input
            className="input"
            id="issuer"
            name="issuer"
            defaultValue={initial?.issuer ?? ""}
            placeholder="State Farm, DOT, DMV…"
          />
        </div>
        <div>
          <label className="label" htmlFor="cost">Cost (optional)</label>
          <input
            className="input"
            id="cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial?.cost ?? ""}
            placeholder="1200"
          />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <select className="input" id="currency" name="currency" defaultValue={initial?.currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="file">
          {initial?.hasFile ? "Replace file (optional)" : "File (PDF or photo, optional)"}
        </label>
        <input
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-accent-50 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-accent-700"
          id="file"
          name="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">Notes (optional)</label>
        <textarea
          className="input"
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <button className="btn-primary w-full py-3" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
