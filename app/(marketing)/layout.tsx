import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlow = Barlow({
  weight: ["400", "500"],
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

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mk relative z-0 min-h-screen bg-chalk ${barlowCondensed.variable} ${barlow.variable} ${plexMono.variable}`}
    >
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
