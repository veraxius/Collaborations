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
          Free for 3 trucks. $29 a month for everything.
        </Heading>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-asphalt/75">
          Start free, no credit card. Upgrade when your fleet grows — unlimited
          trucks, drivers, documents, and reminders. No modules, no contracts.
        </p>
      </div>
      <PricingCalculator />
    </div>
  );
}
