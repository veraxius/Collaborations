import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, FileSearch, TrafficCone } from "lucide-react";
import {
  DeadlineStripDivider,
  DeadlineStripHero,
} from "@/components/marketing/deadline-strip";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { faqItemsById, HOME_FAQ_IDS } from "@/components/marketing/faq-data";
import { CtaBand } from "@/components/marketing/cta-band";
import { SIGNUP_ROUTE } from "@/components/marketing/config";

export const metadata: Metadata = {
  title: "FleetGuard",
  description:
    "Track every CDL, medical card, insurance certificate, inspection, and permit — and get warned 30, 15, 7, and 1 day before anything expires. Built for fleets of 1–100 trucks.",
};

const PROBLEM_CARDS = [
  {
    icon: TrafficCone,
    title: "Roadside surprises",
    body: "Expired documents surface at the worst possible time: at a weigh station, during an inspection, or mid-load.",
  },
  {
    icon: Banknote,
    title: "Fines and downtime",
    body: "A single violation can cost more than a year of FleetGuard — before you count the revenue a parked truck doesn't earn.",
  },
  {
    icon: FileSearch,
    title: "A record that follows you",
    body: "Compliance history shows up in your CSA profile and your next insurance renewal. Clean records are worth real money.",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Load your fleet",
    body: "Add your drivers and vehicles and upload each document with its expiration date. Short on time? Send us your paperwork and we'll load everything for you — free with annual plans.",
  },
  {
    title: "FleetGuard watches every date",
    body: "CDLs, medical cards, insurance, inspections, registrations, IFTA, IRP, UCR — every expiration in one dashboard, color-coded green, amber, and red so you can read your whole fleet's status in five seconds.",
  },
  {
    title: "You get warned in time",
    body: "Automatic email alerts go out 30, 15, 7, and 1 day before each expiration. Renew it, upload the new document, and the clock resets. Nothing slips.",
  },
];

const TRACK_COLUMNS = [
  {
    title: "Drivers",
    items: [
      "CDL expirations",
      "DOT medical certificates",
      "MVR review dates",
      "Drug & alcohol program documents",
      "Any custom driver file",
    ],
  },
  {
    title: "Vehicles",
    items: [
      "Registrations",
      "Annual DOT inspections",
      "Insurance certificates (COI)",
      "Permits",
      "Maintenance records",
    ],
  },
  {
    title: "Company",
    items: [
      "IFTA renewals",
      "IRP renewals",
      "UCR registration",
      "Operating authority documents",
      "Insurance policies",
    ],
  },
];

const COMPARISON_CARDS = [
  {
    title: "Spreadsheets",
    body: 'Free — until a date slips through a filter, a file lives on one laptop, or the one person who "keeps the sheet" takes a vacation.',
    emphasized: false,
  },
  {
    title: "Enterprise compliance suites",
    body: "Powerful, and priced for 200-truck fleets: modules, contracts, per-seat fees, and training you don't have time for.",
    emphasized: false,
  },
  {
    title: "FleetGuard",
    body: "Everything a small carrier actually needs — every document, every deadline, automatic reminders — at a price that makes sense for 5 trucks, not 500.",
    emphasized: true,
  },
];

export default function HomePage() {
  return (
    <main>
      {/* 1. Hero */}
      <section className="pt-8 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[32px] bg-asphalt px-6 py-16 sm:px-14 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow dark>DOT compliance for small fleets</SectionEyebrow>
            <h1 className="mk-h1 mt-4 text-5xl text-chalk sm:text-6xl md:text-7xl">
              Never get caught with an expired document again.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-chalk/80">
              FleetGuard tracks every driver, vehicle, and company document
              your fleet needs to stay DOT-compliant — and warns you 30, 15, 7,
              and 1 day before anything expires. Built for carriers running 1
              to 100 trucks.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary">
                Start free 14-day trial
              </Link>
              <a href="#pricing" className="mk-btn mk-btn-secondary-dark">
                See pricing
              </a>
            </div>
              <p className="mt-5 font-plex text-sm text-chalk/60">
                No credit card required · Cancel anytime · Set up in minutes
              </p>
            </div>
            <div className="mx-auto mt-14 max-w-4xl">
              <DeadlineStripHero />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The problem */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <SectionEyebrow>The cost of one missed date</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
              One expired document can park a truck.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-asphalt/80">
              An out-of-service order doesn&apos;t wait for a convenient week.
              A lapsed medical card, an expired insurance certificate, or an
              overdue annual inspection can take a truck off the road the same
              day it&apos;s discovered — and the fine is only the beginning.
              Violations follow your safety record, your safety record follows
              your insurance premiums, and brokers check both. Most small
              carriers track all of this in a spreadsheet, a glove box, and
              somebody&apos;s memory. That works right up until the day it
              doesn&apos;t.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEM_CARDS.map((card) => (
              <div key={card.title} className="mk-card p-8">
                <card.icon
                  aria-hidden="true"
                  className="h-7 w-7 text-signal-amber"
                />
                <h3 className="mt-4 font-condensed text-2xl font-semibold text-asphalt">
                  {card.title}
                </h3>
                <p className="mt-2.5 leading-relaxed text-asphalt/75">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section id="how-it-works" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
              Three steps. Then it runs itself.
            </h2>
          </div>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={step.title}>
                <p
                  aria-hidden="true"
                  className="font-condensed text-6xl font-bold text-signal-amber"
                >
                  {i + 1}
                </p>
                <h3 className="mt-3 font-condensed text-2xl font-semibold text-asphalt">
                  {step.title}
                </h3>
                <p className="mt-2.5 leading-relaxed text-asphalt/75">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. What we track */}
      <section id="what-we-track" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <SectionEyebrow>Coverage</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
              Every document with a date on it.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TRACK_COLUMNS.map((column) => (
              <div key={column.title} className="mk-card p-8">
                <h3 className="font-condensed text-2xl font-semibold text-asphalt">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[15px] leading-snug text-asphalt/80"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal-amber"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-lg text-asphalt/75">
            Plus custom document types. If it expires, FleetGuard can track it.
          </p>
        </div>
      </section>

      {/* 5. New entrant band */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[32px] bg-asphalt px-6 py-20 text-center sm:px-14 sm:py-24">
            <SectionEyebrow dark>Just got your DOT number?</SectionEyebrow>
            <h2 className="mk-h2 mx-auto mt-4 max-w-3xl text-4xl text-chalk sm:text-5xl">
              Your New Entrant Safety Audit is already on the calendar.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-chalk/80">
              Every new carrier faces a New Entrant Safety Audit within its
              first months of operation — and the number one reason carriers
              struggle is missing or disorganized paperwork. Start FleetGuard
              on day one and walk into your audit with complete, organized,
              up-to-date files for every driver and every truck.
            </p>
            <div className="mt-8">
              <Link href={SIGNUP_ROUTE} className="mk-btn mk-btn-primary">
                Get audit-ready
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why FleetGuard */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <SectionEyebrow>Where FleetGuard fits</SectionEyebrow>
            <h2 className="mk-h2 mt-3 text-4xl text-asphalt sm:text-5xl">
              Built for the fleets the big platforms skip.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {COMPARISON_CARDS.map((card) => (
              <div
                key={card.title}
                className={`mk-card relative overflow-hidden p-8 ${
                  card.emphasized
                    ? "shadow-[0_14px_36px_rgb(16_24_32/0.10)]"
                    : ""
                }`}
              >
                {card.emphasized && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[18px] bg-signal-amber/5"
                  />
                )}
                <h3 className="relative font-condensed text-2xl font-semibold text-asphalt">
                  {card.title}
                </h3>
                <p className="relative mt-3 leading-relaxed text-asphalt/75">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing (preceded by the thin static Deadline Strip divider) */}
      <div className="pt-10">
        <DeadlineStripDivider />
      </div>
      <section id="pricing" className="scroll-mt-24 py-20 sm:py-24">
        <PricingSection />
      </section>

      {/* 8. FAQ preview */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mk-h2 text-center text-4xl text-asphalt sm:text-5xl">
            Questions, answered.
          </h2>
          <div className="mt-10">
            <FaqAccordion items={faqItemsById(HOME_FAQ_IDS)} />
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/faq"
              className="font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4 hover:text-asphalt/80"
            >
              Read all questions →
            </Link>
          </p>
        </div>
      </section>

      {/* 9. Final CTA band */}
      <CtaBand />
    </main>
  );
}
