import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sprout } from "lucide-react";
import { Mascot } from "../../components/ui";
import type { MascotState } from "../../lib/mascot";

/**
 * Auth layout.
 *
 * Desktop is the spec's 50/50 split: a sage gradient panel carrying the brand,
 * the mascot and the promise, with a calm cream form column on the right.
 * Mobile drops the panel and puts the same mascot above the form.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  mascot = "signIn",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  mascot?: MascotState;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ------------------------------------------------------ brand panel */}
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#C0CAB0_0%,#B2BFA3_52%,#9FAE92_100%)] px-10 py-9 dark:bg-[linear-gradient(180deg,#1F2F26_0%,#18251E_55%,#101812_100%)] lg:flex lg:flex-col xl:px-14 xl:py-11">
        <Link to="/" className="relative z-10 flex items-center gap-3" aria-label="Trove home">
          <span
            aria-hidden="true"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F7F0E5] text-primary shadow-sm dark:bg-cream dark:text-primary-contrast"
          >
            <Sprout className="h-[19px] w-[19px]" />
          </span>
          <span className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-primary">
            Trove
          </span>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center py-10">
          <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center xl:h-[380px] xl:w-[380px]">
            <span
              aria-hidden="true"
              className="absolute inset-x-10 -bottom-7 h-10 rounded-[50%] bg-[#8A9A7E]/40 blur-2xl dark:bg-black/40"
            />
            <Mascot
              state={mascot}
              size={392}
              className="absolute bottom-0 left-1/2 -ml-[196px] max-w-none"
            />
          </div>

          <div className="mx-auto mt-10 w-full max-w-[27rem]">
            <h2 className="text-[40px] font-semibold leading-[1.06] tracking-[-0.04em] text-primary">
              Your money, clearly.
            </h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-primary/75 dark:text-cream/70">
              Accounts, transactions, budgets, goals and reports in one place. Works offline, syncs
              to every device, and keeps your ledger — not your bank login — as the source of truth.
            </p>
            <div className="mt-7 border-t border-primary/15 pt-6">
              <dl className="grid grid-cols-3 gap-4">
                {[
                  ["Offline-first", "Record anywhere"],
                  ["Multi-currency", "Track it all"],
                  ["Private", "Your data, yours"],
                ].map(([term, detail]) => (
                  <div key={term}>
                    <dt className="text-[12px] font-semibold text-primary">{term}</dt>
                    <dd className="mt-0.5 text-[11.5px] leading-4 text-primary/65 dark:text-cream/60">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </aside>

      {/* ----------------------------------------------------------- form */}
      <main className="flex min-h-dvh flex-col bg-canvas px-6 py-8 sm:px-10 lg:justify-center lg:py-12">
        <div className="mx-auto w-full max-w-[384px]">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 lg:invisible" aria-label="Trove home">
              <span
                aria-hidden="true"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-raised text-primary shadow-sm"
              >
                <Sprout className="h-[19px] w-[19px]" />
              </span>
              <span className="text-[22px] font-semibold leading-none tracking-[-0.03em] text-primary">
                Trove
              </span>
            </Link>
            <Link
              to="/register"
              className="text-[12px] font-semibold text-primary hover:underline lg:hidden"
            >
              Create account
            </Link>
          </div>

          <div className="mt-6 flex justify-center lg:hidden">
            <div className="relative flex h-[168px] w-[168px] items-center justify-center">
              <Mascot state={mascot} size={196} className="absolute bottom-0 left-1/2 -ml-[98px] max-w-none" />
            </div>
          </div>

          <div className="mt-7 lg:mt-0">
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-primary lg:text-[36px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[13.5px] leading-[1.6] text-muted lg:text-[14px]">{subtitle}</p>
            )}
          </div>

          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/** The spec's sign-in error: peach banner, small sad mascot, two calm lines. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex animate-rise items-start gap-3 rounded-[16px] border border-expense/25 bg-expense-soft px-3.5 py-3"
    >
      <Mascot state="signInError" size={54} className="-my-1 -ml-1" />
      <div className="min-w-0 pt-0.5">
        <p className="text-[13px] font-semibold leading-[18px] text-expense">{message}</p>
        <p className="mt-0.5 text-[12px] leading-[18px] text-expense/75">
          No worries, give it another try.
        </p>
      </div>
    </div>
  );
}

/** Route guard used by the router for authenticated areas. */
export function useIsAuthRoute(): boolean {
  const { pathname } = useLocation();
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}
