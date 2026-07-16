"use client";

import { LanguageProvider } from "@/components/providers/language-provider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
