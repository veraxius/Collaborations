"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { changePassword, logout, type Company } from "@/lib/auth-client";
import { VERTICALS } from "@/lib/expiry";

type SetCompany = (c: Company | null) => void;

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>;
  if (ok) return <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{ok}</p>;
  return null;
}

/* ---------------------------------------------------------------- profile */
export function ProfileSection({ company, setCompany }: { company: Company; setCompany: SetCompany }) {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<{ company: Company }>("/api/me", {
        method: "PATCH",
        body: {
          name: fd.get("name"),
          contactName: fd.get("contactName"),
          phone: fd.get("phone"),
          country: fd.get("country"),
          usdot: fd.get("usdot"),
          vertical: fd.get("vertical"),
        } as unknown as BodyInit,
      });
      setCompany(data.company);
      setOk("Profile saved.");
    } catch (err) {
      setError(errorText(err, "Save failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold tracking-tight">Company profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Company name</label>
          <input className="input" id="name" name="name" required defaultValue={company.name} />
        </div>
        <div>
          <label className="label" htmlFor="account-email">Account email</label>
          <input className="input bg-neutral-50 text-neutral-400" id="account-email" value={company.email} disabled readOnly />
        </div>
        <div>
          <label className="label" htmlFor="usdot">USDOT number</label>
          <input className="input" id="usdot" name="usdot" inputMode="numeric" defaultValue={company.usdot ?? ""} placeholder="e.g. 1234567" />
        </div>
        <div>
          <label className="label" htmlFor="contactName">Contact person</label>
          <input className="input" id="contactName" name="contactName" defaultValue={company.contactName ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" defaultValue={company.phone ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <input className="input" id="country" name="country" defaultValue={company.country ?? ""} placeholder="United States" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="vertical">What do you operate?</label>
          <select className="input" id="vertical" name="vertical" defaultValue={company.vertical ?? "trucking"}>
            {VERTICALS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-neutral-500">Adds a quick-start list for your operation when you add documents.</p>
        </div>
      </div>
      <Notice error={error} ok={ok} />
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

/* ---------------------------------------------------------- notifications */
export function NotificationsSection({ company, setCompany }: { company: Company; setCompany: SetCompany }) {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<{ company: Company }>("/api/settings/notifications", {
        method: "PATCH",
        body: {
          reminderOffsets: fd.get("reminderOffsets"),
          reminderEmails: fd.get("reminderEmails"),
          notifyDrivers: fd.get("notifyDrivers") === "on",
          weeklyDigest: fd.get("weeklyDigest") === "on",
        } as unknown as BodyInit,
      });
      setCompany(data.company);
      setOk("Notification settings saved.");
    } catch (err) {
      setError(errorText(err, "Save failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold tracking-tight">Reminders</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reminderOffsets">Remind me this many days before</label>
          <input className="input" id="reminderOffsets" name="reminderOffsets" defaultValue={company.reminderOffsets ?? "30,15,7,1"} placeholder="30, 15, 7, 1" />
          <p className="mt-1.5 text-xs text-neutral-500">Up to 6 numbers from 1 to 365, separated by commas.</p>
        </div>
        <div>
          <label className="label" htmlFor="reminderEmails">Also email these people</label>
          <input className="input" id="reminderEmails" name="reminderEmails" defaultValue={company.reminderEmails ?? ""} placeholder="dispatch@yourcompany.com" />
          <p className="mt-1.5 text-xs text-neutral-500">Up to 5 addresses. Team managers are included automatically.</p>
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="notifyDrivers" defaultChecked={company.notifyDrivers} className="mt-1" />
        <span>
          <b>Also notify drivers about their own documents</b> by email and, when it is set up for your account, by text
          message. Only turn this on if your drivers have agreed to receive these messages.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="weeklyDigest" defaultChecked={company.weeklyDigest ?? true} className="mt-1" />
        <span><b>Send me a summary every Monday</b> of what is expired or expiring. Nothing is sent when everything is up to date.</span>
      </label>
      <Notice error={error} ok={ok} />
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save reminders"}</button>
    </form>
  );
}

/* ------------------------------------------------------------------- team */
type Member = { id: string; email: string; name: string; role: "manager" | "viewer"; accepted: boolean };

export function TeamSection({ company }: { company: Company }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);
  const [upgrade, setUpgrade] = useState(false);

  const load = useCallback(() => {
    api<{ members: Member[] }>("/api/team")
      .then((d) => setMembers(d.members))
      .catch((err) => setError(errorText(err, "Could not load the team")));
  }, []);

  useEffect(load, [load]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setOk("");
    setUpgrade(false);
    setPending(true);
    const fd = new FormData(form);
    try {
      const data = await api<{ emailSent: boolean }>("/api/team", {
        method: "POST",
        body: { name: fd.get("name"), email: fd.get("email"), role: fd.get("role") } as unknown as BodyInit,
      });
      form.reset();
      setOk(data.emailSent ? "Invitation sent." : "Added, but we couldn't send the email. Use \"Resend\" in a few minutes.");
      load();
    } catch (err) {
      setError(errorText(err, "Could not send the invitation"));
      setUpgrade((err as { status?: number }).status === 402);
    } finally {
      setPending(false);
    }
  }

  async function act(fn: () => Promise<unknown>, success?: string) {
    setError("");
    setOk("");
    try {
      await fn();
      if (success) setOk(success);
      load();
    } catch (err) {
      setError(errorText(err, "Something went wrong"));
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold tracking-tight">Team</h2>
        <p className="mt-1 text-sm text-neutral-500">
          <b>Managers</b> can add and edit vehicles, drivers and documents. <b>Viewers</b> can only look. Only you manage
          billing, the team and these settings.
          {company.plan === "free" && " The free plan includes 1 team member."}
        </p>
      </div>

      {members === null ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-neutral-400">No team members yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-neutral-500">
                  {m.email}
                  {!m.accepted && " · invitation pending"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="input w-auto py-1.5"
                  value={m.role}
                  aria-label={`Role for ${m.name}`}
                  onChange={(e) => act(() => api(`/api/team/${m.id}`, { method: "PATCH", body: { role: e.target.value } as unknown as BodyInit }))}
                >
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
                {!m.accepted && (
                  <button type="button" className="text-sm font-medium text-accent-600" onClick={() => act(() => api(`/api/team/${m.id}/resend`, { method: "POST" }), "Invitation sent again.")}>
                    Resend
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-red-600"
                  onClick={() => confirm(`Remove ${m.name}? They will be signed out right away.`) && act(() => api(`/api/team/${m.id}`, { method: "DELETE" }))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="tm-name">Name</label>
          <input className="input" id="tm-name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="tm-email">Email</label>
          <input className="input" id="tm-email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="tm-role">Role</label>
          <select className="input" id="tm-role" name="role" defaultValue="viewer">
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Invite"}</button>
      </form>
      <Notice error={error} ok={ok} />
      {upgrade && (
        <Link href="/app/price" className="inline-block text-sm font-semibold text-accent-600 underline">
          See plans
        </Link>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- billing */
type Billing = { plan: "free" | "pro"; status: string; renewsAt: string | null; endsAt: string | null; portalUrl: string | null };

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_trial: "Trial",
  past_due: "Payment failed: please update your card",
  cancelled: "Cancelled",
  paused: "Paused",
  expired: "Expired",
  trialing: "Free",
};

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function BillingSection() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Billing>("/api/billing").then(setBilling).catch((err) => setError(errorText(err, "Could not load billing")));
  }, []);

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold tracking-tight">Plan and billing</h2>
      <Notice error={error} />
      {billing && (
        <>
          <p className="text-sm">
            <b>{billing.plan === "pro" ? "Fleet plan" : "Free plan"}</b>
            <span className="text-neutral-500"> · {STATUS_LABEL[billing.status] ?? billing.status}</span>
          </p>
          {billing.renewsAt && billing.status !== "cancelled" && (
            <p className="text-sm text-neutral-500">Renews on {fmt(billing.renewsAt)}.</p>
          )}
          {billing.status === "cancelled" && billing.endsAt && (
            <p className="text-sm text-neutral-500">Access continues until {fmt(billing.endsAt)}.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {billing.portalUrl && (
              <a href={billing.portalUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Manage subscription and invoices
              </a>
            )}
            {billing.plan === "free" && <Link href="/app/price" className="btn-primary">Upgrade to Fleet</Link>}
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- password */
export function PasswordSection() {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setOk("");
    const fd = new FormData(form);
    const next = String(fd.get("next"));
    if (next !== String(fd.get("confirm"))) {
      setError("New passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await changePassword(String(fd.get("current")), next);
      setOk("Password updated. Other devices were signed out.");
      form.reset();
    } catch (err) {
      setError(errorText(err, "Update failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold tracking-tight">Change password</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="current">Current password</label>
          <input className="input" id="current" name="current" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="next">New password</label>
          <input className="input" id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Repeat new password</label>
          <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      <Notice error={error} ok={ok} />
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update password"}</button>
    </form>
  );
}

/* ----------------------------------------------------------- danger zone */
export function DangerSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const password = String(new FormData(e.currentTarget).get("password"));
    try {
      await api("/api/me", { method: "DELETE", body: { password } as unknown as BodyInit });
      logout();
      router.replace("/");
    } catch (err) {
      setError(errorText(err, "Could not delete the account"));
      setPending(false);
    }
  }

  return (
    <div className="card space-y-3 border border-red-100">
      <h2 className="font-semibold tracking-tight text-red-700">Delete account</h2>
      <p className="text-sm text-neutral-500">
        Permanently deletes your company, vehicles, drivers, documents, uploaded files and team. This cannot be undone.
        Export your documents to CSV first if you want a copy.
      </p>
      {!open ? (
        <button type="button" className="btn-secondary text-red-700" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      ) : (
        <form onSubmit={remove} className="space-y-3">
          <div>
            <label className="label" htmlFor="delete-password">Type your password to confirm</label>
            <input className="input max-w-sm" id="delete-password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Notice error={error} />
          <div className="flex gap-3">
            <button className="btn-primary bg-red-600 text-white" disabled={pending}>
              {pending ? "Deleting…" : "Delete everything"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
