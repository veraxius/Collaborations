import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/marketing/cta-band";
import { SIGNUP_ROUTE } from "@/components/marketing/config";
import { GUIDES, getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.description },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      dateModified: guide.updated,
      author: { "@type": "Organization", name: "FleetGuard" },
      publisher: { "@type": "Organization", name: "FleetGuard" },
      mainEntityOfPage: `${site}/guides/${guide.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${site}/guides` },
        { "@type": "ListItem", position: 2, name: guide.title, item: `${site}/guides/${guide.slug}` },
      ],
    },
  ];

  const related = guide.related
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-asphalt/70">
            <Link href="/guides" className="underline decoration-signal-amber decoration-2 underline-offset-4">
              Guides
            </Link>
          </nav>
          <h1 className="mk-h1 mt-4 text-4xl text-asphalt sm:text-6xl">{guide.title}</h1>
          <p className="mt-3 font-plex text-xs text-asphalt/60">Updated {guide.updated}</p>

          {guide.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="mk-h2 text-3xl text-asphalt">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-lg leading-relaxed text-asphalt/85">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-lg leading-snug text-asphalt/85">
                      <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal-amber" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-12 rounded-[24px] bg-asphalt p-7 text-chalk sm:p-10">
            <h2 className="font-condensed text-3xl font-semibold">Track this date automatically</h2>
            <p className="mt-2 text-chalk/80">
              FleetGuard warns you 30, 15, 7 and 1 day before every expiration. Free for up to 3 trucks.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary">
                Start free
              </Link>
              <Link href="/tools/dot-compliance-calendar" className="mk-btn mk-btn-secondary-dark">
                Free compliance calendar
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mk-h2 text-3xl text-asphalt">Questions</h2>
            <dl className="mt-4 space-y-5">
              {guide.faq.map((f) => (
                <div key={f.q}>
                  <dt className="text-lg font-semibold text-asphalt">{f.q}</dt>
                  <dd className="mt-1 text-lg leading-relaxed text-asphalt/80">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-10 text-sm leading-relaxed text-asphalt/70">
            Source:{" "}
            <a
              href={guide.source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-signal-amber decoration-2 underline-offset-4"
            >
              {guide.source.label}
            </a>
            . This guide is general information, not legal advice. Rules change, so confirm with
            FMCSA or your state agency.
          </p>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="font-condensed text-2xl font-semibold text-asphalt">Keep reading</h2>
              <ul className="mt-3 space-y-2">
                {related.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}`}
                      className="font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4"
                    >
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
      <CtaBand />
    </main>
  );
}
