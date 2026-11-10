/**
 * Earnings / income card: total, scrubbable trend, split bar, per-source rows.
 *
 * Adapted from EasyUI's `Earnings` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui), including its monotone path and resample
 * helpers. Kept: the period switcher (7D / 30D / 12M), the big readout that
 * follows a scrubbed point or a highlighted source, the change pill vs the
 * previous period, the trend line with gradient area, the split bar, one row
 * per source with an initial avatar, bar, change and share, the footer line and
 * the screen-reader table. Trove changes:
 * - No count-up: the readout always shows real `formatMoney` values.
 * - Framer Motion became CSS: line draw-in on period change, bar growth,
 *   scrubber transform; reduced motion collapses them.
 * - Tokens instead of hard-coded colours; Trove's SegmentedControl look.
 * - Values arrive pre-computed from the analytics engine; nothing is invented
 *   (no demo sources, no fake payout).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../lib/motion";

export interface EarningsSource {
  id: string;
  label: string;
  amount: number;
  /** % change vs the previous period; undefined hides it. */
  change?: number;
  color: string;
}

export interface EarningsPeriod {
  id: string;
  label: string;
  /** Under the change pill, e.g. "vs previous 30 days". */
  comparison: string;
  total: number;
  /** Previous-period total; drives the change pill. */
  previous?: number;
  trend: number[];
  trendLabels: string[];
  sources: EarningsSource[];
}

const N_POINTS = 32;
const SPARK_H = 76;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const pct = (x: number) => `${Math.abs(x) >= 10 ? Math.round(Math.abs(x)) : Math.abs(x).toFixed(1)}%`;

function monotonePath(p: [number, number][]): string {
  const n = p.length;
  if (n < 2) return n ? `M${p[0][0]} ${p[0][1]}` : "";
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1][0] - p[i][0];
    m[i] = (p[i + 1][1] - p[i][1]) / (dx[i] || 1e-9);
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        t[i] = k * a * m[i];
        t[i + 1] = k * b * m[i];
      }
    }
  }
  let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(p[i][0] + h).toFixed(2)} ${(p[i][1] + t[i] * h).toFixed(2)} ${(p[i + 1][0] - h).toFixed(2)} ${(p[i + 1][1] - t[i + 1] * h).toFixed(2)} ${p[i + 1][0].toFixed(2)} ${p[i + 1][1].toFixed(2)}`;
  }
  return d;
}

/** Linear resample to a fixed point count (smooth line for any period length). */
function resample(v: number[], n: number): number[] {
  if (!v.length) return Array(n).fill(0);
  if (v.length === 1) return Array(n).fill(v[0]);
  return Array.from({ length: n }, (_, i) => {
    const x = (i / (n - 1)) * (v.length - 1);
    const i0 = Math.floor(x);
    const i1 = Math.min(v.length - 1, i0 + 1);
    return v[i0] + (v[i1] - v[i0]) * (x - i0);
  });
}

function useElementWidth<T extends HTMLElement>(initial: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.round(element.clientWidth) || initial);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [initial]);
  return [ref, width] as const;
}

export function EarningsCard({
  title,
  periods,
  defaultPeriod,
  format,
  footer,
  emptyText = "Nothing in this period.",
}: {
  title: string;
  periods: EarningsPeriod[];
  defaultPeriod?: string;
  /** formatMoney in the base currency. */
  format: (value: number) => string;
  /** e.g. the next expected income. */
  footer?: { label: ReactNode; value?: string };
  emptyText?: string;
}) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [sparkRef, width] = useElementWidth<HTMLDivElement>(480);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [periodId, setPeriodId] = useState(defaultPeriod ?? periods[Math.min(1, periods.length - 1)]?.id ?? "");
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];

  // Touch: tapping outside clears a selected source / scrub.
  useEffect(() => {
    if (activeSource === null && scrub === null) return;
    const down = (event: globalThis.PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) {
        setActiveSource(null);
        setScrub(null);
      }
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [activeSource, scrub]);

  if (!period) return null;

  const sources = period.sources;
  const sum = sources.reduce((s, x) => s + Math.max(0, x.amount), 0);
  const total = period.total;
  const trend = period.trend;
  const n = trend.length;
  const change = period.previous !== undefined && period.previous !== 0 ? ((total - period.previous) / Math.abs(period.previous)) * 100 : undefined;
  const changeRounded = change === undefined ? undefined : Math.round(change * 10) / 10;

  const src = sources.find((s) => s.id === activeSource) ?? null;
  const maxAmount = Math.max(1e-9, ...sources.map((s) => s.amount));
  const readout = src
    ? { label: src.label, value: src.amount, change: src.change, note: `${pct(sum ? (src.amount / sum) * 100 : 0)} of ${title.toLowerCase()}` }
    : scrub !== null && n
      ? { label: period.trendLabels[scrub] ?? `Point ${scrub + 1}`, value: trend[scrub], change: undefined, note: "received" }
      : { label: title, value: total, change: changeRounded, note: period.comparison };

  const padX = 2;
  const padT = 10;
  const padB = 6;
  const min = n ? Math.min(...trend) : 0;
  const span = (n ? Math.max(...trend) : 1) - min || 1;
  const yOf = (v: number) => padT + (1 - (v - min) / span) * (SPARK_H - padT - padB);
  const xOf = (f: number) => padX + f * (width - padX * 2);
  const smooth = resample(trend, N_POINTS);
  const pts = smooth.map((v, i) => [xOf(i / (N_POINTS - 1)), yOf(v)] as [number, number]);
  const line = monotonePath(pts);
  const area = n > 1 ? `${line}L${pts[N_POINTS - 1][0].toFixed(2)} ${SPARK_H}L${pts[0][0].toFixed(2)} ${SPARK_H}Z` : "";
  const accent = "rgb(var(--color-income))";

  let cursor: [number, number] | null = null;
  if (scrub !== null && n > 1) {
    const f = scrub / (n - 1);
    const i0 = Math.min(N_POINTS - 2, Math.floor(f * (N_POINTS - 1)));
    const lf = f * (N_POINTS - 1) - i0;
    cursor = [xOf(f), pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * lf];
  }

  const scrubTo = (event: PointerEvent) => {
    if (n < 2 || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    const f = clamp((event.clientX - box.left - padX) / (width - padX * 2), 0, 1);
    setScrub(Math.round(f * (n - 1)));
    setActiveSource(null);
  };
  const onSparkKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") setScrub((s) => clamp((s ?? n - 2) + 1, 0, n - 1));
    else if (event.key === "ArrowLeft") setScrub((s) => clamp((s ?? n) - 1, 0, n - 1));
    else if (event.key === "Escape") setScrub(null);
    else return;
    event.preventDefault();
  };
  const choosePeriod = (id: string) => {
    setPeriodId(id);
    setActiveSource(null);
    setScrub(null);
  };
  const hoverSource = (id: string | null) => (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    setActiveSource(id);
    setScrub(null);
  };
  const good = readout.change === undefined || readout.change === 0 ? null : readout.change > 0;

  return (
    <section ref={cardRef} aria-label={title} className="trove-card min-w-0 p-5 sm:p-6">
      {/* Header + period switcher. */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {periods.length > 1 && (
          <div role="radiogroup" aria-label="Period" className="inline-flex shrink-0 rounded-full bg-surface-sunken p-0.5">
            {periods.map((p) => {
              const on = p.id === period.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => choosePeriod(p.id)}
                  className={`h-8 rounded-full px-3 text-[12px] font-semibold transition-colors duration-fast ${
                    on ? "bg-surface-raised text-ink shadow-card" : "text-muted hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Readout. */}
      <div className="mt-4" aria-live="polite">
        <p className="h-[18px] truncate text-[12.5px] text-muted">{readout.label}</p>
        <p className="tabular mt-1 truncate text-[34px] font-bold leading-none tracking-[-0.04em] text-primary sm:text-[40px]">
          {format(readout.value)}
        </p>
        <p className="mt-2 flex min-h-[24px] flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
          {good !== null && readout.change !== undefined && (
            <span
              className={`tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                good ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
              }`}
            >
              <svg viewBox="0 0 10 10" className={`h-2 w-2 ${good ? "" : "rotate-180"}`} fill="currentColor" aria-hidden="true">
                <path d="M5 1.5 9 7.5H1Z" />
              </svg>
              {pct(readout.change)}
            </span>
          )}
          <span className="text-muted">{readout.note}</span>
        </p>
      </div>

      {/* Trend. */}
      <div ref={sparkRef} className="mt-4" style={{ height: SPARK_H }}>
        {n > 1 && (
          <svg
            ref={svgRef}
            width={width}
            height={SPARK_H}
            role="img"
            aria-label={`${title} trend, ${period.label}. Use left and right arrow keys to inspect.`}
            tabIndex={0}
            onKeyDown={onSparkKey}
            onPointerMove={scrubTo}
            onPointerDown={scrubTo}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setScrub(null);
            }}
            onBlur={() => setScrub(null)}
            className="block touch-pan-y overflow-visible rounded-md outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--ring-focus)/0.6)]"
          >
            <defs>
              <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={accent} stopOpacity="0.24" />
                <stop offset="1" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Re-keyed per period so the line redraws when you switch. */}
            <g key={period.id}>
              <path d={area} fill={`url(#${uid}-a)`} className={reduced ? undefined : "animate-fade-in [animation-delay:300ms]"} />
              <path
                d={line}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className={reduced ? undefined : "kpi-line"}
              />
            </g>
            <g
              style={{
                opacity: cursor ? 1 : 0,
                transform: cursor ? `translateX(${cursor[0]}px)` : undefined,
                transition: "opacity var(--motion-fast), transform var(--motion-fast) var(--ease-out-soft)",
              }}
            >
              <line y1={0} y2={SPARK_H} x1={0} x2={0} strokeDasharray="2 3" stroke="rgb(var(--color-line-strong))" />
              <circle cx={0} cy={cursor ? cursor[1] : 0} r={4.5} fill={accent} stroke="rgb(var(--color-surface))" strokeWidth={2} />
            </g>
          </svg>
        )}
      </div>

      {sources.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted">{emptyText}</p>
      ) : (
        <>
          {/* Split bar. */}
          <div className="mt-6 flex h-3 w-full gap-[3px]" role="presentation">
            {sources.map((s, i) => {
              const share = sum ? Math.max(0, s.amount) / sum : 0;
              const dim = activeSource !== null && activeSource !== s.id;
              return (
                <div
                  key={`${period.id}-${s.id}`}
                  className="h-full min-w-[3px] origin-left animate-progress-in cursor-pointer rounded-full"
                  style={{
                    flexGrow: Math.max(share, 0.004),
                    background: s.color,
                    opacity: dim ? 0.3 : 1,
                    transform: activeSource === s.id ? "scaleY(1.5)" : undefined,
                    transition: "opacity var(--motion-base), transform var(--motion-base) var(--ease-out-soft)",
                    animationDelay: `${i * 60}ms`,
                  }}
                  onPointerEnter={hoverSource(s.id)}
                  onPointerLeave={hoverSource(null)}
                  onClick={() => {
                    setActiveSource((a) => (a === s.id ? null : s.id));
                    setScrub(null);
                  }}
                />
              );
            })}
          </div>

          {/* Sources. */}
          <ul className="mt-3" aria-label={`${title} by source`}>
            {sources.map((s, i) => {
              const on = activeSource === s.id;
              const share = sum ? (Math.max(0, s.amount) / sum) * 100 : 0;
              const up = (s.change ?? 0) > 0;
              return (
                <li key={`${period.id}-${s.id}`}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onPointerEnter={hoverSource(s.id)}
                    onPointerLeave={hoverSource(null)}
                    onFocus={() => setActiveSource(s.id)}
                    onBlur={() => setActiveSource(null)}
                    onClick={(event) => {
                      if ((event.nativeEvent as globalThis.PointerEvent).pointerType === "mouse") return;
                      setActiveSource((a) => (a === s.id ? null : s.id));
                      setScrub(null);
                    }}
                    className={`relative flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-[background-color,opacity] duration-fast ${
                      on ? "bg-surface-sunken/70" : "[@media(hover:hover)]:hover:bg-surface-sunken/45"
                    } ${activeSource !== null && !on ? "opacity-55" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl text-[13px] font-bold"
                      style={{ color: s.color }}
                    >
                      <span className="absolute inset-0 opacity-15" style={{ background: s.color }} />
                      <span className="relative">{s.label.replace(/^\W+/, "").slice(0, 1).toUpperCase()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13.5px] font-semibold text-ink">{s.label}</span>
                        <span className="tabular shrink-0 text-[13.5px] font-semibold text-ink">{format(s.amount)}</span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-3">
                        <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                          <span
                            className="absolute inset-y-0 left-0 w-full origin-left animate-progress-in rounded-full"
                            style={{
                              background: s.color,
                              transform: `scaleX(${Math.max(0.01, s.amount / maxAmount)})`,
                              transition: "transform var(--motion-reveal) var(--ease-out-soft)",
                              animationDelay: `${100 + i * 60}ms`,
                            }}
                          />
                        </span>
                        <span className="tabular flex w-[92px] shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-muted">
                          {s.change !== undefined && Math.round(s.change * 10) !== 0 && (
                            <span className={up ? "text-income" : "text-expense"}>
                              <span aria-hidden="true">{up ? "▲" : "▼"}</span>
                              <span className="sr-only">{up ? "up" : "down"}</span> {pct(s.change)}
                            </span>
                          )}
                          <span>{pct(share)}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {footer && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/70 pt-4 text-[12.5px]">
          <span className="min-w-0 truncate text-muted">{footer.label}</span>
          {footer.value && <span className="tabular shrink-0 font-semibold text-ink">{footer.value}</span>}
        </div>
      )}

      <table className="sr-only">
        <caption>{`${title}, ${period.label}`}</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Amount</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <th scope="row">{s.label}</th>
              <td>{format(s.amount)}</td>
              <td>{pct(sum ? (s.amount / sum) * 100 : 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
