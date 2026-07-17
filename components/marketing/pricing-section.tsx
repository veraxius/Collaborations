import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";

export function PricingSection({
  headingLevel = "h2",
}: {
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="text-center">
        <SectionEyebrow>Pricing</SectionEyebrow>
        <Heading className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
          Simple per-truck pricing. No modules, no contracts.
        </Heading>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-asphalt/75">
          Every plan includes unlimited drivers, unlimited documents, and
          unlimited reminders.
        </p>
      </div>
      <PricingCalculator />
    </div>
  );
}
