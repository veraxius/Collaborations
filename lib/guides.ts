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
  {
    slug: "nemt-driver-credential-checklist",
    title: "NEMT driver and vehicle credential checklist",
    summary: "What non-emergency medical transportation providers typically have to keep current.",
    description:
      "A practical checklist of the driver screening, training, vehicle and insurance documents NEMT providers typically track, and why the exact list depends on your state and broker.",
    updated: "2026-10-09",
    sections: [
      {
        heading: "The rules come from your state and your brokers",
        paragraphs: [
          "Non-emergency medical transportation is governed mostly by each state's Medicaid program and by the brokers that manage its rides. That is why two providers in different states can have different lists. In practice the broker's provider manual is often the strictest source, so start there.",
        ],
      },
      {
        heading: "Drivers: the people you put in front of patients",
        bullets: [
          "Valid driver's license and a motor vehicle record review.",
          "Criminal background check and a drug screen.",
          "CPR and First Aid certification.",
          "Passenger assistance and sensitivity training (often called PASS).",
          "Wheelchair securement training, and defensive driving where required.",
          "Exclusion-list checks, which some brokers require on a recurring basis.",
        ],
      },
      {
        heading: "Vehicles",
        bullets: [
          "A safety inspection, usually before a vehicle joins a broker's network and then on a schedule.",
          "Working accessibility equipment, such as lifts and securements, checked and documented.",
          "Current registration and an insurance certificate.",
        ],
      },
      {
        heading: "Company paperwork",
        bullets: [
          "Medicaid provider enrollment and each broker's credentialing.",
          "Insurance policies with limits that meet your state and broker contracts. Minimums vary, and brokers often ask for more than the state requires.",
        ],
      },
      {
        heading: "Why dates matter more than the checklist",
        paragraphs: [
          "Most of these items expire. A lapsed certification or insurance certificate puts a driver or vehicle out of compliance, which can pause trips and weaken your position if something goes wrong. Track each one with its date and get a reminder before it lapses. In FleetGuard, choose Non-emergency medical transportation in Settings and the NEMT quick-start items appear when you add a document.",
        ],
      },
    ],
    faq: [
      {
        q: "Is CPR and First Aid required by law for NEMT drivers?",
        a: "It is commonly a broker requirement rather than a state rule, and it varies. Check your broker's provider manual and your state Medicaid agency.",
      },
      {
        q: "How often does training need to be renewed?",
        a: "It depends on the certifying body and on your broker. Use the date on each certificate, and set the reminder from that.",
      },
    ],
    related: ["driver-qualification-file-checklist", "annual-vehicle-inspection-requirement"],
    source: {
      label: "NEMT driver requirements overview (vendor guide; confirm with your state Medicaid agency)",
      href: "https://mediroutes.com/blog/how-to-become-an-nemt-driver",
    },
  },
  {
    slug: "shuttle-van-16-passengers-rules",
    title: "Shuttle fleets: CDL and insurance rules for 16+ passenger vehicles",
    summary: "Seating capacity drives the driver license and the insurance minimum.",
    description:
      "How seating capacity changes the rules for shuttle operators: the CDL threshold at 16 passengers including the driver, and the federal insurance minimums for for-hire interstate passenger carriers.",
    updated: "2026-10-09",
    sections: [
      {
        heading: "Seating capacity sets the rules",
        paragraphs: [
          "For federal purposes, a vehicle designed to carry 16 or more passengers, including the driver, is a commercial motor vehicle. Its driver needs a CDL and is subject to drug and alcohol testing. Compensation does not change this: a nonprofit shuttle is covered the same way.",
        ],
      },
      {
        heading: "Insurance minimums for for-hire interstate carriers",
        paragraphs: [
          "Under 49 CFR 387.33, for-hire interstate passenger carriers must carry minimum liability coverage based on the largest seating capacity in the fleet.",
        ],
        bullets: [
          "Vehicles seating 16 or more (including the driver): $5,000,000.",
          "Vehicles seating 15 or fewer: $1,500,000.",
          "One larger vehicle sets the level for the whole fleet.",
        ],
      },
      {
        heading: "Other pieces to check for your operation",
        bullets: [
          "The passenger endorsement on the driver's CDL, and how your state tests for it.",
          "Your USDOT number, operating authority and MCS-150 update.",
          "State permits for carrying passengers.",
          "DOT medical cards and the annual Clearinghouse query for CDL drivers.",
        ],
      },
      {
        heading: "Keep the dates in one place",
        paragraphs: [
          "Driver credentials, the insurance filing, permits and inspections all expire on different dates. Add each with its date in FleetGuard and get a reminder before it lapses. Choose Independent shuttle fleet in Settings to see a quick-start list for your operation.",
        ],
      },
    ],
    faq: [
      {
        q: "Do smaller vans need a CDL?",
        a: "The CDL threshold is 16 passengers including the driver. Vans with fewer seats follow different rules, and other requirements can still apply. Check federal and state rules for your vehicles.",
      },
      {
        q: "Do these insurance minimums apply to every shuttle?",
        a: "They apply to for-hire interstate passenger carriers. Intrastate and some exempt operations differ, so confirm with your insurer and state regulator.",
      },
    ],
    related: ["dot-medical-card-expiration", "mcs-150-update-deadline"],
    source: {
      label: "eCFR: 49 CFR 387.33, Financial responsibility for passenger carriers",
      href: "https://www.ecfr.gov/current/title-49/section-387.33",
    },
  },
  {
    slug: "last-mile-contractor-insurance-checklist",
    title: "Last-mile delivery: contractor insurance and vetting checklist",
    summary: "Contractor status does not remove your exposure. What to keep current.",
    description:
      "A checklist for contracted last-mile delivery businesses: the insurance layers to hold, how driver-owned vehicles change the policy, and the vetting records to keep current.",
    updated: "2026-10-09",
    sections: [
      {
        heading: "Insurance usually comes in layers",
        bullets: [
          "Commercial auto for vehicles titled to the business.",
          "General liability and cargo coverage.",
          "Workers' compensation where it applies.",
          "Hired and non-owned auto, when contractors drive their own vehicles.",
        ],
      },
      {
        heading: "Driver-owned vehicles change the policy",
        paragraphs: [
          "Personal auto policies typically exclude commercial delivery use. When contractors use their own cars or vans, hired and non-owned auto coverage can protect the business, and each driver's own policy should be checked and dated.",
        ],
      },
      {
        heading: "Contractor status does not remove liability",
        paragraphs: [
          "Companies that classify drivers as independent contractors can still be exposed to accidents and cargo loss during deliveries. Classification rules are also changing state by state, so confirm yours with counsel.",
        ],
      },
      {
        heading: "Your contract sets the real requirements",
        paragraphs: [
          "If you work under a retailer, carrier or 3PL agreement, that contract often dictates the coverage you must hold. Compare your policies with it line by line, and track each policy's renewal date so a gap never appears at claim time.",
        ],
      },
      {
        heading: "Vetting records worth keeping current",
        bullets: [
          "Driver license and motor vehicle record review.",
          "Background check.",
          "Signed contractor agreement.",
          "Vehicle registration and, where required, an inspection.",
        ],
      },
      {
        heading: "Track it",
        paragraphs: [
          "Add each policy, contract and check with its date in FleetGuard and get a reminder before it lapses. Choose Contracted last-mile delivery in Settings to see a quick-start list for your operation.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I need commercial auto if my drivers use their own cars?",
        a: "Often the business needs hired and non-owned auto coverage instead, because personal policies usually exclude delivery. Ask a licensed agent about your setup.",
      },
      {
        q: "How often should driver checks be refreshed?",
        a: "That depends on your contracts and insurer. Many businesses recheck motor vehicle records yearly. Follow the schedule in your agreements.",
      },
    ],
    related: ["driver-qualification-file-checklist", "annual-vehicle-inspection-requirement"],
    source: {
      label: "Hub International: last-mile delivery insurance requirements (insurance broker FAQ)",
      href: "https://www.hubinternational.com/en-us/faqs/transportation/last-mile-delivery-insurance-requirements/",
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
