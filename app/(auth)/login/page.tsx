"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { login } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-neutral-500">Log in to your compliance dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required placeholder="Your password" />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary w-full py-2.5" disabled={pending}>
          {pending ? "Please wait…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-600">
        New to FleetGuard?{" "}
        <Link className="font-medium text-accent-600" href="/signup">
          Start free trial
        </Link>
      </p>
    </div>
  );
}
