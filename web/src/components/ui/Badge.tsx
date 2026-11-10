/**
 * Badge: status labels, counts and removable chips.
 *
 * Adapted from EasyUI's `Badge` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: soft / solid / outline variants, the
 * optional leading status dot with a soft ping for live states, the × button
 * that turns a badge into a removable chip, and text/numbers that roll in when
 * they change. Trove changes:
 * - Framer Motion springs became a CSS keyframe (keyed on the value, so only a
 *   real change animates); reduced motion collapses it.
 * - Trove's semantic tones (income, expense, warning, primary, info, neutral and
 *   the schedule tones paid / next / upcoming) on theme tokens, light and dark.
 * - Same props as the previous Trove Badge (`tone`, `icon`, `className`), so
 *   every existing badge keeps working; the remove button has a real label.
 */
import type { ReactNode } from "react";
import { X } from "lucide-react";

export type BadgeTone = "neutral" | "primary" | "income" | "expense" | "warning" | "info" | "paid" | "next" | "upcoming";
export type BadgeVariant = "soft" | "solid" | "outline";

/** Base colour per tone: [soft background, foreground, solid background, solid foreground]. */
const TONES: Record<BadgeTone, { soft: string; outline: string; solid: string; dot: string }> = {
  neutral: { soft: "bg-surface-sunken text-ink-soft", outline: "border-line-strong text-ink-soft", solid: "bg-ink text-canvas", dot: "bg-faint" },
  primary: { soft: "bg-primary-soft-bg text-primary", outline: "border-primary/40 text-primary", solid: "bg-primary text-primary-contrast", dot: "bg-primary" },
  income: { soft: "bg-income-soft text-income", outline: "border-income/40 text-income", solid: "bg-income text-white", dot: "bg-income" },
  expense: { soft: "bg-expense-soft text-expense", outline: "border-expense/40 text-expense", solid: "bg-expense text-white", dot: "bg-expense" },
  warning: { soft: "bg-warning-soft text-warning", outline: "border-warning/45 text-warning", solid: "bg-warning text-white", dot: "bg-warning" },
  info: { soft: "bg-info-soft text-info", outline: "border-info/40 text-info", solid: "bg-info text-white", dot: "bg-info" },
  paid: { soft: "bg-income-soft text-income", outline: "border-income/40 text-income", solid: "bg-income text-white", dot: "bg-income" },
  next: { soft: "bg-warning-soft text-warning", outline: "border-warning/45 text-warning", solid: "bg-warning text-white", dot: "bg-warning" },
  upcoming: { soft: "bg-surface-sunken text-muted", outline: "border-line-strong text-muted", solid: "bg-muted text-canvas", dot: "bg-faint" },
};

export function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  dot = false,
  pulse = false,
  icon,
  onRemove,
  removeLabel,
  className = "",
  "aria-label": ariaLabel,
}: {
  children?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** Leading status dot. */
  dot?: boolean;
  /** Soft ping on the dot: live, in-progress states only. */
  pulse?: boolean;
  icon?: ReactNode;
  /** Shows an × button (removable chip). */
  onRemove?: () => void;
  /** Accessible name for the × button, e.g. "Remove tag Reimbursable". */
  removeLabel?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const palette = TONES[tone];
  const look = variant === "solid" ? palette.solid : variant === "outline" ? `border bg-transparent ${palette.outline}` : palette.soft;
  const dotColor = variant === "solid" ? "bg-current" : palette.dot;
  // Strings and numbers roll in when they change (counts, status labels).
  const roll = typeof children === "string" || typeof children === "number";

  return (
    <span
      aria-label={ariaLabel}
      className={`relative inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold leading-none ${
        variant === "outline" ? "" : "border border-transparent"
      } ${look} ${onRemove ? "pr-1" : ""} ${className}`}
    >
      {dot && (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && <span className={`absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden ${dotColor}`} />}
          <span className={`relative h-1.5 w-1.5 rounded-full ${dotColor}`} />
        </span>
      )}
      {icon}
      {roll ? (
        <span className="relative inline-flex overflow-hidden py-px">
          <span key={String(children)} className="inline-block animate-badge-roll tabular-nums">
            {children}
          </span>
        </span>
      ) : (
        children
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove")}
          onClick={onRemove}
          className="grid h-4 w-4 place-items-center rounded-full opacity-60 outline-none hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/15 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
