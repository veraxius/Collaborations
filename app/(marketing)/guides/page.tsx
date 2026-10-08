import type { Metadata } from "next";
import Link from "next/link";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { CtaBand } from "@/components/marketing/cta-band";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "DOT Compliance Guides for Small Fleets",
  description:
    "Plain-English guides to MCS-150 deadlines, DOT medical cards, driver qualification files, the New Entrant Safety Audit and annual vehicle inspections.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionEyebrow>Guides</SectionEyebrow>
          <h1 className="mk-h1 mt-3 text-5xl text-asphalt sm:text-6xl">
            DOT compliance, in plain English.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-asphalt/75">
            Short, practical guides for owner-operators and small carriers. Each one ends with the
            dates you need to track.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="mk-card mk-card-hover block p-7">
                <h2 className="font-condensed text-2xl font-semibold text-asphalt">{g.title}</h2>
                <p className="mt-2 text-asphalt/75">{g.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
