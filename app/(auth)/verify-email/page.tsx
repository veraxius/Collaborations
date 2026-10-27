"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/ui/fleetguard-logo";
import { verifyEmail } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id || !token) {
      setState("error");
      setMessage("This link is incomplete.");
      return;
    }
    verifyEmail(id, token)
      .then(() => setState("ok"))
      .catch((err) => {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Could not confirm your email.");
      });
  }, [id, token]);

  return (
    <div className="card w-full max-w-md text-center">
      <Link href="/" className="inline-block text-[15px]">
        <Logo size={28} />
      </Link>
      {state === "working" && <p className="mt-6 text-sm text-neutral-500">Confirming your email…</p>}
      {state === "ok" && (
        <>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Email confirmed</h1>
          <p className="mt-2 text-sm text-neutral-500">You&apos;ll now receive your document reminders.</p>
          <Link href="/app" className="btn-primary mt-6 inline-flex">Go to the dashboard</Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">We couldn&apos;t confirm it</h1>
          <p className="mt-2 text-sm text-red-700">{message}</p>
          <p className="mt-2 text-sm text-neutral-500">Log in and use &quot;Send it again&quot; at the top of the app.</p>
          <Link href="/login" className="btn-primary mt-6 inline-flex">Log in</Link>
        </>
      )}
    </div>
  );
}
