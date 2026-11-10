/**
 * Circular progress for repayments, installments and goals.
 *
 * Adapted from OpenSource UI's `ProgressRingCard` (MIT, (c) 2026 Bidyut Kundu,
 * github.com/bidyut10/opensourceui). Kept: the r=40 / 100-unit ring geometry,
 * the dash-offset transition and the centred percentage. Trove changes: the
 * card chrome and demo "stages" were removed (callers supply real data and
 * their own layout); the gradient became a single semantic tone; the eased
 * count-up was dropped so the printed percentage is always the true value;
 * the progress is exposed as `role="progressbar"`.
 */
import type { CSSProperties } from "react";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TONES = {
  primary: "rgb(var(--color-progress))",
  income: "rgb(var(--color-income))",
  warning: "rgb(var(--color-warning))",
  expense: "rgb(var(--color-expense))",
} as const;

export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  tone = "primary",
  label,
  caption,
  className = "",
}: {
  /** 0–100; values outside are clamped for drawing only. */
  value: number;
  size?: number;
  stroke?: number;
  tone?: keyof typeof TONES;
  /** Accessible name, e.g. "Repaid". */
  label: string;
  /** Small text under the percentage. */
  caption?: string;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? value : 0;
  const clamped = Math.min(100, Math.max(0, safe));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const scaledStroke = (stroke / size) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgb(var(--color-surface-sunken))" strokeWidth={scaledStroke} />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={TONES[tone]}
          strokeWidth={scaledStroke}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="ring-progress transition-[stroke-dashoffset] duration-reveal ease-out-soft"
          style={{ ["--ring-from" as string]: CIRCUMFERENCE } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="tabular font-semibold leading-none tracking-[-0.02em] text-ink" style={{ fontSize: Math.max(12, size * 0.2) }}>
          {Math.round(safe)}%
        </span>
        {caption && <span className="mt-1 text-[10px] leading-none text-muted">{caption}</span>}
      </div>
    </div>
  );
}
