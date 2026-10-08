import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

export const metadata: Metadata = {
  title: "Private DOT Compliance Software, Branded for You",
  description:
    "Your own private installation of FleetGuard with your branding, your domain and your data. One-time license, no monthly fee. For large fleets, insurance agencies and compliance consultants.",
  alternates: { canonical: "/enterprise" },
};

const INCLUDED = [
  "A dedicated installation and database, not shared with anyone",
  "Your name, logo and colors throughout the app and reminder emails",
  "Your own domain",
  "Unlimited vehicles, drivers and documents",
  "Email reminders at 30, 15, 7 and 1 day before every expiration",
  "DOT document types and quick-start list for CDL, medical cards, MVR, inspections, IFTA, UCR and MCS-150",
  "AI assistant that answers questions about your own documents",
  "CSV export of all your data, any time",
  "We deploy it and load your first documents with you",
];

const FOR = [
  {
    title: "Fleets of 50+ trucks",
    body: "Keep your compliance data on your own installation, under your own brand, without per-seat or per-truck fees.",
  },
  {
    title: "Insurance agencies",
    body: "Give policyholders a branded compliance tool that keeps their documents current and your renewals clean.",
  },
  {
    title: "Compliance consultants",
    body: "Offer your clients a system with your name on it instead of a spreadsheet and a reminder calendar.",
  },
];

export default function EnterprisePage() {
  return (
    <main>
      <section className="pt-8 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[32px] bg-asphalt px-6 py-16 text-center sm:px-14 sm:py-24">
            <SectionEyebrow dark>Private installation</SectionEyebrow>
            <h1 className="mk-h1 mx-auto mt-4 max-w-4xl text-5xl text-chalk sm:text-7xl">
              Your own FleetGuard. Your brand. Your data.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-chalk/80">
              A complete, dedicated copy of the software, set up with your name, your logo and
              your domain. Pay once. No monthly license.
            </p>
            <p className="mt-8 font-plex text-3xl font-medium text-chalk sm:text-4xl">
              One-time license
              <span className="block text-xl text-chalk/60 sm:text-2xl">
                Priced to fit your fleet. Let&apos;s talk.
              </span>
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact" className="mk-btn mk-btn-primary">
                Book a walkthrough
              </Link>
              <Link href="/pricing" className="mk-btn mk-btn-secondary-dark">
                See the standard plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
              When a shared SaaS isn&apos;t the right fit.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FOR.map((f) => (
              <div key={f.title} className="mk-card p-8">
                <h3 className="font-condensed text-2xl font-semibold text-asphalt">{f.title}</h3>
                <p className="mt-2.5 leading-relaxed text-asphalt/75">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <SectionEyebrow>What&apos;s included</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">The complete product.</h2>
            <ul className="mt-6 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-compliance-green" />
                  <span className="text-[17px] leading-snug text-asphalt/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mk-card self-start p-8">
            <h3 className="font-condensed text-3xl font-semibold text-asphalt">How it works</h3>
            <ol className="mt-5 space-y-5">
              {[
                ["We scope it together", "A short call to understand your fleet, your branding and anything you want changed."],
                ["We build and deploy your instance", "Your branding, your domain, your database. We load your first documents with you."],
                ["You go live", "Your team signs in to your own system. Hosting and ongoing support are quoted separately."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-condensed text-4xl font-bold text-signal-amber">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-asphalt">{t}</p>
                    <p className="mt-1 text-asphalt/75">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/contact" className="mk-btn mk-btn-primary mt-8 w-full">
              Book a walkthrough
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
