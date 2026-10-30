/**
 * Marketing landing page — the signed-out front door.
 *
 * Cream canvas, one tall scroll: nav, hero with the phone-holding mascot, the
 * six things Trove does, the three steps, and the PWA install block. All copy
 * describes the real app; the install section is the same live component the
 * app uses, not a mock.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Sprout } from "lucide-react";
import { Mascot } from "../../components/ui";
import type { MascotState } from "../../lib/mascot";
import { InstallSection } from "./InstallSection";

interface Feature {
  title: string;
  body: string;
  state: MascotState;
}

const FEATURES: Feature[] = [
  {
    title: "Every account in one place",
    body: "Cash, bank, e-wallet, savings, cards, loans and investments — grouped the way you think about money, with balances derived from the ledger.",
    state: "creditDue",
  },
  {
    title: "Offline-first",
    body: "Record a transaction with no connection at all. Everything is saved on your device and syncs automatically when you're back online.",
    state: "offline",
  },
  {
    title: "Sync that heals itself",
    body: "Idempotency keys, versioning and conflict detection — changes queue up and reconcile deterministically across every device you own.",
    state: "calendar",
  },
  {
    title: "Budgets that warn early",
    body: "Per-category envelopes with alert thresholds and rollover-aware progress, computed locally so the warning arrives before the overspend.",
    state: "budgetOnTrack",
  },
  {
    title: "Goals, debts & recurring",
    body: "Savings goals with projections, debt payoff schedules, standing orders and installments — planned, tracked and reminded.",
    state: "savings",
  },
  {
    title: "Reports without the wait",
    body: "Cash flow, net worth, category trends and calendars are computed from your own data on-device, so they work offline too.",
    state: "statistics",
  },
];

const STEPS: { step: string; title: string; body: string; state: MascotState }[] = [
  {
    step: "01",
    title: "Set up your accounts",
    body: "Add the accounts you actually use — opening balances, credit limits and currencies, once.",
    state: "landingInstall",
  },
  {
    step: "02",
    title: "Log it as it happens",
    body: "A tap to add income, expense or a transfer. Online or not, on any device.",
    state: "landingHero",
  },
  {
    step: "03",
    title: "See where it goes",
    body: "Budgets, trends and forecasts update the moment you record something.",
    state: "createAccount",
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/landing" className="flex items-center gap-3" aria-label="Trove home">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-[10px] bg-surface-raised text-primary shadow-sm ${
          compact ? "h-[34px] w-[34px]" : "h-[38px] w-[38px]"
        }`}
      >
        <Sprout className={compact ? "h-[19px] w-[19px]" : "h-5 w-5"} />
      </span>
      <span className={`font-semibold leading-none tracking-[-0.03em] text-primary ${compact ? "text-[22px]" : "text-[24px]"}`}>
        Trove
      </span>
    </Link>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
      {children}
    </p>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-raised"
      >
        Skip to content
      </a>

      {/* ---------------------------------------------------------- header */}
      <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-6">
          <BrandMark compact />

          <nav aria-label="Sections" className="hidden items-center gap-8 md:flex">
            {[
              ["Features", "#features"],
              ["How it works", "#how"],
              ["Get the app", "#install"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13.5px] font-medium text-muted transition-colors hover:text-primary"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-[12px] px-3 py-2 text-[13.5px] font-semibold text-ink-soft transition-colors hover:text-primary sm:inline-flex"
            >
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary rounded-[16px] px-4 py-2.5">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* -------------------------------------------------------- hero */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-12 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sage-light px-3.5 py-1.5 text-[11.5px] font-semibold text-primary dark:bg-primary-soft">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-sage" />
              Offline-first personal finance
            </span>

            <h1 className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-primary sm:text-[58px] lg:text-[72px]">
              Your money, clearly.
            </h1>

            <p className="mt-5 max-w-[34rem] text-[15.5px] leading-[1.65] text-muted sm:text-[17px]">
              Trove brings every account, transaction, budget and goal into one calm ledger — and
              keeps working when your connection doesn't. Install it on your phone like any other
              app, straight from this page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/register"
                className="btn btn-primary inline-flex w-full justify-center rounded-[16px] px-5 text-[14px] sm:w-auto"
              >
                Start tracking free
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="btn inline-flex w-full justify-center rounded-[16px] border border-line bg-surface-raised px-5 text-[14px] font-semibold text-ink hover:bg-surface sm:w-auto"
              >
                Sign in
              </Link>
              <a
                href="#install"
                className="self-center text-center text-[13px] font-semibold text-primary transition-colors hover:text-primary-hover sm:ml-1"
              >
                Or install the app ↓
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[430px] items-center justify-center">
            <div className="flex h-[280px] w-[280px] items-center justify-center sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]">
              <Mascot state="landingHero" size={390} className="max-h-[92%] max-w-[92%] sm:max-h-none sm:max-w-none" />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- features */}
        <section id="features" className="scroll-mt-24">
          <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-6 lg:py-20">
            <div className="max-w-[46rem]">
              <Eyebrow>What you get</Eyebrow>
              <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-primary sm:text-[38px] lg:text-[44px]">
                Everything a money manager should do — offline included
              </h2>
              <p className="mt-4 max-w-[38rem] text-[14.5px] leading-6 text-muted">
                Accounts, budgets, bills, goals and reports. Not a demo: the reporting engine runs on
                your device, so the numbers are there even when the network isn't.
              </p>
            </div>

            <div className="mt-9 grid gap-[17px] sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ title, body, state }) => (
                <article
                  key={title}
                  className="relative overflow-hidden rounded-[28px] border border-line/50 bg-surface p-6 pb-7 shadow-card"
                >
                  <div className="relative z-10 max-w-[26rem] pr-[64px]">
                    <h3 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">
                      {title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.6] text-muted">{body}</p>
                  </div>
                  <Mascot
                    state={state}
                    size={76}
                    className="pointer-events-none absolute -bottom-1 right-1 opacity-95"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- how it works */}
        <section id="how" className="scroll-mt-24">
          <div className="mx-auto max-w-[1200px] px-5 pb-14 sm:px-6 lg:pb-20">
            <div className="max-w-[40rem]">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-primary sm:text-[38px] lg:text-[44px]">
                Three steps, then it runs itself
              </h2>
            </div>

            <ol className="mt-9 grid gap-[17px] md:grid-cols-3">
              {STEPS.map(({ step, title, body, state }) => (
                <li
                  key={step}
                  className="relative overflow-hidden rounded-[28px] border border-line/50 bg-surface p-6 pb-7 shadow-card"
                >
                  <div className="relative z-10 pr-[58px]">
                    <span
                      aria-hidden="true"
                      className="block text-[40px] font-semibold leading-none tracking-[-0.04em] text-sage"
                    >
                      {step}
                    </span>
                    <h3 className="mt-4 text-[15.5px] font-semibold leading-6 text-ink">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-muted">{body}</p>
                  </div>
                  <Mascot
                    state={state}
                    size={72}
                    className="pointer-events-none absolute -bottom-1 right-1 opacity-95"
                  />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------- install */}
        <InstallSection />
      </main>

      {/* ---------------------------------------------------------- footer */}
      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <p className="text-[12px] leading-5 text-muted">
              Personal money manager · offline-first PWA
              <span className="block">
                Developed by{" "}
                <a href="https://github.com/Polstuds27" className="font-medium text-ink-soft hover:text-primary">
                  Polstuds27
                </a>
              </span>
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <a href="#features" className="text-muted hover:text-primary">
              Features
            </a>
            <a href="#install" className="text-muted hover:text-primary">
              Get the app
            </a>
            <Link to="/login" className="text-muted hover:text-primary">
              Sign in
            </Link>
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Get started
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
