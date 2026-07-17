export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-does-fleetguard-do",
    question: "What exactly does FleetGuard do?",
    answer:
      "FleetGuard is a compliance document tracker for small motor carriers. You load your drivers, vehicles, and company documents once; FleetGuard keeps every expiration date in a single color-coded dashboard and emails you 30, 15, 7, and 1 day before anything expires. Its job is simple: nothing under your authority ever lapses because nobody was watching the date.",
  },
  {
    id: "which-documents",
    question: "Which documents and deadlines can it track?",
    answer:
      "Driver-side: CDL expirations, DOT medical certificates, MVR review dates, and drug & alcohol program documents. Vehicle-side: registrations, annual DOT inspections, insurance certificates, and permits. Company-side: IFTA, IRP, and UCR renewals, operating authority documents, and insurance policies. You can also create custom document types — if it has an expiration date, FleetGuard can track it.",
  },
  {
    id: "how-reminders-work",
    question: "How do the reminders work?",
    answer:
      "A scheduled job checks your entire fleet every morning. For each document, you get an email alert 30, 15, 7, and 1 day before its expiration date, so a renewal never depends on someone remembering to check a spreadsheet. When you upload the renewed document, the countdown resets automatically.",
  },
  {
    id: "does-fleetguard-file",
    question: "Does FleetGuard file paperwork or renew documents for me?",
    answer:
      "No. FleetGuard is a tracking and reminder system, not a filing service or a compliance agency. We make sure you always know what's expiring and when, with enough lead time to act — but renewals, filings, and submissions stay in your hands (or your agent's). FleetGuard also isn't legal advice.",
  },
  {
    id: "fmcsa-affiliation",
    question: "Is FleetGuard affiliated with the FMCSA or U.S. DOT?",
    answer:
      "No. FleetGuard is an independent software product with no affiliation to, endorsement from, or sponsorship by the FMCSA, the U.S. DOT, or any government agency.",
  },
  {
    id: "new-entrant-audit",
    question:
      "I just got my DOT number and my New Entrant Safety Audit is coming. How does FleetGuard help?",
    answer:
      "The audit largely comes down to whether your records are complete, current, and organized — and that's exactly what FleetGuard maintains. Start on day one, load every driver and vehicle document, and you'll walk into the audit with organized, up-to-date files instead of a shoebox of paper. The dashboard also shows you at a glance if anything is missing or about to lapse before the auditor finds it.",
  },
  {
    id: "setup-white-glove",
    question: "How long does setup take? What's white-glove onboarding?",
    answer:
      "If you have your documents at hand, a small fleet is typically loaded in under an hour. Prefer not to do data entry at all? With white-glove onboarding, you send us your paperwork and we load your entire fleet for you — it's included free with annual plans and available as a $149 one-time service on monthly plans.",
  },
  {
    id: "fleet-size",
    question: "What size fleets is FleetGuard for?",
    answer:
      "FleetGuard is built for carriers running 1 to 100 trucks — owner-operators with their own authority, family fleets, and growing small carriers. If you run more than 100 trucks or manage multiple companies, contact us and we'll set you up directly.",
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Your documents are stored securely, transmitted over encrypted connections, and visible only to your company's account. We don't sell or share your data. Your paperwork is your business — literally.",
  },
  {
    id: "pricing-cancel",
    question: "What does it cost? Can I cancel anytime?",
    answer:
      "$5 per truck per month with a $79/month minimum, or save two months with annual billing at $50 per truck per year ($790/year minimum, white-glove onboarding included). Every plan starts with a free 14-day trial, no credit card required. Monthly plans cancel anytime — no contracts, no cancellation fees.",
  },
  {
    id: "install",
    question: "Do I need to install anything?",
    answer:
      "No. FleetGuard runs in the browser and works on any computer, tablet, or phone. There's nothing to install and nothing to update — sign in from anywhere and you're looking at your fleet's live status.",
  },
  {
    id: "cancel-documents",
    question: "What happens to my documents if I cancel?",
    answer:
      "They're yours. Cancel whenever you like, and if you want your records, contact us and we'll send you a complete export of your documents and expiration data. We don't hold your paperwork hostage.",
  },
];

export function faqItemsById(ids: string[]): FaqItem[] {
  return ids
    .map((id) => FAQ_ITEMS.find((item) => item.id === id))
    .filter((item): item is FaqItem => Boolean(item));
}

/** Home FAQ preview: items 1, 4, 6, 10. */
export const HOME_FAQ_IDS = [
  "what-does-fleetguard-do",
  "does-fleetguard-file",
  "new-entrant-audit",
  "pricing-cancel",
];

/** Pricing page subset: items 10, 12, 7, 4. */
export const PRICING_FAQ_IDS = [
  "pricing-cancel",
  "cancel-documents",
  "setup-white-glove",
  "does-fleetguard-file",
];
