import type { Metadata } from "next";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  faqItemsById,
  PRICING_FAQ_IDS,
} from "@/components/marketing/faq-data";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "FleetGuard — Price",
  description:
    "Simple pricing for DOT compliance tracking: $29 per month, everything included. Free to explore, no credit card.",
};

export default function PricingPage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="mk-h1 text-center text-5xl text-asphalt sm:text-6xl">
            Pricing
          </h1>
        </div>
        <div className="mt-12">
          <PricingSection />
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FaqAccordion items={faqItemsById(PRICING_FAQ_IDS)} />
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
