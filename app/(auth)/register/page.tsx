"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { register } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await register(String(fd.get("name")), String(fd.get("email")), String(fd.get("password")));
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-neutral-500">14-day free trial. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Company name</label>
          <input className="input" id="name" name="name" required placeholder="Acme Logistics" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary w-full py-2.5" disabled={pending}>
          {pending ? "Please wait…" : "Start free trial"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link className="font-medium text-accent-600" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
