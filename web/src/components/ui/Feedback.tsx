import type { ReactNode } from "react";
import { CircleAlert, CircleHelp, CloudSync, Lock, TriangleAlert, WifiOff } from "lucide-react";
import { Button } from "./Button";
import { Mascot } from "./Mascot";
import { GlassPanel } from "./Trove";
import type { MascotState } from "../../lib/mascot";

/* ------------------------------------------------------------------- empty state */

export function EmptyState({
  icon,
  mascot,
  state,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  compact = false,
  glass = false,
}: {
  icon?: ReactNode;
  /** @deprecated use `state` for semantic mascots. */
  mascot?: string;
  state?: MascotState;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  compact?: boolean;
  glass?: boolean;
}) {
  const body = (
    <div
      className={`flex flex-col items-center justify-center text-center animate-rise ${
        compact ? "gap-2 py-8" : glass ? "gap-4 px-6 py-12" : "gap-3 py-14"
      } ${className}`}
    >
      {icon && !mascot && !state && (
        <span
          aria-hidden="true"
          className="flex items-center justify-center rounded-[20px] bg-primary-soft-bg text-primary"
          style={{ width: compact ? 44 : 60, height: compact ? 44 : 60 }}
        >
          {icon}
        </span>
      )}
      {(state || mascot) && (
        <Mascot
          state={state}
          pose={mascot}
          size={compact ? 88 : glass ? 190 : 168}
          className="mb-1"
        />
      )}
      <div className="max-w-sm space-y-1.5">
        <p className={`${compact ? "text-sm" : glass ? "text-[26px] leading-8" : "text-xl leading-7"} font-semibold tracking-[-0.02em] text-primary`}>
          {title}
        </p>
        {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );

  if (glass) {
    return <GlassPanel className={className}>{body}</GlassPanel>;
  }
  return body;
}

/* ------------------------------------------------------------------ error state */

export type ErrorKind = "offline" | "auth" | "server" | "sync" | "conflict" | "validation" | "unknown";

const ERROR_PRESETS: Record<ErrorKind, { icon: ReactNode; state: MascotState; title: string; body: string }> = {
  offline: {
    icon: <WifiOff className="h-6 w-6" />,
    state: "offline",
    title: "You're offline",
    body: "Your changes are saved on this device and will sync automatically when you're back online.",
  },
  auth: {
    icon: <Lock className="h-6 w-6" />,
    state: "signInError",
    title: "Session expired",
    body: "Sign in again to continue syncing your data across devices.",
  },
  server: {
    icon: <CircleAlert className="h-6 w-6" />,
    state: "error",
    title: "Couldn't reach the server",
    body: "Your local data is still available. Try again in a moment.",
  },
  sync: {
    icon: <CloudSync className="h-6 w-6" />,
    state: "conflicts",
    title: "Sync needs attention",
    body: "Some changes couldn't be uploaded. Review the queued items to keep your data safe.",
  },
  conflict: {
    icon: <TriangleAlert className="h-6 w-6" />,
    state: "budgetWarning",
    title: "Conflicting edits",
    body: "This record changed on another device. Choose which version to keep.",
  },
  validation: {
    icon: <CircleAlert className="h-6 w-6" />,
    state: "overviewInsight",
    title: "Check the highlighted fields",
    body: "Some values need fixing before this can be saved.",
  },
  unknown: {
    icon: <CircleHelp className="h-6 w-6" />,
    state: "error",
    title: "Something went wrong",
    body: "We couldn't complete that action. Your data hasn't been changed.",
  },
};

export function ErrorState({
  kind = "unknown",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  className = "",
  compact = false,
}: {
  kind?: ErrorKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const preset = ERROR_PRESETS[kind];
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 text-center animate-rise ${compact ? "py-6" : "py-12"} ${className}`}
    >
      <Mascot state={preset.state} size={compact ? 90 : 150} />
      <div className="max-w-sm space-y-1">
        <p className="text-lg font-semibold text-primary">{title ?? preset.title}</p>
        <p className="text-sm leading-relaxed text-muted">{description ?? preset.body}</p>
      </div>
      {(onRetry || action) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/** Inline alert for forms and page-level notices. */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  className = "",
}: {
  tone?: "info" | "warning" | "expense" | "income";
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const cls = {
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    expense: "bg-expense-soft text-expense",
    income: "bg-income-soft text-income",
  }[tone];
  const defaultIcon = {
    info: <CircleHelp className="h-4 w-4" />,
    warning: <TriangleAlert className="h-4 w-4" />,
    expense: <CircleAlert className="h-4 w-4" />,
    income: <CloudSync className="h-4 w-4" />,
  }[tone];

  return (
    <div className={`flex animate-rise items-start gap-2.5 rounded-[18px] px-4 py-3 ${cls} ${className}`}>
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon ?? defaultIcon}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : "opacity-90"}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------------- skeletons */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, height = 64 }: { rows?: number; height?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-line/70">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-6" style={{ height }}>
          <Skeleton className="h-[38px] w-[38px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="trove-card space-y-3 px-5 py-4">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Screen-reader-only live region text for loading states. */
export function LoadingLabel({ children }: { children: ReactNode }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {children}
    </span>
  );
}
