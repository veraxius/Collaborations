/**
 * Minimal server-rendered SVG charts. No client JS, no dependencies.
 * Domain-specific to keep markup clean: scores are 0-100, bars are counts.
 */

const ACCENT = "#0071e3";
const ACCENT_SOFT = "#cfe2fa";
const GRID = "#ececec";
const TEXT = "#a3a3a3";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";

export function scoreColor(score: number): string {
  if (score >= 85) return GREEN;
  if (score >= 60) return AMBER;
  return RED;
}

/** Compliance trend, y-domain fixed to 0-100. */
export function AreaChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 560;
  const H = 190;
  const padX = 34;
  const padT = 16;
  const padB = 26;
  const n = points.length;

  const x = (i: number) => (n <= 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1));
  const y = (v: number) => padT + ((100 - v) * (H - padT - padB)) / 100;

  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(" ");
  const area =
    n > 1 ? `${line} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z` : "";

  const labelIdx = n <= 5 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  const last = points[n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={padX} y1={y(v)} x2={W - padX} y2={y(v)} stroke={GRID} strokeWidth="1" />
          <text x={padX - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill={TEXT}>
            {v}
          </text>
        </g>
      ))}
      {area && <path d={area} fill={ACCENT} opacity="0.08" />}
      {n > 1 && <path d={line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />}
      {last && (
        <g>
          <circle cx={x(n - 1)} cy={y(last.value)} r="4" fill={ACCENT} />
          <text
            x={Math.min(x(n - 1), W - padX - 4)}
            // Clamp so the label never gets clipped by the top edge; if the
            // point is too high, draw the label below it instead.
            y={y(last.value) - 10 < 12 ? y(last.value) + 18 : y(last.value) - 10}
            textAnchor="end"
            fontSize="11"
            fontWeight="600"
            fill="#171717"
          >
            {last.value}
          </text>
        </g>
      )}
      {labelIdx.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          // Anchor edge labels inward so long dates don't spill past the svg.
          textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          fontSize="10"
          fill={TEXT}
        >
          {points[i].label}
        </text>
      ))}
    </svg>
  );
}

/** Simple vertical bars with value labels. */
export function BarChart({
  bars,
  formatValue,
}: {
  bars: { label: string; value: number; highlight?: boolean }[];
  formatValue?: (v: number) => string;
}) {
  const W = 560;
  const H = 200;
  const padT = 22;
  const padB = 26;
  const padX = 8;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const bw = (W - padX * 2) / bars.length;
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <line x1={padX} y1={H - padB} x2={W - padX} y2={H - padB} stroke={GRID} strokeWidth="1" />
      {bars.map((b, i) => {
        const h = b.value === 0 ? 0 : Math.max(4, ((H - padT - padB) * b.value) / max);
        const bx = padX + i * bw + bw * 0.2;
        const by = H - padB - h;
        return (
          <g key={i}>
            {b.value > 0 && (
              <rect
                x={bx}
                y={by}
                width={bw * 0.6}
                height={h}
                rx="6"
                fill={b.highlight ? ACCENT : ACCENT_SOFT}
              />
            )}
            <text
              x={bx + bw * 0.3}
              y={by - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={b.value > 0 ? "#171717" : "#d4d4d4"}
            >
              {fmt(b.value)}
            </text>
            <text x={bx + bw * 0.3} y={H - 8} textAnchor="middle" fontSize="10" fill={TEXT}>
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Two-series stacked bars: a = bottom (good), b = top (bad). */
export function StackedBarChart({
  groups,
  aLabel,
  bLabel,
}: {
  groups: { label: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
}) {
  const W = 560;
  const H = 200;
  const padT = 22;
  const padB = 26;
  const padX = 8;
  const max = Math.max(1, ...groups.map((g) => g.a + g.b));
  const bw = (W - padX * 2) / groups.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-auto w-full">
      <line x1={padX} y1={H - padB} x2={W - padX} y2={H - padB} stroke={GRID} strokeWidth="1" />
      {groups.map((g, i) => {
        const total = g.a + g.b;
        const scale = (H - padT - padB) / max;
        const ha = g.a * scale;
        const hb = g.b * scale;
        const bx = padX + i * bw + bw * 0.2;
        return (
          <g key={i}>
            {g.a > 0 && (
              <rect x={bx} y={H - padB - ha} width={bw * 0.6} height={ha} rx="5" fill={GREEN} />
            )}
            {g.b > 0 && (
              <rect x={bx} y={H - padB - ha - hb} width={bw * 0.6} height={hb} rx="5" fill={RED} />
            )}
            {total > 0 && (
              <text
                x={bx + bw * 0.3}
                y={H - padB - ha - hb - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#171717"
              >
                {total}
              </text>
            )}
            <text x={bx + bw * 0.3} y={H - 8} textAnchor="middle" fontSize="10" fill={TEXT}>
              {g.label}
            </text>
          </g>
        );
      })}
      <g fontSize="11" fill="#525252">
        <circle cx={padX + 6} cy={H + 8} r="4" fill={GREEN} />
        <text x={padX + 15} y={H + 12}>{aLabel}</text>
        <circle cx={padX + 110} cy={H + 8} r="4" fill={RED} />
        <text x={padX + 119} y={H + 12}>{bLabel}</text>
      </g>
    </svg>
  );
}

/** Circular health score gauge. */
export function ScoreRing({ score, size = 116 }: { score: number; size?: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox="0 0 116 116" className="shrink-0">
      <circle cx="58" cy="58" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
      <circle
        cx="58"
        cy="58"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`}
        transform="rotate(-90 58 58)"
      />
      <text
        x="58"
        y="56"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        fill="#171717"
      >
        {score}
      </text>
      <text x="58" y="76" textAnchor="middle" fontSize="10" fill={TEXT}>
        / 100
      </text>
    </svg>
  );
}

/** Horizontal breakdown bars (div-based, responsive). */
export function HBarList({ rows }: { rows: { label: string; total: number; bad: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-neutral-700">{r.label}</span>
            <span className="tabular-nums text-neutral-400">
              {r.total}
              {r.bad > 0 && <span className="ml-2 text-red-500">{r.bad} expired</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="flex h-full" style={{ width: `${(r.total / max) * 100}%` }}>
              <div
                className="h-full rounded-l-full bg-[#cfe2fa]"
                style={{ width: `${((r.total - r.bad) / r.total) * 100}%` }}
              />
              {r.bad > 0 && (
                <div
                  className="h-full rounded-r-full bg-red-400"
                  style={{ width: `${(r.bad / r.total) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
