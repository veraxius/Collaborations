"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useCompany } from "@/lib/auth-client";

export default function SettingsPage() {
  const { company, setCompany } = useCompany();
  const [profileError, setProfileError] = useState("");
  const [profileOk, setProfileOk] = useState("");
  const [profilePending, setProfilePending] = useState(false);

  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwPending, setPwPending] = useState(false);

  if (!company) return null;

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError("");
    setProfileOk("");
    setProfilePending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<{ company: typeof company }>("/api/me", {
        method: "PATCH",
        body: {
          name: fd.get("name"),
          contactName: fd.get("contactName"),
          phone: fd.get("phone"),
          country: fd.get("country"),
        } as any,
      });
      setCompany(data.company);
      setProfileOk("Profile saved.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError("");
    setPwOk("");
    const fd = new FormData(e.currentTarget);
    const next = String(fd.get("next"));
    const confirm = String(fd.get("confirm"));
    if (next !== confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwPending(true);
    try {
      await api("/api/me/password", {
        method: "POST",
        body: {
          current: fd.get("current"),
          next,
        } as any,
      });
      setPwOk("Password updated.");
      e.currentTarget.reset();
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPwPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <form onSubmit={handleProfile} className="card space-y-4">
        <h2 className="font-semibold tracking-tight">Company profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Company name</label>
            <input className="input" id="name" name="name" required defaultValue={company.name} />
          </div>
          <div>
            <label className="label" htmlFor="account-email">Account email</label>
            <input
              className="input bg-neutral-50 text-neutral-400"
              id="account-email"
              value={company.email}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="label" htmlFor="contactName">Contact person</label>
            <input
              className="input"
              id="contactName"
              name="contactName"
              defaultValue={company.contactName ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input className="input" id="phone" name="phone" defaultValue={company.phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="country">Country</label>
            <input
              className="input"
              id="country"
              name="country"
              defaultValue={company.country ?? ""}
              placeholder="United States"
            />
          </div>
        </div>
        {profileError && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{profileError}</p>
        )}
        {profileOk && (
          <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{profileOk}</p>
        )}
        <button className="btn-primary" disabled={profilePending}>
          {profilePending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={handlePassword} className="card space-y-4">
        <h2 className="font-semibold tracking-tight">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input className="input" id="current" name="current" type="password" required />
          </div>
          <div>
            <label className="label" htmlFor="next">New password</label>
            <input className="input" id="next" name="next" type="password" required minLength={8} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Repeat new password</label>
            <input className="input" id="confirm" name="confirm" type="password" required minLength={8} />
          </div>
        </div>
        {pwError && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{pwError}</p>
        )}
        {pwOk && (
          <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{pwOk}</p>
        )}
        <button className="btn-primary" disabled={pwPending}>
          {pwPending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
