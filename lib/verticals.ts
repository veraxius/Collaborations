/**
 * Niche landing pages. FleetGuard's core stays DOT compliance for trucking:
 * these are additional angles for operators with the same problem (people who
 * must be cleared to drive, liability exposure, and time lost to paperwork).
 * Keep requirement claims general and point to the governing source.
 */
export type Vertical = {
  slug: "nemt" | "last-mile" | "shuttle";
  name: string;
  eyebrow: string;
  h1: string;
  sub: string;
  lenses: { title: string; body: string }[];
  tracks: { title: string; items: string[] }[];
  note: string;
  faq: { q: string; a: string }[];
  guide: string;
  description: string;
};

export const VERTICAL_PAGES: Vertical[] = [
  {
    slug: "nemt",
    name: "Non-emergency medical transportation",
    eyebrow: "For NEMT providers",
    h1: "Know every driver is cleared before the ride.",
    sub: "Credential tracking for non-emergency medical transportation: driver screening, training, vehicle inspections and insurance, with reminders before anything lapses.",
    description:
      "Track NEMT driver screening, CPR and PASS training, vehicle and lift inspections and insurance in one place, with reminders before anything expires. Free for up to 3 vehicles.",
    lenses: [
      {
        title: "People first",
        body: "Patients rely on drivers who are screened, trained and current. See at a glance who is cleared to drive today.",
      },
      {
        title: "Less liability",
        body: "An expired credential or a lapsed insurance certificate is exposure you can avoid. Keep a dated record you can show a broker or an auditor.",
      },
      {
        title: "Less time on paper",
        body: "Stop chasing documents for broker credentialing. One list and one reminder replace the folder, the spreadsheet and the memory.",
      },
    ],
    tracks: [
      {
        title: "Drivers",
        items: [
          "Background check",
          "MVR review",
          "Drug screen",
          "CPR and First Aid",
          "PASS training",
          "Wheelchair securement training",
        ],
      },
      {
        title: "Vehicles",
        items: ["Safety inspection", "Lift and securement inspection", "Registration", "Insurance certificate"],
      },
      {
        title: "Company",
        items: ["Broker credentialing", "Medicaid enrollment", "Insurance policies"],
      },
    ],
    note: "NEMT requirements are set by each state's Medicaid program and by the brokers you work with, so the list differs from place to place. FleetGuard tracks the items and dates you need. Confirm the list against your state and broker provider manuals.",
    faq: [
      {
        q: "Does FleetGuard know my state's NEMT rules?",
        a: "No. Requirements vary by state and by broker. FleetGuard gives you a starting list of common items and lets you set the dates that apply to you.",
      },
      {
        q: "Can I track training like CPR and PASS?",
        a: "Yes. Add each certification with its date and FleetGuard emails you before it expires. Validity periods vary, so adjust the default to what your broker requires.",
      },
    ],
    guide: "nemt-driver-credential-checklist",
  },
  {
    slug: "last-mile",
    name: "Contracted last-mile delivery",
    eyebrow: "For last-mile delivery businesses",
    h1: "Every contractor insured, vetted and current.",
    sub: "For independent delivery businesses that contract drivers for retailers, 3PLs and local carriers: track insurance, driver checks and contracts in one place.",
    description:
      "Track contractor insurance, driver checks and delivery contracts for a contracted last-mile delivery business, with reminders before anything expires. Free for up to 3 vehicles.",
    lenses: [
      {
        title: "People first",
        body: "Your drivers are people with their own vehicles and paperwork. Keep it simple for them and visible to you.",
      },
      {
        title: "Less liability",
        body: "Calling a driver a contractor does not remove your exposure after an accident. Know whose insurance, license and checks are current.",
      },
      {
        title: "Less time on paper",
        body: "Replace the shared folder and the spreadsheet with one reminder before each policy or contract runs out.",
      },
    ],
    tracks: [
      {
        title: "Drivers",
        items: ["Driver license", "Background check", "MVR review", "Contractor agreement"],
      },
      {
        title: "Vehicles",
        items: ["Commercial auto policy", "Registration", "Vehicle inspection"],
      },
      {
        title: "Company",
        items: ["General liability and cargo", "Workers' compensation", "Hired and non-owned auto", "Client contract requirements"],
      },
    ],
    note: "Your delivery contract usually dictates the coverage you must hold, and rules for classifying drivers change by state. Compare your policies with your contract and ask your insurance agent.",
    faq: [
      {
        q: "Is this only for trucks?",
        a: "No. Vehicles can be vans or cars. You track the documents each vehicle and driver needs, whatever the vehicle type.",
      },
      {
        q: "Can I track my clients' insurance requirements?",
        a: "Add the policies and contracts you must keep current, with their dates. FleetGuard reminds you before each one lapses.",
      },
    ],
    guide: "last-mile-contractor-insurance-checklist",
  },
  {
    slug: "shuttle",
    name: "Independent shuttle fleets",
    eyebrow: "For independent shuttle operators",
    h1: "Keep every shuttle and driver road-ready.",
    sub: "For independent shuttle operators: CDLs, medical cards, drug and alcohol testing, insurance filings and inspections, with reminders before anything lapses.",
    description:
      "Track shuttle driver CDLs and medical cards, drug and alcohol testing, passenger carrier insurance, permits and inspections, with reminders before anything expires. Free for up to 3 vehicles.",
    lenses: [
      {
        title: "People first",
        body: "Passengers trust you with their trip. A driver's credentials should never be a guess.",
      },
      {
        title: "Less liability",
        body: "Passenger carriers face higher insurance minimums and stricter driver rules. A lapse can be costly.",
      },
      {
        title: "Less time on paper",
        body: "No more reminders scattered across phones and calendars. One dashboard for the whole fleet.",
      },
    ],
    tracks: [
      {
        title: "Drivers",
        items: ["CDL with passenger endorsement", "DOT medical card", "MVR review", "Drug and alcohol testing", "Clearinghouse query"],
      },
      {
        title: "Vehicles",
        items: ["Annual inspection", "Registration", "Insurance"],
      },
      {
        title: "Company",
        items: ["MCS-150 update", "Operating authority", "Passenger carrier insurance filing", "State permits"],
      },
    ],
    note: "Rules depend on the vehicle's seating capacity and on whether you operate across state lines. Check the federal passenger carrier rules and your state's requirements for your operation.",
    faq: [
      {
        q: "Does every shuttle driver need a CDL?",
        a: "A vehicle designed to carry 16 or more passengers, including the driver, is a commercial motor vehicle, so its driver needs a CDL. Smaller vans follow different rules. Check the rules for your vehicles.",
      },
      {
        q: "Are there insurance minimums for passenger carriers?",
        a: "For-hire interstate passenger carriers have federal minimums that depend on seating capacity. Read our guide and confirm with your insurer.",
      },
    ],
    guide: "shuttle-van-16-passengers-rules",
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICAL_PAGES.find((v) => v.slug === slug);
}
