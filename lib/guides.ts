/**
 * SEO guides. Keep claims to well-established FMCSA rules, cite the CFR part,
 * and always point readers to the agency for the final word.
 */
export type Guide = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  updated: string; // YYYY-MM-DD
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  faq: { q: string; a: string }[];
  related: string[];
  source: { label: string; href: string };
};

export const GUIDES: Guide[] = [
  {
    slug: "mcs-150-update-deadline",
    title: "When is your MCS-150 update due?",
    summary: "Your USDOT number sets the month and the year. Here is how to read it.",
    description:
      "How to find your MCS-150 biennial update deadline from your USDOT number: the last digit sets the month, the second-to-last digit sets odd or even years.",
    updated: "2026-10-08",
    sections: [
      {
        heading: "Who has to file the MCS-150 update",
        paragraphs: [
          "Every entity that holds a USDOT number must update its registration information with FMCSA every two years, even if nothing has changed. The update is filed on Form MCS-150 (or MCS-150B/150C where they apply) through FMCSA's online registration system.",
        ],
      },
      {
        heading: "How your USDOT number sets the deadline",
        paragraphs: [
          "FMCSA staggers the filings using the digits of your USDOT number. You must file by the last day of your month.",
        ],
        bullets: [
          "Last digit = month: 1 is January, 2 is February, and so on through 9 for September. A 0 means October.",
          "Second-to-last digit = year: if it is odd, you file in odd-numbered years (2027, 2029). If it is even, you file in even-numbered years (2026, 2028).",
          "Example: USDOT 1234567 ends in 7 (July) and the second-to-last digit is 6 (even), so the update is due by July 31 of every even-numbered year.",
        ],
      },
      {
        heading: "What happens if you miss it",
        paragraphs: [
          "Missing the biennial update can lead to civil penalties and to FMCSA deactivating your USDOT number, which stops you from operating legally until it is reactivated. Because the deadline comes only once every two years, it is one of the easiest dates to forget.",
        ],
      },
      {
        heading: "Never forget it again",
        paragraphs: [
          "Put the date in a system that warns you in advance. The free DOT compliance calendar on this site calculates your MCS-150 date from your USDOT number and exports it to your calendar. FleetGuard emails you 30, 15, 7 and 1 day before the deadline, along with every driver and vehicle document.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I have to file the MCS-150 if nothing changed?",
        a: "Yes. The biennial update is required even when none of your information has changed.",
      },
      {
        q: "Is the MCS-150 update the same as renewing my USDOT number?",
        a: "USDOT numbers do not expire, but you must keep the registration information current with the biennial update or the number can be deactivated.",
      },
    ],
    related: ["new-entrant-safety-audit-checklist", "driver-qualification-file-checklist"],
    source: {
      label: "FMCSA: When am I required to file a biennial update?",
      href: "https://www.fmcsa.dot.gov/faq/when-am-i-required-file-biennial-update",
    },
  },
  {
    slug: "dot-medical-card-expiration",
    title: "DOT medical card: how long it lasts and how to track it",
    summary: "Up to 24 months, sometimes less. What drivers and carriers must keep on file.",
    description:
      "How long a DOT medical examiner's certificate is valid, why some are issued for less than 24 months, and how fleets can avoid driving with an expired medical card.",
    updated: "2026-10-08",
    sections: [
      {
        heading: "How long is a DOT medical card valid?",
        paragraphs: [
          "A medical examiner's certificate for a commercial driver is valid for a maximum of 24 months. The examiner can issue a shorter certificate, for example one year, when a condition such as high blood pressure needs closer monitoring. The expiration date printed on the certificate is the one that counts.",
        ],
      },
      {
        heading: "Who needs one",
        paragraphs: [
          "Drivers who operate commercial motor vehicles in interstate commerce under the FMCSA physical qualification rules (49 CFR Part 391) generally need a valid certificate from an examiner listed on the FMCSA National Registry of Certified Medical Examiners.",
        ],
      },
      {
        heading: "What the carrier keeps on file",
        bullets: [
          "A copy of the current medical examiner's certificate in each driver's qualification file.",
          "Verification that the examiner is on the National Registry.",
          "A way to know, well before the date, that the next physical must be scheduled.",
        ],
      },
      {
        heading: "Why expired medical cards are costly",
        paragraphs: [
          "A driver whose certificate has lapsed is not medically qualified to drive a commercial vehicle. It can be found at a roadside inspection or during an audit, and it can put the driver out of service and hurt the carrier's safety record. Renewing a few weeks early costs nothing and removes the risk.",
        ],
      },
      {
        heading: "Track it automatically",
        paragraphs: [
          "In FleetGuard, add the medical card from the DOT quick-start list, enter the issue date and the 24-month expiry is filled in for you. You and the driver's dispatcher get reminders at 30, 15, 7 and 1 day before it expires.",
        ],
      },
    ],
    faq: [
      {
        q: "Can a DOT medical card be valid for longer than 24 months?",
        a: "No. 24 months is the maximum. Some are issued for 12 months or less depending on the driver's health.",
      },
      {
        q: "Does a CDL holder have to do anything else with the medical card?",
        a: "Most CDL holders must also provide their certificate to their state driver licensing agency so their record stays current. Check your state's process.",
      },
    ],
    related: ["driver-qualification-file-checklist", "new-entrant-safety-audit-checklist"],
    source: {
      label: "FMCSA: Medical Requirements for Commercial Drivers",
      href: "https://www.fmcsa.dot.gov/medical/driver-medical-requirements/medical-examiners-certificate",
    },
  },
  {
    slug: "driver-qualification-file-checklist",
    title: "Driver Qualification (DQ) file checklist",
    summary: "What belongs in every driver's file and which items expire.",
    description:
      "A practical checklist of what to keep in each driver qualification file under 49 CFR 391.51, and which documents need annual or periodic renewal.",
    updated: "2026-10-08",
    sections: [
      {
        heading: "What a DQ file is",
        paragraphs: [
          "Motor carriers must keep a driver qualification file for each driver they employ. The contents are set out in 49 CFR 391.51. Auditors and investigators ask for these files first, so missing items are the most common source of violations.",
        ],
      },
      {
        heading: "What it typically contains",
        bullets: [
          "The driver's employment application.",
          "Motor vehicle record (MVR) inquiries: an initial one and one at least every 12 months.",
          "Documentation of the annual review of the driver's driving record.",
          "A copy of the CDL or the road test certificate.",
          "The current medical examiner's certificate and National Registry verification.",
          "Safety performance history from previous employers.",
          "Drug and alcohol testing records, including pre-employment results and FMCSA Clearinghouse queries.",
        ],
      },
      {
        heading: "The items that quietly expire",
        paragraphs: [
          "Four dates cause most problems: the CDL expiration, the medical certificate (up to 24 months), the annual MVR review (every 12 months) and the annual Clearinghouse query (every 12 months). These are exactly the dates a spreadsheet loses.",
        ],
      },
      {
        heading: "Keep it audit-ready",
        paragraphs: [
          "Store a scan of every document next to its expiration date and review the dashboard weekly. FleetGuard keeps the file, the date and the reminder in one place, and exports everything to CSV if you ever need it.",
        ],
      },
    ],
    faq: [
      {
        q: "How long do I keep a DQ file?",
        a: "Generally for the length of employment and three years after the driver leaves, with some items allowed to be discarded earlier. Confirm retention rules in 49 CFR 391.51.",
      },
      {
        q: "Does an owner-operator need a DQ file?",
        a: "A carrier that is also the driver generally must maintain a DQ file for itself as well. Check the rules for your operation.",
      },
    ],
    related: ["dot-medical-card-expiration", "new-entrant-safety-audit-checklist"],
    source: {
      label: "eCFR: 49 CFR 391.51, Driver qualification files",
      href: "https://www.ecfr.gov/current/title-49/section-391.51",
    },
  },
  {
    slug: "new-entrant-safety-audit-checklist",
    title: "New Entrant Safety Audit checklist",
    summary: "What new carriers should have ready before the audit.",
    description:
      "What the FMCSA New Entrant Safety Audit looks at and a checklist of the records a new motor carrier should have organized: driver files, drug and alcohol testing, insurance and vehicle maintenance.",
    updated: "2026-10-08",
    sections: [
      {
        heading: "What the New Entrant program is",
        paragraphs: [
          "New motor carriers go through a monitoring period of roughly their first 18 months, and FMCSA conducts a safety audit during that time, in the first year of operation. The audit reviews whether you have basic safety management controls in place and can show them with records.",
        ],
      },
      {
        heading: "Records to have organized",
        bullets: [
          "A driver qualification file for every driver (application, MVRs, medical certificate, CDL or road test).",
          "Controlled substances and alcohol testing program documents and Clearinghouse queries.",
          "Hours-of-service records and supporting documents.",
          "Vehicle inspection, repair and maintenance records, including annual inspections.",
          "Proof of required insurance and registration.",
          "Your accident register.",
        ],
      },
      {
        heading: "The most common reason carriers struggle",
        paragraphs: [
          "Paperwork that exists but is scattered, undated or expired. The fix is boring and effective: put every document in one place with its expiration date from day one, and fix anything that is about to lapse before an auditor notices.",
        ],
      },
      {
        heading: "Start on day one",
        paragraphs: [
          "FleetGuard's DOT quick-start list adds the common items with their regulatory validity, so a small fleet can be loaded in under an hour. Start free, with no credit card.",
        ],
      },
    ],
    faq: [
      {
        q: "Is the safety audit a surprise?",
        a: "FMCSA notifies you to schedule it, so the real preparation window is the months before. Do not wait for the notice to organize your files.",
      },
      {
        q: "Does FleetGuard guarantee a passing audit?",
        a: "No. FleetGuard keeps your records and dates organized and warns you before documents lapse. Compliance itself remains your responsibility.",
      },
    ],
    related: ["driver-qualification-file-checklist", "mcs-150-update-deadline"],
    source: {
      label: "FMCSA: New Entrant Safety Assurance Program",
      href: "https://www.fmcsa.dot.gov/registration/new-entrant-safety-assurance-program",
    },
  },
  {
    slug: "annual-vehicle-inspection-requirement",
    title: "Annual DOT vehicle inspection requirement",
    summary: "Every 12 months, by a qualified inspector, and the report stays on file.",
    description:
      "The annual commercial motor vehicle inspection rule explained: every 12 months under 49 CFR 396.17, who may inspect, and how long to keep the report.",
    updated: "2026-10-08",
    sections: [
      {
        heading: "The rule in one line",
        paragraphs: [
          "Every commercial motor vehicle must pass a periodic inspection at least once every 12 months (49 CFR 396.17), unless it already passed an equivalent inspection within that window.",
        ],
      },
      {
        heading: "Who can perform it",
        paragraphs: [
          "The inspector must meet the qualification requirements in 49 CFR 396.19. Many carriers use a qualified shop, and some qualified employees can inspect their own fleet.",
        ],
      },
      {
        heading: "Records you must keep",
        bullets: [
          "A report of the inspection, kept by the carrier for 14 months.",
          "Proof of the inspection available on the vehicle, such as a copy of the report or a decal.",
        ],
      },
      {
        heading: "Why it is easy to miss",
        paragraphs: [
          "Each truck and trailer has its own date, and they drift as units are bought, sold or repaired. A single overdue inspection can be cited during a roadside check and placed against your safety record.",
        ],
      },
      {
        heading: "Track every unit",
        paragraphs: [
          "Add each vehicle in FleetGuard, pick Annual DOT inspection from the quick-start list, enter the inspection date and the next due date is calculated. Attach the report as a PDF or photo so it is there when you need it.",
        ],
      },
    ],
    faq: [
      {
        q: "Does a roadside inspection replace the annual inspection?",
        a: "Only if it meets the requirements of the periodic inspection and is documented as such. Do not assume it does.",
      },
      {
        q: "Do trailers need the annual inspection too?",
        a: "Yes. Trailers that are commercial motor vehicles under the rules are covered, so track them as separate units.",
      },
    ],
    related: ["driver-qualification-file-checklist", "new-entrant-safety-audit-checklist"],
    source: {
      label: "eCFR: 49 CFR 396.17, Periodic inspection",
      href: "https://www.ecfr.gov/current/title-49/section-396.17",
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
