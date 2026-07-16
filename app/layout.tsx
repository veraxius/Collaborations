import type { Metadata } from "next";
import { AmbientBackground } from "@/components/ambient-background";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetGuard — Never miss a fleet compliance deadline",
  description:
    "Track insurance, inspections, licenses and permits for your fleet. Get email reminders before anything expires.",
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
