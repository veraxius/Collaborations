import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

// Fonts are loaded once in app/layout.tsx and shared with the product UI.

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="mk relative z-0 min-h-screen bg-chalk"
    >
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
