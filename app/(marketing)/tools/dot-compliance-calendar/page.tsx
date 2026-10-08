import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { CalendarTool } from "./calendar-tool";

export const metadata: Metadata = {
  title: "Free DOT Compliance Calendar: MCS-150, UCR, IFTA, 2290 Deadlines",
  description:
    "Enter your USDOT number and get your MCS-150 biennial update date plus UCR, IFTA and Form 2290 deadlines for the next 24 months. Free, downloadable to your calendar.",
  alternates: { canonical: "/tools/dot-compliance-calendar" },
};

export default function DotCalendarPage() {
  return (
    <main className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionEyebrow>Free tool</SectionEyebrow>
        <h1 className="mk-h1 mt-3 text-4xl text-asphalt sm:text-6xl">
          Find your MCS-150, UCR, IFTA and 2290 deadlines in 10 seconds.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-asphalt/80">
          Your MCS-150 biennial update month and year are set by your USDOT number. Enter it
          below, and download every federal deadline for the next two years straight into Google
          Calendar, Outlook or Apple Calendar — with alerts 14 and 3 days before.
        </p>
        <div className="mt-10">
          <CalendarTool />
        </div>
      </div>
    </main>
  );
}
