import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { DocumentTitle } from "@/components/document-title";
import { BRAND_NAME, IS_PRIVATE, brandCssVars } from "@/lib/brand";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "DOT compliance software for small trucking fleets. Track CDLs, medical cards, insurance, inspections, IFTA, UCR and MCS-150 deadlines, and get email reminders 30, 15, 7 and 1 day before anything expires. Free for up to 3 trucks.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: IS_PRIVATE ? BRAND_NAME : "FleetGuard: DOT Compliance Tracking for Small Fleets",
    template: `%s | ${BRAND_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND_NAME,
  ...(IS_PRIVATE ? { robots: { index: false, follow: false } } : {}),
  keywords: [
    "DOT compliance software",
    "fleet compliance tracking",
    "driver qualification file",
    "DOT medical card tracker",
    "MCS-150 reminder",
    "new entrant safety audit",
    "small fleet software",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "FleetGuard",
    type: "website",
    locale: "en_US",
    title: "FleetGuard: DOT Compliance Tracking for Small Fleets",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetGuard: DOT Compliance Tracking for Small Fleets",
    description: DESCRIPTION,
  },
  ...(IS_PRIVATE
    ? {}
    : { robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } } }),
};

export const viewport: Viewport = {
  themeColor: "#101820",
  width: "device-width",
  initialScale: 1,
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FleetGuard",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: "Document and deadline tracking for small US motor carriers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={brandCssVars() as React.CSSProperties}
      className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-chalk font-sans text-asphalt antialiased">
        {!IS_PRIVATE && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
          />
        )}
        <DocumentTitle />
        {children}
      </body>
    </html>
  );
}
