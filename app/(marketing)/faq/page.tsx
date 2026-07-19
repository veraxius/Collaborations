import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "FleetGuard — FAQ",
  description:
    "What FleetGuard tracks, how the 30/15/7/1-day reminders work, pricing and cancellation, New Entrant Safety Audit prep, and what happens to your documents.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mk-h1 text-5xl text-asphalt sm:text-6xl">
            Frequently asked questions
          </h1>
          <div className="mt-12">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
