import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { SUPPORT_EMAIL } from "@/components/marketing/config";

export const metadata: Metadata = {
  title: "Contact — FleetGuard",
  description:
    "Questions about pricing, setup, or moving your fleet's compliance tracking off a spreadsheet? Send us a message — we answer within one business day.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="mk-h1 text-5xl text-asphalt sm:text-6xl">
            Talk to a human.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-asphalt/80">
            Questions about pricing, setup, moving off a spreadsheet, or
            whether FleetGuard fits your operation — send them over. We answer
            within one business day.
          </p>

          <div className="mt-10">
            <ContactForm />
          </div>

          {SUPPORT_EMAIL && (
            <p className="mt-8 text-asphalt/70">
              Prefer email?{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-plex font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
