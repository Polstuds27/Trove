import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Avatar } from "./Primitives";
import { IconButton } from "./Button";

/**
 * Page header: desktop shows title + subtitle on the left and the page's one
 * primary action on the right. Mobile flips the hierarchy (small subtitle above
 * a 28–30 px title) and puts the user's avatar at the top-right, per spec §7.1.
 */
export function PageHeader({
  title,
  subtitle,
  mobileTitle,
  mobileSubtitle,
  period,
  actions,
  leading,
  tabs,
  showActionsOnMobile = false,
  hideMobileAvatar = false,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  mobileTitle?: ReactNode;
  mobileSubtitle?: ReactNode;
  period?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
  tabs?: ReactNode;
  showActionsOnMobile?: boolean;
  hideMobileAvatar?: boolean;
  className?: string;
}) {
  const { email } = useAuth();
  const name = email ?? "You";

  return (
    <header className={`flex flex-col gap-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {leading}
          <div className="min-w-0">
            <div className="lg:hidden">
              {(mobileSubtitle ?? subtitle) && (
                <p className="mb-1 truncate text-[13px] font-medium text-muted">{mobileSubtitle ?? subtitle}</p>
              )}
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h1 className="trove-mobile-title truncate">{mobileTitle ?? title}</h1>
                {period}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h1 className="trove-page-title truncate">{title}</h1>
                {period}
              </div>
              {subtitle && <p className="mt-1.5 text-[13px] leading-5 text-muted">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions && (
            <div className={`${showActionsOnMobile ? "flex" : "hidden lg:flex"} flex-wrap items-center gap-2`}>
              {actions}
            </div>
          )}
          {!hideMobileAvatar && (
            <Link
              to="/settings"
              aria-label="Open settings"
              className="lg:hidden"
            >
              <Avatar name={name} size={42} className="bg-sage text-white shadow-card dark:bg-cream dark:text-ink" />
            </Link>
          )}
        </div>
      </div>
      {tabs && <div>{tabs}</div>}
    </header>
  );
}

/** Back button used by detail screens (mobile-first). */
export function BackLink({
  onBack,
  children = "Back",
  className = "",
}: {
  onBack: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink ${className}`}
    >
      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      {children}
    </button>
  );
}

/** Compact ‹ month › stepper for period pickers. */
export function PeriodStepper({
  label,
  onPrevious,
  onNext,
  onToday,
  nextDisabled,
  children,
}: {
  label: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  onToday?: () => void;
  nextDisabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous period" onClick={onPrevious} size="sm">
        <ChevronLeft className="h-4 w-4" />
      </IconButton>
      <div className="min-w-[7.5rem] text-center text-sm font-medium text-ink">{label}</div>
      <IconButton label="Next period" onClick={onNext} size="sm" disabled={nextDisabled}>
        <ChevronRight className="h-4 w-4" />
      </IconButton>
      {onToday && (
        <button
          type="button"
          onClick={onToday}
          className="ml-1 rounded-full px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft-bg"
        >
          Today
        </button>
      )}
      {children}
    </div>
  );
}

/** Label/value pair used in detail panels. */
export function DetailRow({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-b border-line/70 py-2.5 last:border-b-0 ${className}`}>
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-ink">{children}</dd>
    </div>
  );
}
