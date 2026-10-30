import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { tintForName } from "./Trove";

/* ----------------------------------------------------------------------- surfaces */

export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

/**
 * Card header following the spec: title left, muted summary right, hairline
 * under the row. Feature pages can also render it outside the card on mobile.
 */
export function CardHeader({
  title,
  subtitle,
  action,
  summary,
  icon,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  summary?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-line/75 px-6 py-5 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="text-primary">{icon}</span>}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h3>
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {summary && <span className="tabular hidden text-[12px] text-muted sm:block">{summary}</span>}
        {action}
      </div>
    </div>
  );
}

/** Small labelled figure. `tone` colours the value, `emphasis` promotes it. */
export function Stat({
  label,
  value,
  caption,
  tone = "default",
  emphasis = "normal",
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  tone?: "default" | "income" | "expense" | "transfer" | "primary" | "muted";
  emphasis?: "normal" | "large" | "hero";
  icon?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    default: "text-primary",
    income: "text-income",
    expense: "text-expense",
    transfer: "text-transfer",
    primary: "text-primary",
    muted: "text-muted",
  }[tone];

  const valueSize =
    emphasis === "hero" ? "text-[42px] leading-none" : emphasis === "large" ? "text-[28px] leading-none" : "text-[20px] leading-tight";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`tabular font-bold tracking-[-0.03em] ${valueSize} ${toneClass}`}>{value}</span>
      {caption && <span className="text-xs text-muted">{caption}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------------ badges */

export type BadgeTone =
  | "neutral"
  | "primary"
  | "income"
  | "expense"
  | "warning"
  | "info"
  | "paid"
  | "next"
  | "upcoming";

export function Badge({
  children,
  tone = "neutral",
  className = "",
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  const cls = {
    neutral: "badge-neutral",
    primary: "badge-primary",
    income: "badge-synced",
    expense: "badge-expense",
    warning: "badge-next",
    info: "badge-primary",
    paid: "badge-paid",
    next: "badge-next",
    upcoming: "badge-upcoming",
  }[tone];
  return (
    <span className={`${cls} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------- progress */

export function ProgressBar({
  value,
  tone = "primary",
  size = "md",
  label,
  showOverflow = true,
  className = "",
}: {
  value: number;
  tone?: "primary" | "income" | "expense" | "warning" | "info";
  size?: "xs" | "sm" | "md";
  label?: string;
  showOverflow?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const over = value > 100;
  const height = { xs: "h-1.5", sm: "h-2", md: "h-2" }[size];
  const fill = over && showOverflow
    ? "bg-expense"
    : {
        primary: "bg-progress",
        income: "bg-income",
        expense: "bg-expense",
        warning: "bg-warning",
        info: "bg-transfer",
      }[tone];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-surface-sunken ${height} ${className}`}
    >
      <div
        className={`h-full origin-left rounded-full transition-[width] duration-reveal ease-smooth animate-progress-in ${fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------- misc */

export function Divider({ className = "", label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  return <hr className={`border-t border-line/75 ${className}`} />;
}

export function Avatar({
  name,
  size = 38,
  className = "",
  tone,
}: {
  name: string;
  size?: number;
  className?: string;
  tone?: string;
}) {
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.37) }}
      className={`trove-avatar ${tone ?? tintForName(name)} ${className}`}
    >
      {initials || "?"}
    </span>
  );
}

/** Signed amount with a semantic arrow. Used in every transaction surface. */
export function AmountDelta({
  amount,
  type,
  className = "",
  size = "md",
}: {
  amount: ReactNode;
  type: "income" | "expense" | "transfer";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = type === "income" ? ArrowUpRight : type === "expense" ? ArrowDownRight : ArrowLeftRight;
  const tone = type === "income" ? "text-income" : type === "expense" ? "text-ink" : "text-muted";
  const iconSize = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-title" }[size];
  return (
    <span className={`tabular inline-flex items-center gap-0.5 font-semibold ${tone} ${textSize} ${className}`}>
      <Icon aria-hidden="true" className={iconSize} />
      {amount}
    </span>
  );
}

export function LinkButton({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}
