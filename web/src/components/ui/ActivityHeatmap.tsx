/**
 * Activity heatmap: one cell per day, GitHub-style.
 *
 * Adapted from EasyUI's `ActivityHeatmap` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: responsive column fitting, quartile
 * intensity levels, month/weekday labels, arrow-key navigation with a live
 * region, pointer tooltips and the Less→More key. Trove changes: calendar mode
 * only; Framer Motion's animated ring/tooltip became CSS transitions; the cell
 * pop-in stagger is CSS and skipped for reduced motion; intensity uses
 * `fill-opacity` on a token colour instead of `color-mix` (older Android
 * WebViews); values are formatted by the caller (money), never re-rounded.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../lib/motion";

export interface HeatDay {
  /** "YYYY-MM-DD" (local calendar day). */
  date: string;
  value: number;
}

const DAY_MS = 86_400_000;
const toDay = (key: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key);
  return match ? Math.floor(Date.UTC(+match[1], +match[2] - 1, +match[3]) / DAY_MS) : null;
};
const weekday = (day: number) => (((day + 4) % 7) + 7) % 7; // 0 = Sunday
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEVEL_OPACITY = [0, 0.28, 0.5, 0.74, 1];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

interface Cell {
  c: number;
  r: number;
  v: number;
  title: string;
}

export function ActivityHeatmap({
  data,
  endDate,
  weeks = 26,
  weekStart = 0,
  color = "rgb(var(--color-primary))",
  formatValue = (value: number) => value.toFixed(0),
  summaryLabel,
  ariaLabel,
  minCell = 11,
}: {
  data: HeatDay[];
  /** Last day shown, "YYYY-MM-DD" (default: today). */
  endDate: string;
  /** Most weeks to show; narrow screens drop older weeks. */
  weeks?: number;
  weekStart?: 0 | 1;
  color?: string;
  formatValue?: (value: number) => string;
  /** e.g. (total, months) => "₱12,400 spent in the last 6 months" */
  summaryLabel?: (total: number, columns: number) => string;
  ariaLabel: string;
  minCell?: number;
}) {
  const reduced = useReducedMotion();
  const [rootRef, width] = useElementWidth<HTMLDivElement>(560);
  const [active, setActive] = useState<{ c: number; r: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setActive(null), []);
  useEffect(() => {
    if (!active) return;
    const down = (event: globalThis.PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [active, close]);

  const narrow = width < 440;
  const LW = narrow ? 18 : 30;
  const TOP = 18;
  const gap = 3;
  const innerW = Math.max(40, width - LW);
  const cols = clamp(Math.min(weeks, Math.floor((innerW + gap) / (minCell + gap))), 4, weeks);
  const cell = Math.min((innerW - (cols - 1) * gap) / cols, 16);

  const model = useMemo(() => {
    const totals = new Map<number, number>();
    for (const point of data) {
      const day = toDay(point.date);
      if (day === null || !Number.isFinite(point.value)) continue;
      totals.set(day, (totals.get(day) ?? 0) + Math.max(0, point.value));
    }
    const endDay = toDay(endDate) ?? 0;
    const lastColStart = endDay - ((weekday(endDay) - weekStart + 7) % 7);
    const first = lastColStart - (cols - 1) * 7;
    const cells: Cell[] = [];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < 7; r++) {
        const day = first + c * 7 + r;
        if (day > endDay) continue;
        cells.push({ c, r, v: totals.get(day) ?? 0, title: dayFmt.format(new Date(day * DAY_MS)) });
      }
    const nonZero = cells.filter((x) => x.v > 0).map((x) => x.v).sort((a, b) => a - b);
    const q = (p: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))] ?? 0;
    const t1 = q(0.25);
    const t2 = q(0.5);
    const t3 = q(0.75);
    const level = (v: number) => (v <= 0 ? 0 : v <= t1 ? 1 : v <= t2 ? 2 : v <= t3 ? 3 : 4);
    const total = cells.reduce((sum, x) => sum + x.v, 0);
    const best = cells.reduce<Cell | null>((b, x) => (!b || x.v > b.v ? x : b), null);
    return { cells, level, total, best, first };
  }, [data, endDate, weekStart, cols]);

  const byKey = useMemo(() => new Map(model.cells.map((x) => [`${x.c}:${x.r}`, x])), [model.cells]);
  const gx = (c: number) => LW + c * (cell + gap);
  const gy = (r: number) => TOP + r * (cell + gap);
  const svgH = TOP + 7 * cell + 6 * gap + 2;

  const monthLabels = useMemo(() => {
    const out: { c: number; text: string }[] = [];
    let prev = -1;
    let lastC = -9;
    for (let c = 0; c < cols; c++) {
      const date = new Date((model.first + c * 7) * DAY_MS);
      const month = date.getUTCMonth();
      if (month !== prev) {
        if ((prev === -1 && cols > 6) || (prev !== -1 && c - lastC >= 3 && c <= cols - 2)) {
          out.push({ c, text: monthFmt.format(date) });
          lastC = c;
        }
        prev = month;
      }
    }
    return out;
  }, [cols, model.first]);

  const rowNames = [1, 3, 5].map((k) => ({ r: (k - weekStart + 7) % 7, text: narrow ? WEEKDAYS[k].slice(0, 1) : WEEKDAYS[k] }));

  const locate = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const c = Math.floor((event.clientX - box.left - LW) / (cell + gap));
    const r = Math.floor((event.clientY - box.top - TOP) / (cell + gap));
    if (c < 0 || r < 0 || c >= cols || r > 6 || !byKey.has(`${c}:${r}`)) return setActive(null);
    setActive({ c, r });
  };
  const onKey = (event: KeyboardEvent) => {
    const dc = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const dr = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (event.key === "Escape") return setActive(null);
    if (!dc && !dr) return;
    event.preventDefault();
    setActive((current) => {
      const from = current ?? { c: cols - 1, r: 0 };
      const next = { c: clamp(from.c + dc, 0, cols - 1), r: clamp(from.r + dr, 0, 6) };
      return byKey.has(`${next.c}:${next.r}`) ? next : from;
    });
  };

  const current = active ? byKey.get(`${active.c}:${active.r}`) : null;
  const summary = summaryLabel ? summaryLabel(model.total, cols) : formatValue(model.total);
  const animate = !reduced;

  // Tooltip position, clamped inside the chart.
  const tipW = 150;
  const tipX = active ? clamp(gx(active.c) + cell / 2 - tipW / 2, 0, Math.max(0, width - tipW)) : 0;
  const tipYRaw = active ? gy(active.r) - 56 : 0;
  const tipY = tipYRaw < 0 && active ? gy(active.r) + cell + 8 : tipYRaw;

  return (
    <div ref={rootRef} className="w-full">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="tabular text-[13px] font-medium text-ink">{summary}</p>
        {model.best && model.best.v > 0 && (
          <p className="text-[12px] text-muted">
            Peak {model.best.title} · <span className="tabular">{formatValue(model.best.v)}</span>
          </p>
        )}
      </div>

      <div ref={wrapRef} className="relative" style={{ height: svgH }}>
        <svg
          width={width}
          height={svgH}
          role="img"
          aria-label={`${ariaLabel}. ${summary}. Use arrow keys to read each day.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={close}
          className="block touch-pan-y overflow-visible rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring-focus))]"
        >
          {monthLabels.map((label) => (
            <text key={label.c} x={gx(label.c)} y={11} className="fill-muted text-[11px]">
              {label.text}
            </text>
          ))}
          {rowNames.map((label) => (
            <text key={label.r} x={0} y={gy(label.r) + cell / 2} dominantBaseline="middle" className="fill-faint text-[10.5px]">
              {label.text}
            </text>
          ))}

          {model.cells.map((x) => {
            const level = model.level(x.v);
            const style = (animate
              ? { animationDelay: `${Math.min(x.c * 12 + x.r * 20, 600)}ms`, transformBox: "fill-box", transformOrigin: "center" }
              : {}) as CSSProperties;
            return (
              <rect
                key={`${x.c}:${x.r}`}
                x={gx(x.c)}
                y={gy(x.r)}
                width={cell}
                height={cell}
                rx={Math.min(3, cell / 4)}
                fill={level === 0 ? "rgb(var(--color-surface-sunken))" : color}
                fillOpacity={level === 0 ? 1 : LEVEL_OPACITY[level]}
                className={animate ? "heat-cell" : undefined}
                style={style}
              />
            );
          })}

          {/* Active ring. */}
          <rect
            width={cell + 2}
            height={cell + 2}
            rx={Math.min(4, cell / 3)}
            fill="none"
            strokeWidth={1.5}
            stroke="rgb(var(--color-ink))"
            style={{
              transform: `translate(${gx(active?.c ?? 0) - 1}px, ${gy(active?.r ?? 0) - 1}px)`,
              opacity: active ? 1 : 0,
              transition: "transform var(--motion-fast) var(--ease-out-soft), opacity var(--motion-fast) var(--ease-out-soft)",
            }}
          />

          <rect
            x={LW}
            y={TOP}
            width={cols * (cell + gap)}
            height={7 * (cell + gap)}
            fill="transparent"
            onPointerMove={locate}
            onPointerDown={locate}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") close();
            }}
          />
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 rounded-xl border border-line/70 bg-surface-raised px-3 py-2 text-[12px] shadow-raised"
          style={{
            width: tipW,
            transform: `translate(${tipX}px, ${tipY}px)`,
            opacity: current ? 1 : 0,
            transition: "opacity var(--motion-fast) var(--ease-out-soft)",
          }}
        >
          {current && (
            <>
              <p className="tabular font-semibold text-ink">{formatValue(current.v)}</p>
              <p className="mt-0.5 text-muted">{current.title}</p>
            </>
          )}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {current ? `${current.title}: ${formatValue(current.v)}` : ""}
      </p>

      <div className="mt-3 flex items-center justify-end gap-2 text-[11.5px] text-muted">
        Less
        <span className="flex gap-[3px]" aria-hidden="true">
          {LEVEL_OPACITY.map((opacity, index) => (
            <span
              key={index}
              className="h-[11px] w-[11px] rounded-[3px]"
              style={index === 0 ? { background: "rgb(var(--color-surface-sunken))" } : { background: color, opacity }}
            />
          ))}
        </span>
        More
      </div>
    </div>
  );
}
