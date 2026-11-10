/**
 * KPI tile: headline figure, direction-aware change pill, scrubbable sparkline.
 *
 * Adapted from EasyUI's `StatCard` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui), including its monotone-cubic path helper.
 * Kept: the layout, the change pill (good/bad depends on `goodWhen`), the
 * smooth line with gradient area, the pulsing latest point, pointer and
 * arrow-key scrubbing that swaps the headline to the scrubbed point, and the
 * live region. Trove changes: Framer Motion became CSS (line draw-in via
 * `pathLength`, pulse keyframe, scrubber transform transition); the headline
 * never counts up, so it always shows a real, `formatMoney`-formatted value;
 * colours and surfaces use design tokens; optional `aside` / `footer` slots;
 * the pill hides when the change can't be computed (previous value of 0).
 * Named KpiCard because Trove's simpler `StatCard` already exists.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../lib/motion";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
/** Unsigned percentage text; direction is carried by the arrow / words. */
const pctText = (x: number) => {
  const a = Math.abs(x);
  return `${a >= 10 ? Math.round(a) : a.toFixed(1)}%`;
};

/** Smooth monotone cubic through points (never overshoots the data). From EasyUI. */
function monotonePath(p: [number, number][]): string {
  const n = p.length;
  if (n === 0) return "";
  if (n === 1) return `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
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

export function KpiCard({
  label,
  description,
  value,
  trend,
  trendLabels,
  previous,
  changeFrom,
  goodWhen = "up",
  period = "vs previous period",
  format,
  color = "rgb(var(--color-primary))",
  chartHeight = 52,
  aside,
  footer,
  className = "",
}: {
  label: string;
  /** Secondary line under the label. */
  description?: ReactNode;
  /** Headline figure (usually the latest trend point). */
  value: number;
  /** Sparkline points, oldest → newest. */
  trend: number[];
  /** Names for each point, shown while scrubbing (e.g. "Oct"). */
  trendLabels?: string[];
  /** Comparison value for the change pill; defaults to the first trend point. */
  previous?: number;
  /**
   * The "now" side of the comparison when it should come from the same series
   * as `previous` (defaults to `value`). Keeps the pill like-for-like.
   */
  changeFrom?: number;
  /** Which direction is good news (use "down" for costs). */
  goodWhen?: "up" | "down";
  /** Text under the figure while not scrubbing, e.g. "vs last month". */
  period?: string;
  format: (value: number) => string;
  color?: string;
  chartHeight?: number;
  /** Extra content beside the figure (e.g. an assets caption). */
  aside?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [boxRef, width] = useElementWidth<HTMLDivElement>(260);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  // Touch: tapping outside the card clears the scrub.
  useEffect(() => {
    if (active === null) return;
    const down = (event: globalThis.PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [active]);

  const n = trend.length;
  const H = chartHeight;
  const padT = 8;
  const padB = 6;
  const padX = 6;
  const min = n ? Math.min(...trend) : 0;
  const span = (n ? Math.max(...trend) : 1) - min || 1;
  const stepX = n > 1 ? (width - padX * 2) / (n - 1) : 0;
  const pts = trend.map((v, i) => [padX + i * stepX, padT + (1 - (v - min) / span) * (H - padT - padB)] as [number, number]);
  const line = monotonePath(pts);
  const area = n > 1 ? `${line}L${pts[n - 1][0].toFixed(2)} ${H}L${pts[0][0].toFixed(2)} ${H}Z` : "";

  const base = previous ?? (n > 1 ? trend[0] : undefined);
  const current = changeFrom ?? value;
  const pct = base !== undefined && base !== 0 ? ((current - base) / Math.abs(base)) * 100 : null;
  const rounded = pct === null ? null : Math.round(pct * 10) / 10;
  const good = rounded === null || rounded === 0 ? null : goodWhen === "up" ? rounded > 0 : rounded < 0;

  const shownValue = active === null ? value : trend[active];
  const sub = active === null ? period : (trendLabels?.[active] ?? `Point ${active + 1}`);

  const move = (event: PointerEvent) => {
    if (n < 2 || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    setActive(clamp(Math.round((event.clientX - box.left - padX) / (stepX || 1)), 0, n - 1));
  };
  const onKey = (event: KeyboardEvent) => {
    if (n < 2) return;
    if (event.key === "ArrowRight") setActive((a) => clamp((a ?? n - 2) + 1, 0, n - 1));
    else if (event.key === "ArrowLeft") setActive((a) => clamp((a ?? n) - 1, 0, n - 1));
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  };

  const direction = rounded === null ? "" : rounded > 0 ? `, up ${pctText(rounded)} ${period}` : rounded < 0 ? `, down ${pctText(rounded)} ${period}` : `, unchanged ${period}`;
  const cursor = active !== null ? pts[active] : null;

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="group"
      aria-label={`${label}: ${format(value)}${direction}. Use left and right arrows to read each point.`}
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setActive(null);
      }}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
      className={`trove-card relative flex min-w-0 select-none flex-col overflow-hidden pt-5 outline-none transition-[box-shadow,border-color] duration-base focus-visible:shadow-[0_0_0_3px_rgb(var(--ring-focus)/0.35)] sm:pt-6 [@media(hover:hover)]:hover:border-line-strong ${className}`}
    >
      <div className="flex items-start justify-between gap-3 px-5 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-ink">{label}</h2>
          {description && <p className="mt-0.5 truncate text-[12px] text-muted">{description}</p>}
        </div>
        {rounded !== null && (
          <span
            className={`tabular inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
              good === null ? "bg-surface-sunken text-muted" : good ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
            }`}
          >
            {rounded !== 0 && (
              <svg viewBox="0 0 10 10" className={`h-2 w-2 ${rounded < 0 ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true">
                <path d="M5 1.5 9 7.5H1Z" />
              </svg>
            )}
            {pctText(rounded)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 px-5 sm:px-6">
        <div className="min-w-0">
          <p className="tabular truncate text-[28px] font-bold leading-none tracking-[-0.035em] text-primary sm:text-[30px]">
            {format(shownValue)}
          </p>
          <p className="mt-1.5 truncate text-[12px] text-muted">{sub}</p>
        </div>
        {aside && <div className="shrink-0 text-right">{aside}</div>}
      </div>

      {/* Absorbs extra height when the card is stretched to match a row. */}
      <div aria-hidden="true" className="min-h-0 flex-1" />
      <div ref={boxRef} className="mt-4" style={{ height: H }}>
        {n > 1 && (
          <svg ref={svgRef} width={width} height={H} aria-hidden="true" className="block overflow-visible">
            <defs>
              <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.24" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${uid}-g)`} className={reduced ? undefined : "animate-fade-in [animation-delay:350ms]"} />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className={reduced ? undefined : "kpi-line"}
            />
            {/* Latest point, with a slow pulse while idle. */}
            <g style={{ opacity: active === null ? 1 : 0, transition: "opacity var(--motion-fast)" }}>
              {!reduced && (
                <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3.5} fill={color} className="kpi-pulse" />
              )}
              <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3.5} fill={color} />
            </g>
            {/* Scrubber. */}
            <g
              style={{
                opacity: cursor ? 1 : 0,
                transform: cursor ? `translateX(${cursor[0]}px)` : undefined,
                transition: "opacity var(--motion-fast), transform var(--motion-fast) var(--ease-out-soft)",
              }}
            >
              <line y1={0} y2={H} x1={0} x2={0} stroke="rgb(var(--color-line-strong))" strokeDasharray="2 3" />
              <circle
                cx={0}
                cy={cursor ? cursor[1] : 0}
                r={4.5}
                fill={color}
                stroke="rgb(var(--color-surface))"
                strokeWidth={2}
                style={{ transition: "cy var(--motion-fast) var(--ease-out-soft)" }}
              />
            </g>
          </svg>
        )}
      </div>
      {trendLabels && n > 1 && (
        <div aria-hidden="true" className="flex justify-between px-5 pb-1 pt-1.5 text-[10.5px] text-faint sm:px-6">
          <span>{trendLabels[0]}</span>
          <span>{trendLabels[n - 1]}</span>
        </div>
      )}
      {footer && <div className="px-5 pb-4 pt-2 sm:px-6">{footer}</div>}
      {!footer && <div className="pb-3" />}

      <p className="sr-only" role="status" aria-live="polite">
        {active !== null ? `${trendLabels?.[active] ?? `Point ${active + 1}`}: ${format(trend[active])}` : ""}
      </p>
    </div>
  );
}
