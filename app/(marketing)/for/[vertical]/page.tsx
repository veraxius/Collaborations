import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { CtaBand } from "@/components/marketing/cta-band";
import { VERTICAL_PAGES, getVertical } from "@/lib/verticals";
import { getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return VERTICAL_PAGES.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const v = getVertical((await params).vertical);
  if (!v) return {};
  return {
    title: `${v.name}: Credential and Insurance Tracking`,
    description: v.description,
    alternates: { canonical: `/for/${v.slug}` },
  };
}

export default async function VerticalPage({ params }: { params: Promise<{ vertical: string }> }) {
  const v = getVertical((await params).vertical);
  if (!v) notFound();
  const guide = getGuide(v.guide);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: v.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const signup = `/register?vertical=${v.slug}`;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="pt-8 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[32px] bg-asphalt px-6 py-16 text-center sm:px-14 sm:py-24">
            <SectionEyebrow dark>{v.eyebrow}</SectionEyebrow>
            <h1 className="mk-h1 mx-auto mt-4 max-w-4xl text-5xl text-chalk sm:text-7xl">{v.h1}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-chalk/80">{v.sub}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={signup} className="mk-btn mk-btn-primary">
                Start free — no credit card
              </Link>
              {guide && (
                <Link href={`/guides/${guide.slug}`} className="mk-btn mk-btn-secondary-dark">
                  Read the checklist
                </Link>
              )}
            </div>
            <p className="mt-5 font-plex text-sm text-chalk/70">Free for up to 3 vehicles · $29/month for unlimited</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {v.lenses.map((l) => (
              <div key={l.title} className="mk-card p-8">
                <h2 className="font-condensed text-2xl font-semibold text-asphalt">{l.title}</h2>
                <p className="mt-2.5 leading-relaxed text-asphalt/75">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <SectionEyebrow>What you can track</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">Every document with a date on it.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {v.tracks.map((t) => (
              <div key={t.title} className="mk-card p-8">
                <h3 className="font-condensed text-2xl font-semibold text-asphalt">{t.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-asphalt/80">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-compliance-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-[15px] leading-relaxed text-asphalt/70">{v.note}</p>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mk-h2 text-center text-4xl text-asphalt sm:text-5xl">Questions</h2>
          <dl className="mt-8 space-y-6">
            {v.faq.map((f) => (
              <div key={f.q}>
                <dt className="text-lg font-semibold text-asphalt">{f.q}</dt>
                <dd className="mt-1 text-lg leading-relaxed text-asphalt/80">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-center text-sm text-asphalt/60">
            FleetGuard is a tracking and reminder tool. It is not legal advice and does not file or renew anything for
            you.
          </p>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
