/* <!-- Draft for founder/legal review before launch --> */
import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/components/marketing/config";

export const metadata: Metadata = {
  title: "FleetGuard — Privacy",
  description:
    "How FleetGuard collects, uses, and protects your account, fleet, and document data. We don't sell your data — your paperwork is your business.",
};

const LAST_UPDATED = "July 17, 2026";

export default function PrivacyPage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="mk-h1 text-5xl text-asphalt">Privacy Policy</h1>
          <p className="mt-3 font-plex text-sm text-asphalt/60">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-10 space-y-10 text-[17px] leading-relaxed text-asphalt/85">
            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                What we collect
              </h2>
              <p className="mt-3">
                When you create a FleetGuard account, we collect your company
                name, your email address, and a password (stored only as a
                secure hash). As you use the product, we store the fleet and
                document data you enter: drivers, vehicles, document details,
                expiration dates, and any files you upload. If you write to us
                through the contact form, we keep the message and the contact
                details you provide so we can reply.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                How we use it
              </h2>
              <p className="mt-3">
                We use your data to provide the service: showing your fleet's
                compliance status, and sending reminder and service emails
                (delivered via Resend, our email provider) 30, 15, 7, and 1 day
                before documents expire. If you purchase a paid plan, payment
                is handled by our merchant of record — we never see or store
                your full card details.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                What we don't do
              </h2>
              <p className="mt-3">
                We do not sell your data, and we do not share it with third
                parties except the service providers needed to run FleetGuard
                (hosting, email delivery, payment processing). Your documents
                are visible only to your company's account.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Cookies and sessions
              </h2>
              <p className="mt-3">
                FleetGuard uses the storage in your browser to keep you signed
                in. We don't use advertising trackers or third-party analytics
                cookies on the product.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Deleting your data
              </h2>
              <p className="mt-3">
                You can request deletion of your account and all associated
                data at any time by{" "}
                {SUPPORT_EMAIL ? (
                  <>
                    emailing{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="underline decoration-signal-amber decoration-2 underline-offset-4"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </>
                ) : (
                  <>
                    writing to us through the{" "}
                    <a
                      href="/contact"
                      className="underline decoration-signal-amber decoration-2 underline-offset-4"
                    >
                      contact form
                    </a>
                  </>
                )}
                . We'll confirm once the deletion is complete.
              </p>
            </section>

            <section>
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">
                Questions
              </h2>
              <p className="mt-3">
                Anything unclear?{" "}
                {SUPPORT_EMAIL ? (
                  <>
                    Email us at{" "}
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
                )}{" "}
                and a human will answer.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
