import type { Metadata } from "next";
import { AmbientBackground } from "@/components/ambient-background";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "FleetGuard — DOT Compliance Tracking for Small Trucking Fleets",
  description:
    "Track every CDL, medical card, insurance certificate, inspection, and permit — and get warned 30, 15, 7, and 1 day before anything expires. Built for fleets of 1–100 trucks.",
  openGraph: {
    siteName: "FleetGuard",
    type: "website",
    title: "FleetGuard — DOT Compliance Tracking for Small Trucking Fleets",
    description:
      "Track every CDL, medical card, insurance certificate, inspection, and permit — and get warned 30, 15, 7, and 1 day before anything expires. Built for fleets of 1–100 trucks.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetGuard — DOT Compliance Tracking for Small Trucking Fleets",
    description:
      "Track every CDL, medical card, insurance certificate, inspection, and permit — and get warned 30, 15, 7, and 1 day before anything expires. Built for fleets of 1–100 trucks.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfbfd] font-sans text-neutral-900 antialiased">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
