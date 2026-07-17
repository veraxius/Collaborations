/* <!-- Draft for founder/legal review before launch --> */
import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/components/marketing/config";

export const metadata: Metadata = {
  title: "Terms of Service — FleetGuard",
  description:
    "The terms that govern your use of FleetGuard: the 14-day trial, billing and cancellation, acceptable use, and what FleetGuard is (and isn't).",
};

const LAST_UPDATED = "July 17, 2026";

export default function TermsPage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="mk-h1 text-5xl text-asphalt">Terms of Service</h1>
          <p className="mt-3 font-plex text-sm text-asphalt/60">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-10 space-y-10 text-[17px] leading-relaxed text-asphalt/85">
            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                The service
              </h2>
              <p className="mt-3">
                FleetGuard is a web application that tracks compliance
                documents and expiration dates for motor carriers and sends
                email reminders 30, 15, 7, and 1 day before documents expire.
                By creating an account you agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Free trial, billing, and cancellation
              </h2>
              <p className="mt-3">
                Every plan starts with a free 14-day trial; no credit card is
                required to start. Paid plans are billed at $5 per truck per
                month with a $79/month minimum, or $50 per truck per year with
                a $790/year minimum. Monthly plans can be cancelled at any
                time — there are no contracts and no cancellation fees. Annual
                plans run for 12 months at the locked price. If you cancel,
                you keep access until the end of the period you've paid for.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Acceptable use
              </h2>
              <p className="mt-3">
                Use FleetGuard only for lawful purposes and only for fleets
                you're authorized to manage. Don't attempt to access other
                companies' data, probe or disrupt the service, or resell
                access without our written agreement. We may suspend accounts
                that violate these rules.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                What FleetGuard is not
              </h2>
              <p className="mt-3">
                FleetGuard is an independent software product and is not
                affiliated with, endorsed by, or sponsored by the Federal
                Motor Carrier Safety Administration (FMCSA), the U.S.
                Department of Transportation, or any government agency.
                FleetGuard is not a filing service, not a compliance agency,
                and not legal advice. It does not file, renew, or submit
                documents on your behalf.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Limitation of liability
              </h2>
              <p className="mt-3">
                FleetGuard provides reminders, not guarantees. You — the
                carrier — remain responsible for your own compliance,
                including renewing documents on time, regardless of whether a
                reminder was sent, delivered, or read. To the maximum extent
                permitted by law, FleetGuard's total liability for any claim
                related to the service is limited to the amount you paid us in
                the twelve months before the claim arose.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Changes and contact
              </h2>
              <p className="mt-3">
                We may update these terms; when we do, we'll update the date
                at the top of this page. Questions?{" "}
                {SUPPORT_EMAIL ? (
                  <>
                    Email{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="underline decoration-signal-amber decoration-2 underline-offset-4"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </>
                ) : (
                  <>
                    Write to us through the{" "}
                    <a
                      href="/contact"
                      className="underline decoration-signal-amber decoration-2 underline-offset-4"
                    >
                      contact form
                    </a>
                  </>
                )}
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
