import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How FleetGuard protects your fleet and driver records: access control, sign-in protection, data export and deletion, and what is not available yet.",
  alternates: { canonical: "/security" },
};

const IN_PLACE = [
  ["Your data stays yours", "Every record belongs to one company and every request is checked against it. One company can never read another's vehicles, drivers, documents or files."],
  ["Passwords are never stored", "Passwords are salted and hashed. Changing or resetting one signs out every other device."],
  ["Roles on your team", "Invite managers who can edit and viewers who can only look. Removing someone signs them out immediately."],
  ["Protected sign-in", "Repeated sign-in attempts are rate limited. Reset and invitation links are signed, expire, and work only once."],
  ["Safe uploads", "Only PDF and image files up to 10 MB are accepted, and a file can be opened only by the company that owns it."],
  ["Confirmed accounts only", "Reminders start only after the account owner confirms their email, so a stranger cannot sign up with your address and make us email you. Extra recipients and drivers are chosen by the account owner."],
  ["You can leave any time", "Export all your documents to CSV whenever you like, and delete your account and everything in it from Settings."],
  ["Audit trail", "The activity log records who added, changed, renewed or deleted what."],
];

const NOT_YET = [
  "Two-step verification at sign-in",
  "Single sign-on",
  "A third-party security certification such as SOC 2",
];

export default function SecurityPage() {
  return (
    <main className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionEyebrow>Security</SectionEyebrow>
        <h1 className="mk-h1 mt-3 text-4xl text-asphalt sm:text-6xl">Your fleet's records, handled with care.</h1>
        <p className="mt-5 text-lg leading-relaxed text-asphalt/80">
          Compliance records are sensitive. This is what is in place today, and, just as important, what is not yet.
        </p>

        <h2 className="mk-h2 mt-12 text-3xl text-asphalt">What is in place</h2>
        <ul className="mt-5 space-y-5">
          {IN_PLACE.map(([title, body]) => (
            <li key={title} className="flex items-start gap-3">
              <Check aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-compliance-green" />
              <div>
                <p className="font-semibold text-asphalt">{title}</p>
                <p className="mt-0.5 leading-relaxed text-asphalt/80">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mk-h2 mt-12 text-3xl text-asphalt">Not available yet</h2>
        <ul className="mt-5 space-y-3">
          {NOT_YET.map((item) => (
            <li key={item} className="flex items-start gap-3 text-asphalt/80">
              <Minus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-asphalt/50" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-12 leading-relaxed text-asphalt/80">
          Found a problem? Please tell us through the{" "}
          <Link href="/contact" className="font-medium text-asphalt underline decoration-signal-amber decoration-2 underline-offset-4">
            contact page
          </Link>{" "}
          and we will respond. FleetGuard tracks and reminds; it is not legal advice.
        </p>
      </div>
    </main>
  );
}
