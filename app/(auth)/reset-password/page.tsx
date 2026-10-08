"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { resetPassword } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const id = params.get("id") ?? "";
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
      await resetPassword(id, token, password);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
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
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Choose a new password</h1>
      </div>

      {!token || !id ? (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
          This link is incomplete. <Link className="underline" href="/forgot-password">Request a new one</Link>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input className="input" id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input className="input" id="confirm" name="confirm" type="password" required minLength={8} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={pending}>
            {pending ? "Please wait…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
