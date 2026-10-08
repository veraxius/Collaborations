"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await requestPasswordReset(String(fd.get("email")));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a link.
        </p>
      </div>

      {sent ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          If an account exists for that email, a reset link is on its way. It expires in 1 hour.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={pending}>
            {pending ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-neutral-600">
        <Link className="font-medium text-accent-600" href="/login">Back to log in</Link>
      </p>
    </div>
  );
}
