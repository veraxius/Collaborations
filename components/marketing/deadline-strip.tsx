/**
 * The Deadline Strip — FleetGuard's signature visual device.
 *
 * Hero variant: a highway-mile-marker timeline reading right-to-left toward
 * TODAY, with document chips positioned by distance to expiry. On load it
 * plays a single ~1.2s CSS animation (strip draws in, chips pop, the amber
 * chip near "7" slides back past "30" and turns green). Fully static under
 * prefers-reduced-motion (see globals.css).
 *
 * Divider variant: a thin static tick row (30 · 15 · 7 · 1) used exactly once,
 * before the pricing section.
 */

const TICKS = [
  { x: 150, label: "30" },
  { x: 340, label: "15" },
  { x: 530, label: "7" },
  { x: 700, label: "1" },
  { x: 840, label: "TODAY" },
];

type ChipProps = {
  cx: number;
  label: string;
  fill: string;
  textFill: string;
  chipClass: string;
  fillClass?: string;
};

function Chip({ cx, label, fill, textFill, chipClass, fillClass }: ChipProps) {
  const w = 150;
  const x = cx - w / 2;
  return (
    <g className={chipClass}>
      <line
        x1={cx}
        y1={140}
        x2={cx}
        y2={172}
        stroke="#F6F5F2"
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Pill-shaped chip with a soft drop shadow */}
      <rect
        x={x}
        y={100}
        width={w}
        height={40}
        rx={20}
        fill={fill}
        className={fillClass}
        filter="url(#mk-chip-shadow)"
      />
      {/* Document icon: sheet with folded corner */}
      <g transform={`translate(${x + 18}, 108)`}>
        <path
          d="M0 2 a2 2 0 0 1 2-2 h10 l6 6 v16 a2 2 0 0 1 -2 2 h-14 a2 2 0 0 1 -2-2 Z"
          fill="none"
          stroke={textFill}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 0 v6 h6"
          fill="none"
          stroke={textFill}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text
        x={x + 46}
        y={125}
        fontSize={14}
        fontWeight={500}
        fill={textFill}
        fontFamily="var(--font-barlow), Arial, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

export function DeadlineStripHero() {
  return (
    <svg
      viewBox="0 0 920 250"
      role="img"
      aria-label="Timeline of reminder mile markers at 30, 15, 7, and 1 day before today, with document chips moving from amber back to green as they are renewed"
      className="h-auto w-full"
    >
      <defs>
        <filter
          id="mk-chip-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="5"
            floodColor="#000000"
            floodOpacity="0.22"
          />
        </filter>
      </defs>

      {/* Baseline */}
      <line
        x1={30}
        y1={175}
        x2={890}
        y2={175}
        stroke="#F6F5F2"
        strokeOpacity={0.6}
        strokeWidth={2}
        strokeLinecap="round"
        className="mk-strip-line"
      />

      {/* Mile-marker ticks */}
      {TICKS.map((tick, i) => (
        <g key={tick.label} className={`mk-strip-tick mk-strip-tick-${i + 1}`}>
          <line
            x1={tick.x}
            y1={160}
            x2={tick.x}
            y2={190}
            stroke={tick.label === "TODAY" ? "#FFB100" : "#F6F5F2"}
            strokeOpacity={tick.label === "TODAY" ? 1 : 0.7}
            strokeWidth={tick.label === "TODAY" ? 4 : 3}
            strokeLinecap="round"
          />
          <text
            x={tick.x}
            y={218}
            textAnchor="middle"
            fontSize={16}
            fontWeight={500}
            fill={tick.label === "TODAY" ? "#FFB100" : "#F6F5F2"}
            fillOpacity={tick.label === "TODAY" ? 1 : 0.8}
            fontFamily="var(--font-plex-mono), ui-monospace, monospace"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* Document chips */}
      <Chip
        cx={150}
        label="CDL — J. Ramirez"
        fill="#1E9E6A"
        textFill="#F6F5F2"
        chipClass="mk-chip mk-chip-1"
      />
      <Chip
        cx={530}
        label="COI — Truck 12"
        fill="#FFB100"
        textFill="#101820"
        chipClass="mk-chip mk-chip-renew"
        fillClass="mk-chip-fill"
      />
      <Chip
        cx={840}
        label="INSP — Truck 9"
        fill="#D9482B"
        textFill="#F6F5F2"
        chipClass="mk-chip mk-chip-3"
      />
    </svg>
  );
}

export function DeadlineStripDivider() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-3xl px-6">
      <div className="relative flex items-center justify-between border-t border-asphalt/15 pt-3">
        {["30", "15", "7", "1", "TODAY"].map((label) => (
          <span key={label} className="flex flex-col items-center gap-1.5">
            <span className="-mt-3 block h-3 w-[3px] rounded-full bg-asphalt/25" />
            <span className="font-plex text-xs text-asphalt/50">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
