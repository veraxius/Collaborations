import Link from "next/link";
import { SIGNUP_ROUTE } from "@/components/marketing/config";

export function CtaBand() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-[32px] bg-asphalt px-6 py-20 text-center sm:py-24">
          <h2 className="mk-h2 mx-auto max-w-3xl text-4xl text-chalk sm:text-5xl">
            Your next expiration date is already coming.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-chalk/75">
            Set up FleetGuard this week and it will never surprise you again.
          </p>
          <div className="mt-8">
            <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary">
              Start free 14-day trial
            </Link>
          </div>
          <p className="mt-4 font-plex text-sm text-chalk/60">
            No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
