import Link from "next/link";
import { Wordmark } from "@/components/marketing/navbar";
import { SUPPORT_EMAIL } from "@/components/marketing/config";

const SITE_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#what-we-track", label: "What we track" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MarketingFooter() {
  return (
    <footer className="mt-6 rounded-t-[28px] bg-asphalt text-chalk">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Wordmark dark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-chalk/70">
              Document and deadline tracking for small US motor carriers.
            </p>
          </div>
          <nav aria-label="Site">
            <h2 className="mk-eyebrow bg-signal-amber/15 text-signal-amber">
              Site
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-chalk/80 transition-colors hover:text-chalk"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2 className="mk-eyebrow bg-signal-amber/15 text-signal-amber">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-chalk/80 transition-colors hover:text-chalk"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-chalk/80 transition-colors hover:text-chalk"
                >
                  Terms
                </Link>
              </li>
              {SUPPORT_EMAIL && (
                <li>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-plex text-sm text-chalk/80 transition-colors hover:text-chalk"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-chalk/15 pt-8">
          <p className="text-[13px] leading-relaxed text-chalk/60">
            FleetGuard is an independent software product and is not affiliated
            with, endorsed by, or sponsored by the Federal Motor Carrier Safety
            Administration (FMCSA), the U.S. Department of Transportation, or
            any government agency. FleetGuard provides document tracking and
            reminders. It is not legal advice, and it does not file, renew, or
            submit documents on your behalf.
          </p>
          <p className="mt-4 font-plex text-[13px] text-chalk/60">
            © {new Date().getFullYear()} FleetGuard.
          </p>
        </div>
      </div>
    </footer>
  );
}
