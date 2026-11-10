/**
 * Donut / semi-circle gauge.
 *
 * Arc geometry, rounded caps with a gap between segments, the semi-circle gauge
 * variant and the "active slice" centre readout are adapted from EasyUI's
 * `DonutChart` (MIT, (c) 2026 Suraj Maurya, github.com/Surajmaurya1/easyui).
 * Trove changes: Framer Motion springs became CSS transitions on stroke width
 * and opacity; colours come from design tokens; the active slice can be
 * controlled by the page so its own legend drives the chart; values are always
 * formatted by the caller (formatMoney), never re-rounded here.
 */
import { useState } from "react";

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

const DEFAULT_PALETTE = [
  "rgb(var(--color-primary))",
  "rgb(var(--color-accent))",
  "rgb(var(--color-transfer))",
  "rgb(var(--color-warning))",
  "rgb(var(--color-expense))",
  "rgb(var(--color-income))",
  "rgb(var(--color-muted))",
];

const arcPoint = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });

export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = arcPoint(cx, cy, r, a0);
  const p1 = arcPoint(cx, cy, r, a1);
  return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

export function DonutChart({
  slices,
  size = 168,
  thickness = 22,
  centerLabel,
  centerValue,
  ariaLabel,
  colors,
  showLegend = true,
  variant = "donut",
  activeIndex,
  onActiveChange,
  formatValue,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  ariaLabel: string;
  colors?: readonly string[];
  /** Set false when the page renders its own richer legend. */
  showLegend?: boolean;
  /** `semi` draws a half-ring gauge. */
  variant?: "donut" | "semi";
  /** Controlled highlight (index into `slices`), e.g. from a page legend. */
  activeIndex?: number | null;
  onActiveChange?: (index: number | null) => void;
  /** Formats a slice value for the centre readout while a slice is active. */
  formatValue?: (value: number) => string;
}) {
  const palette = colors ?? DEFAULT_PALETTE;
  const [innerActive, setInnerActive] = useState<number | null>(null);
  const active = activeIndex !== undefined ? activeIndex : innerActive;
  const setActive = (index: number | null) => {
    if (activeIndex === undefined) setInnerActive(index);
    onActiveChange?.(index);
  };

  const semi = variant === "semi";
  const grow = thickness + 5;
  const r = size / 2 - grow / 2 - 1;
  const cy = semi ? r + grow / 2 + 1 : size / 2;
  const height = semi ? Math.round(r + grow + 3) : size;
  const start = semi ? -Math.PI / 2 : 0;
  const sweep = semi ? Math.PI : Math.PI * 2;

  const visible = slices.map((slice, index) => ({ ...slice, index })).filter((slice) => Math.abs(slice.value) > 0);
  const total = visible.reduce((sum, slice) => sum + Math.abs(slice.value), 0);
  const multi = visible.length > 1;
  const pad = multi ? 2.5 / r + thickness / 2 / r : 0;
  let acc = 0;
  const segments = visible.map((slice) => {
    const fraction = Math.abs(slice.value) / (total || 1);
    const a0 = start + acc * sweep;
    acc += fraction;
    const a1 = start + acc * sweep;
    const room = a1 - a0 - 2 * pad;
    const mid = (a0 + a1) / 2;
    return {
      ...slice,
      color: slice.color ?? palette[slice.index % palette.length],
      percent: fraction * 100,
      // A full single slice is drawn as an (almost) closed ring.
      a0: !multi && !semi ? 0 : room > 0 ? a0 + pad : mid - 0.0005,
      a1: !multi && !semi ? Math.PI * 1.9999 : room > 0 ? a1 - pad : mid + 0.0005,
    };
  });
  const current = active !== null ? segments.find((segment) => segment.index === active) : undefined;
  const cx = size / 2;

  return (
    <figure className="flex items-center gap-4">
      <figcaption className="sr-only">{ariaLabel}</figcaption>
      <div
        className="relative shrink-0"
        style={{ width: size, height }}
        role="img"
        aria-label={ariaLabel}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
      >
        <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} className="block animate-fade-in overflow-visible">
          <path
            d={semi ? arcPath(cx, cy, r, start, start + sweep) : arcPath(cx, cy, r, 0, Math.PI * 1.9999)}
            fill="none"
            stroke="rgb(var(--color-line))"
            strokeOpacity={0.55}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {segments.map((segment) => {
            const on = active === segment.index;
            const d = arcPath(cx, cy, r, segment.a0, segment.a1);
            return (
              <g
                key={`${segment.label}-${segment.index}`}
                style={{ opacity: active !== null && !on ? 0.35 : 1, transition: "opacity var(--motion-base) var(--ease-out-soft)" }}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={on ? thickness + 4 : thickness}
                  strokeLinecap={multi || semi ? "round" : "butt"}
                  style={{ transition: "stroke-width var(--motion-base) var(--ease-out-soft)" }}
                />
                {/* Wide transparent hit area so slices are easy to tap. */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={thickness + 14}
                  pointerEvents="stroke"
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setActive(segment.index);
                  }}
                  onClick={(event) => {
                    if ((event.nativeEvent as PointerEvent).pointerType === "mouse") return;
                    setActive(on ? null : segment.index);
                  }}
                >
                  <title>{`${segment.label}: ${segment.percent.toFixed(1)}%`}</title>
                </path>
              </g>
            );
          })}
        </svg>
        {(centerValue || centerLabel || current) && (
          <div
            className={`pointer-events-none absolute inset-x-0 flex flex-col items-center text-center ${semi ? "bottom-0 justify-end" : "inset-y-0 justify-center"}`}
          >
            <div key={current ? current.index : "total"} className="max-w-[62%] animate-fade-in">
              {current ? (
                <>
                  <span className="block truncate text-[11px] text-muted">{current.label}</span>
                  <span className="tabular block text-[15px] font-semibold leading-tight text-ink">
                    {formatValue ? formatValue(Math.abs(current.value)) : `${current.percent.toFixed(0)}%`}
                  </span>
                  {formatValue && <span className="tabular block text-[11px] text-muted">{current.percent.toFixed(0)}%</span>}
                </>
              ) : (
                <>
                  {centerValue && <span className="tabular block text-title font-semibold text-ink">{centerValue}</span>}
                  {centerLabel && <span className="mt-0.5 block text-[11px] text-muted">{centerLabel}</span>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {showLegend && (
        <ul className="min-w-0 flex-1 space-y-0.5">
          {segments.slice(0, 7).map((segment) => (
            <li key={`${segment.label}-${segment.index}`}>
              <button
                type="button"
                aria-pressed={active === segment.index}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setActive(segment.index);
                }}
                onFocus={() => setActive(segment.index)}
                onBlur={() => setActive(null)}
                onClick={(event) => {
                  if ((event.nativeEvent as PointerEvent).pointerType === "mouse") return;
                  setActive(active === segment.index ? null : segment.index);
                }}
                className="flex min-h-[32px] w-full items-center gap-2 rounded-lg px-1.5 text-left text-xs hover:bg-surface-sunken/70"
              >
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} />
                <span className="min-w-0 flex-1 truncate text-ink-soft">{segment.label}</span>
                <span className="tabular shrink-0 text-muted">{segment.percent.toFixed(0)}%</span>
              </button>
            </li>
          ))}
          {segments.length > 7 && <li className="px-1.5 text-xs text-muted">+{segments.length - 7} more</li>}
        </ul>
      )}
    </figure>
  );
}
