/**
 * Static, illustrative preview of the FleetGuard dashboard. Pure markup (no
 * screenshot to maintain). The data is sample data and is labelled as such.
 */
const ROWS = [
  { title: "Annual DOT inspection", owner: "Truck 04 · 7XK-2291", status: "Expired", days: "6 days ago", tone: "red" },
  { title: "DOT medical card", owner: "Marcus Reyes", status: "Expiring soon", days: "9 days left", tone: "amber" },
  { title: "Liability insurance (COI)", owner: "Company", status: "Expiring soon", days: "23 days left", tone: "amber" },
  { title: "CDL", owner: "Dana Whitfield", status: "OK", days: "311 days left", tone: "green" },
] as const;

const TONES = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-800",
  green: "bg-emerald-50 text-emerald-800",
} as const;

export function ProductPreview() {
  return (
    <figure className="mx-auto max-w-4xl">
      <div
        className="overflow-hidden rounded-[22px] border border-line bg-white text-left shadow-[0_30px_80px_rgb(16_24_32/0.22)]"
        role="img"
        aria-label="Example FleetGuard dashboard showing one expired document, two expiring soon and one up to date"
      >
        <div className="flex items-center gap-1.5 border-b border-line bg-chalk px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-asphalt/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-asphalt/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-asphalt/15" />
          <span className="ml-3 font-plex text-xs text-asphalt/60">fleetguard · Dashboard</span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-4 sm:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-line p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-signal-amber font-condensed text-xl font-bold text-asphalt">
              72
            </div>
            <div>
              <p className="text-xs font-medium text-asphalt/70">Fleet health</p>
              <p className="text-sm text-asphalt">Needs action</p>
            </div>
          </div>
          {[
            ["Expired", "1", "text-alert-red"],
            ["Expiring in 30 days", "2", "text-[#b87400]"],
            ["Up to date", "14", "text-compliance-green"],
          ].map(([label, n, color]) => (
            <div key={label} className="rounded-2xl border border-line p-4">
              <p className="text-xs font-medium text-asphalt/70">{label}</p>
              <p className={`mt-1 font-condensed text-4xl font-bold ${color}`}>{n}</p>
            </div>
          ))}
        </div>

        <ul className="divide-y divide-line border-t border-line">
          {ROWS.map((r) => (
            <li key={r.title} className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-asphalt">{r.title}</p>
                <p className="truncate text-sm text-asphalt/65">{r.owner}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[r.tone]}`}>
                  {r.status}
                </span>
                <p className="mt-1 text-xs text-asphalt/60">{r.days}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center font-plex text-xs text-asphalt/60">
        Example data. Your dashboard shows your own drivers, trucks and dates.
      </figcaption>
    </figure>
  );
}
