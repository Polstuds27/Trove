import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Mascot } from "./Mascot";
import type { MascotState } from "../../lib/mascot";

/* ----------------------------------------------------------------- surfaces */

export function GlassPanel({
  children,
  tone = "sage",
  className = "",
  ...rest
}: {
  children: ReactNode;
  tone?: "sage" | "peach";
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${tone === "peach" ? "trove-glass-peach" : "trove-glass"} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`trove-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------- pills */

export function Pill({
  active = false,
  children,
  className = "",
  ...rest
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`trove-pill ${active ? "trove-pill-active" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PillLink({
  to,
  active = false,
  children,
  className = "",
}: {
  to: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`trove-pill ${active ? "trove-pill-active" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- toggle */

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-surface-sunken"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ---------------------------------------------------------------- stat cards */

export function StatCard({
  label,
  value,
  tone = "default",
  caption,
  className = "",
  onClick,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  caption?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const toneClass = {
    default: "text-primary",
    positive: "text-income",
    negative: "text-expense",
    muted: "text-muted",
  }[tone];
  const body = (
    <>
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`tabular mt-1.5 block text-[30px] font-bold leading-none tracking-[-0.03em] ${toneClass}`}>
        {value}
      </span>
      {caption && <span className="mt-1.5 block text-xs text-muted">{caption}</span>}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`trove-card px-5 py-4 text-left transition-transform hover:-translate-y-0.5 ${className}`}
      >
        {body}
      </button>
    );
  }
  return <div className={`trove-card px-5 py-4 ${className}`}>{body}</div>;
}

/* -------------------------------------------------------------- section head */

export function SectionHeading({
  title,
  summary,
  action,
  className = "",
  as: Tag = "h2",
}: {
  title: ReactNode;
  summary?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <Tag className="text-base font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</Tag>
      <div className="flex shrink-0 items-baseline gap-2">
        {summary && <span className="tabular text-[13px] text-muted">{summary}</span>}
        {action}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- rows */

const AVATAR_TINTS = [
  "bg-sage-light text-primary",
  "bg-peach text-[#8b5a3c]",
  "bg-[#f2ddd0] text-[#8b5a3c]",
  "bg-[#e7e1d5] text-[#5a5f54]",
  "bg-[#dfe8d9] text-[#3f6249]",
  "bg-[#eadfd3] text-[#7c5a43]",
] as const;

export function tintForName(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
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
  /** Force a tint class. */
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

export function ListRow({
  avatar,
  title,
  subtitle,
  right,
  rightSub,
  to,
  onClick,
  className = "",
  trailing,
}: {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  rightSub?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-5 text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{subtitle}</span>}
      </span>
      {(right || rightSub) && (
        <span className="shrink-0 text-right">
          {right && <span className="tabular block text-[14px] font-semibold text-ink">{right}</span>}
          {rightSub && <span className="tabular mt-0.5 block text-[11px] text-muted">{rightSub}</span>}
        </span>
      )}
      {trailing}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`trove-row ${className}`}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`trove-row w-full text-left ${className}`}>
        {content}
      </button>
    );
  }
  return <div className={`trove-row ${className}`}>{content}</div>;
}

/* ------------------------------------------------------------- mascot panel */

export function MascotPanel({
  state,
  title,
  value,
  description,
  tone = "sage",
  mascotSize = 132,
  className = "",
  action,
}: {
  state: MascotState;
  title: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  tone?: "sage" | "peach";
  mascotSize?: number;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <GlassPanel tone={tone} className={`relative overflow-hidden ${className}`}>
      <div className="relative z-10 flex min-h-[150px] flex-col justify-center p-6 pr-[38%]">
        <p className="text-sm font-semibold leading-5 text-primary">{title}</p>
        {value && <p className="tabular mt-2 text-[26px] font-bold leading-none tracking-[-0.03em] text-primary">{value}</p>}
        {description && <p className="mt-2 text-[13px] leading-5 text-muted">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      <Mascot
        state={state}
        size={mascotSize}
        className="pointer-events-none absolute -bottom-2 right-3 z-10"
      />
    </GlassPanel>
  );
}

/* --------------------------------------------------------- small primitives */

export function StatusBadge({ status }: { status: "paid" | "next" | "upcoming" }) {
  const map = {
    paid: { label: "Paid", cls: "badge-paid" },
    next: { label: "Next", cls: "badge-next" },
    upcoming: { label: "Upcoming", cls: "badge-upcoming" },
  }[status];
  return <span className={map.cls}>{map.label}</span>;
}

export function DetailLine({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-3 last:border-b-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function MascotSpot({
  state,
  size = 150,
  className = "",
}: {
  state: MascotState;
  size?: number;
  className?: string;
}) {
  return <Mascot state={state} size={size} className={`pointer-events-none mx-auto ${className}`} />;
}
