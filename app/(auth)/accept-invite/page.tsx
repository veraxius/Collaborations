"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { acceptInvite } from "@/lib/auth-client";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    if (password !== String(fd.get("confirm"))) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    try {
      await acceptInvite(id, token, password);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invitation");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card w-full max-w-md">
      <div className="text-center">
        <Link href="/" className="inline-block text-[15px]">
          <Logo size={28} />
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Accept your invitation</h1>
        <p className="mt-1.5 text-sm text-neutral-500">Choose a password to join your team.</p>
      </div>

      {!id || !token ? (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
          This link is incomplete. Ask the account owner to send the invitation again.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={pending}>
            {pending ? "Please wait…" : "Join the team"}
          </button>
        </form>
      )}
    </div>
  );
}
