/**
 * Overview — the financial home.
 *
 * Desktop: glass hero, three figures, the current budget beside an insight
 * panel, then recent activity. Mobile: the same story told in one column, with
 * the income / expense / left-over trio compacted below the budget card.
 *
 * Everything here is derived from local data (`useLocalData`) so the screen is
 * identical online and offline. No sample values.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  Mascot,
  MascotPanel,
  PageHeader,
  ProgressBar,
  SectionHeading,
  Skeleton,
  SurfaceCard,
} from "../../components/ui";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { PROFILE_KEY } from "../../db/profile";
import { useAuth } from "../../auth/AuthContext";
import {
  byTxNewest,
  formatMoney,
  formatPercent,
  formatRelativeDay,
  daysBetween,
} from "../../design/format";
import { categoryIcon } from "../../design/icons";
import type { LocalTransaction } from "../../db/types";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import {
  budgetProgress,
  portfolio,
  summarize,
  type BudgetProgress,
  type Lookups,
} from "../analytics/engine";
import { inRange, periodRange, type Period } from "../analytics/period";import { transactionAccounts, transactionTitle } from "../transactions/TransactionList";

function greetingCopy() {
  const hour = typeof window !== "undefined" ? new Date().getHours() : 9;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function longDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function signedPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return `${value >= 0 ? "+" : "−"}${formatPercent(Math.abs(value), 1)}`;
}

/** A single recent row: payee, category · day, account column, amount. */
function OverviewRow({
  transaction,
  lookups,
  currency,
}: {
  transaction: LocalTransaction;
  lookups: Lookups;
  currency: string;
}) {
  const title = transactionTitle(transaction, lookups);
  const categoryObj = transaction.category_id ? lookups.category.get(transaction.category_id) : null;
  const category = categoryObj?.name ?? null;
  const meta = [category ?? (transaction.type === "income" ? "Income" : "Expense"), formatRelativeDay(transaction.date)]
    .filter(Boolean)
    .join(" · ");
  const amount = formatMoney(Math.abs(transaction.amount), transaction.currency);
  const tone =
    transaction.type === "income"
      ? "text-income"
      : transaction.type === "expense"
        ? "text-expense"
        : "text-transfer";
  const sign = transaction.type === "income" ? "+" : transaction.type === "expense" ? "−" : "";
  const Icon = categoryIcon(categoryObj?.icon ?? null, categoryObj?.name);

  return (
    <Link
      to={`/transactions/${transaction.id}`}
      className="trove-row group"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-5 text-ink group-hover:text-primary">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{meta}</span>
      </span>
      <span className="hidden w-[9.5rem] shrink-0 truncate text-[13px] text-muted lg:block">
        {transactionAccounts(transaction, lookups)}
      </span>
      <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
        {sign}
        {amount}
        {transaction.currency !== currency && (
          <span className="mt-0.5 block text-[11px] font-normal text-faint">
            ≈{formatMoney(Math.abs(transaction.amount), currency, { compact: true })}
          </span>
        )}
      </span>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  tone = "text-primary",
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <SurfaceCard className="px-3.5 py-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={`tabular mt-1 truncate text-[17px] font-bold leading-none tracking-[-0.02em] ${tone}`}>
        {value}
      </p>
    </SurfaceCard>
  );
}

function BudgetRow({ item, currency }: { item: BudgetProgress; currency: string }) {
  const urgent = item.percent >= 90;
  const limit = item.spent + item.remaining;
  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
          {item.categoryName ?? "All spending"}
        </span>
        <span className="tabular shrink-0 text-[12px] text-muted">
          {formatMoney(item.spent, currency, { compact: true })}{" "}
          <span className="text-faint">of</span> {formatMoney(limit, currency, { compact: true })}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar
          value={item.percent}
          tone={item.overBudget || urgent ? "expense" : "primary"}
          size="sm"
          className="flex-1"
          label={`${item.categoryName ?? "All spending"} budget usage`}
        />
        <span
          className={`tabular w-[4.75rem] shrink-0 text-right text-[12px] font-semibold ${
            item.overBudget || urgent ? "text-expense" : "text-muted"
          }`}
        >
          {item.overBudget
            ? `${formatMoney(Math.abs(item.remaining), currency, { compact: true })} over`
            : `${formatMoney(item.remaining, currency, { compact: true })} left`}
        </span>
      </div>
    </li>
  );
}

export function OverviewPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const { profile, email } = useAuth();
  const cached = useLiveQuery(() => db.profile.get(PROFILE_KEY), []);
  const navigate = useNavigate();
  const [anchor] = useState(() => new Date());
  const currency = dataset.baseCurrency;

  const period: Period = useMemo(
    () => ({ kind: "month", anchor, monthStartDay: preferences.monthStartDay }),
    [anchor, preferences.monthStartDay],
  );
  const range = periodRange(period);

  const totals = useMemo(() => portfolio(lookups), [lookups]);
  const month = useMemo(
    () => summarize(dataset.transactions, range, lookups.fx),
    [dataset.transactions, range, lookups.fx],
  );

  const budgets = useMemo(
    () => budgetProgress(dataset.budgets, dataset.transactions, lookups, anchor, preferences.monthStartDay),
    [dataset.budgets, dataset.transactions, lookups, anchor, preferences.monthStartDay],
  );

  const recent = useMemo(
    () => dataset.transactions.filter((tx) => inRange(tx.date, range)).sort(byTxNewest).slice(0, 4),
    [dataset.transactions, range],
  );

  const sortedBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.percent - a.percent),
    [budgets],
  );
  const attention = sortedBudgets.find((item) => item.overBudget) ?? sortedBudgets.find((item) => item.percent >= 90) ?? sortedBudgets.find((item) => item.alert) ?? null;

  const overallLimit = budgets.reduce((sum, item) => sum + item.spent + item.remaining, 0);
  const overallSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
  const overallPercent = overallLimit > 0 ? (overallSpent / overallLimit) * 100 : 0;
  const overallLeft = overallLimit - overallSpent;

  const daysLeft = range ? Math.max(0, daysBetween(new Date(), range.end)) : 0;
  const monthName = anchor.toLocaleDateString(undefined, { month: "long" });

  const priorBalance = totals.assets - month.cashFlow;
  const balanceDelta = priorBalance > 0 ? (month.cashFlow / priorBalance) * 100 : null;
  const deltaText = signedPercent(balanceDelta);

  const firstName =
    profile?.first_name?.trim() || cached?.first_name?.trim() || email?.split("@")[0] || "";
  const greeting = greetingCopy();
  const today = longDate();

  if (!ready) {
    return (
      <div className="space-y-5 lg:space-y-[18px]">
        <PageHeader title="Overview" subtitle={today} />
        <Skeleton className="h-[190px] w-full rounded-[28px] lg:h-[330px]" />
        <div className="grid grid-cols-3 gap-3 lg:gap-[17px]">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-[86px] rounded-[22px] lg:h-[96px]" />
          ))}
        </div>
        <div className="grid gap-[17px] lg:grid-cols-3">
          <Skeleton className="h-[280px] rounded-[24px] lg:col-span-2" />
          <Skeleton className="h-[280px] rounded-[24px]" />
        </div>
        <Skeleton className="h-[260px] rounded-[24px]" />
      </div>
    );
  }

  if (dataset.accounts.length === 0) {
    return (
      <div>
        <PageHeader title="Overview" subtitle={today} />
        <GlassPanel className="mt-6 px-6 py-12">
          <EmptyState
            state="accountsEmpty"
            title="Let's get your accounts in"
            description="Add the cash, bank and card accounts you actually use. Budgets, goals and reports build on top of them."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/accounts/new")}>
                Add your first account
              </Button>
            }
            secondaryAction={<LinkButton to="/settings/currency">Set your base currency</LinkButton>}
          />
        </GlassPanel>
      </div>
    );
  }

  const recentList = () => {
    if (recent.length === 0) {
      return (
        <EmptyState
          compact
          state="transactionsEmpty"
          title="No transactions this month"
          description="Record an expense, income or transfer — it works offline too."
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/transactions?add=expense")}
            >
              Add transaction
            </Button>
          }
        />
      );
    }
    return (
      <div className="trove-hairline-list">
        {recent.map((tx) => (
          <OverviewRow key={tx.id} transaction={tx} lookups={lookups} currency={currency} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={today}
        mobileTitle={firstName ? `${greeting}, ${firstName}` : greeting}
        mobileSubtitle={today}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/transactions?add=expense")}
          >
            Add transaction
          </Button>
        }
      />

      {/* ------------------------------------------------------------- mobile */}
      <div className="mx-auto mt-5 max-w-[640px] space-y-4 pb-2 lg:hidden">
        {/* Deep-forest balance hero. */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#1f2f26] px-5 py-5 shadow-card dark:border dark:border-[#2d4136]">
          <div className="relative z-10 max-w-[62%]">
            <p className="text-[12px] text-white/60">Total balance</p>
            <p className="tabular mt-1.5 text-[34px] font-bold leading-none tracking-[-0.035em] text-[#f4eedf]">
              {formatMoney(totals.assets, currency)}
            </p>
            {deltaText && (
              <p className={`mt-2 text-[12px] font-semibold ${balanceDelta !== null && balanceDelta >= 0 ? "text-[#9bb587]" : "text-[#e39a74]"}`}>
                {deltaText} <span className="font-normal text-white/50">vs. last month</span>
              </p>
            )}
          </div>
          <div className="absolute bottom-0 right-3">
            <Mascot state="greeting" size={120} />
          </div>
        </section>

        {/* Insight card — tone and mascot follow budget state. */}
        {budgets.length > 0 &&
          (attention ? (
            <div className="flex items-center gap-3.5 rounded-[24px] border border-warning/40 bg-warning-soft px-4 py-3.5">
              <Mascot state="budgetWarning" size={72} className="-my-2 -ml-1" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-5 text-ink">
                  {attention.categoryName ?? "A budget"} is{" "}
                  {attention.overBudget ? "over budget." : "nearly at its limit."}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-[18px] text-ink-soft">
                  {attention.overBudget
                    ? `${formatMoney(Math.abs(attention.remaining), currency)} over this month.`
                    : `${formatMoney(Math.max(0, attention.remaining), currency)} left this month, just a heads-up.`}{" "}
                  <Link to="/budgets" className="font-semibold text-warning hover:underline">
                    Review
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 rounded-[24px] border border-line/60 bg-surface px-4 py-3.5">
              <Mascot state="budgetOnTrack" size={72} className="-my-2 -ml-1" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-5 text-ink">You're on track this month.</p>
                <p className="mt-0.5 text-[12.5px] leading-[18px] text-ink-soft">
                  Every budget is inside its limit. Keep it up.
                </p>
              </div>
            </div>
          ))}

        {/* Compact income / expenses / left over. */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="Income"
            value={formatMoney(month.income, currency, { compact: true })}
            tone="text-income"
          />
          <MiniStat
            label="Expenses"
            value={formatMoney(month.expense, currency, { compact: true })}
            tone="text-expense"
          />
          <MiniStat
            label="Left over"
            value={formatMoney(month.cashFlow, currency, { compact: true, signed: true })}
            tone={month.cashFlow >= 0 ? "text-income" : "text-expense"}
          />
        </div>

        {/* Recent. */}
        <section>
          <SectionHeading
            title="Recent"
            className="mb-2 px-1"
            action={<LinkButton to="/transactions">See all</LinkButton>}
          />
          <SurfaceCard className="overflow-hidden">{recentList()}</SurfaceCard>
        </section>

        {/* Budget snapshot. */}
        <section>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-[16px] font-semibold text-ink">{monthName} budget</h2>
            <span className="text-[12px] text-muted">
              {budgets.length > 0 ? `${daysLeft} days left` : "Not set up"}
            </span>
          </div>
          <SurfaceCard className="px-5 py-4">
            {budgets.length === 0 ? (
              <EmptyState
                compact
                state="budgetOnTrack"
                title="No budgets yet"
                description="Set a monthly limit per category and Trove will track it for you."
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate("/budgets/new")}>
                    Create budget
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-[32px] font-bold leading-none tracking-[-0.03em] text-primary">
                    {formatMoney(overallSpent, currency)}
                  </span>
                  <span className="text-[12px] text-muted">of {formatMoney(overallLimit, currency)}</span>
                </div>
                <ProgressBar
                  value={overallPercent}
                  tone={overallPercent > 100 || overallPercent >= 90 ? "expense" : "primary"}
                  className="mt-3"
                  label={`${monthName} overall budget usage`}
                />
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className={`text-[12px] font-semibold ${overallLeft < 0 ? "text-expense" : "text-income"}`}>
                    {overallLeft >= 0
                      ? `${formatMoney(overallLeft, currency)} left overall`
                      : `${formatMoney(Math.abs(overallLeft), currency)} over overall`}
                  </span>
                  <Link to="/budgets" className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary">
                    View budget <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
          </SurfaceCard>
        </section>
      </div>

      {/* ------------------------------------------------------------ desktop */}
      <div className="hidden space-y-[18px] lg:block">
        <GlassPanel className="relative min-h-[300px] overflow-hidden p-8 xl:p-10">
          <div className="relative z-10 flex min-h-[220px] max-w-[58%] flex-col justify-center">
            <h2 className="text-[30px] font-semibold leading-[36px] tracking-[-0.03em] text-primary">
              {greeting}!
            </h2>
            <p className="mt-1.5 text-[14px] leading-6 text-muted">
              Here's how your money is doing this month.
            </p>
            <p className="mt-8 text-[12px] font-medium text-muted">Total balance</p>
            <p className="trove-hero-amount mt-1">{formatMoney(totals.assets, currency)}</p>
            {deltaText && (
              <p className={`mt-2.5 text-[12px] font-semibold ${balanceDelta !== null && balanceDelta >= 0 ? "text-income" : "text-expense"}`}>
                {deltaText} <span className="font-normal text-muted">vs. last month</span>
              </p>
            )}
          </div>
          <div className="pointer-events-none absolute bottom-0 right-7 hidden h-[184px] w-[184px] items-end justify-center dark:flex">
            <Mascot state="greeting" size={196} />
          </div>
          <div className="pointer-events-none absolute bottom-0 right-10 dark:hidden">
            <Mascot state="greeting" size={204} />
          </div>
        </GlassPanel>

        <div className="grid grid-cols-3 gap-[17px]">
          {[
            { label: "Income", value: formatMoney(month.income, currency), tone: "text-primary" },
            { label: "Expenses", value: formatMoney(month.expense, currency), tone: "text-primary" },
            {
              label: "Left over",
              value: formatMoney(month.cashFlow, currency, { signed: true }),
              tone: month.cashFlow >= 0 ? "text-income" : "text-expense",
            },
          ].map((item) => (
            <SurfaceCard key={item.label} className="px-6 py-5">
              <p className="text-[13px] text-muted">{item.label}</p>
              <p className={`tabular mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] ${item.tone}`}>
                {item.value}
              </p>
            </SurfaceCard>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-[17px]">
          <SurfaceCard className="col-span-2 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-semibold leading-6 text-ink">{monthName} budget</h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {daysLeft} days left
                </p>
              </div>
            </div>

            {budgets.length === 0 ? (
              <EmptyState
                compact
                state="budgetOnTrack"
                title="No budgets yet"
                description="Set a monthly limit per category and Trove will track it for you."
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate("/budgets/new")}>
                    Create budget
                  </Button>
                }
              />
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="tabular text-[40px] font-bold leading-none tracking-[-0.035em] text-primary">
                    {formatMoney(overallSpent, currency)}
                  </span>
                  <span className="text-[13px] text-muted">of {formatMoney(overallLimit, currency)}</span>
                </div>
                <ProgressBar
                  value={overallPercent}
                  tone={overallPercent > 100 || overallPercent >= 90 ? "expense" : "primary"}
                  className="mt-4"
                  label={`${monthName} overall budget usage`}
                />
                {overallLeft < 0 && (
                  <p className="mt-2 text-[12px] font-semibold text-expense">
                    {formatMoney(Math.abs(overallLeft), currency)} over budget overall
                  </p>
                )}

                <ul className="mt-5 divide-y divide-line/70 border-t border-line/70 pt-3.5">
                  {sortedBudgets.slice(0, 3).map((item) => (
                    <BudgetRow key={item.budget.id} item={item} currency={currency} />
                  ))}
                </ul>

                <p className="mt-4 text-[12.5px] leading-5 text-muted">
                  {attention ? (
                    <>
                      {attention.categoryName ?? "A budget"} is{" "}
                      {attention.overBudget ? "over budget" : "nearly at its limit"}
                      {attention.overBudget
                        ? ` by ${formatMoney(Math.abs(attention.remaining), currency)}.`
                        : `, with ${formatMoney(Math.max(0, attention.remaining), currency)} left.`}
                    </>
                  ) : (
                    <>
                      You have <span className="font-semibold text-income">{formatMoney(Math.max(0, overallLeft), currency)}</span>{" "}
                      left across your budgets this month.
                    </>
                  )}
                  <LinkButton to="/budgets" className="ml-2 align-baseline text-[12px]">
                    View budget <ChevronRight className="inline h-3.5 w-3.5" />
                  </LinkButton>
                </p>
              </>
            )}
          </SurfaceCard>

          <MascotPanel
            state={month.cashFlow >= 0 ? "piggyBank" : "budgetWarning"}
            tone={month.cashFlow >= 0 ? "peach" : "sage"}
            title={
              month.cashFlow >= 0
                ? "More came in than went out this month"
                : "Spending outpaced income this month"
            }
            value={formatMoney(month.cashFlow, currency, { signed: true })}
            description={
              month.cashFlow >= 0
                ? `Left over from ${formatMoney(month.income, currency)} of income.`
                : "A small adjustment now keeps the month on track."
            }
            mascotSize={150}
            className="h-full"
          />
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line/75 px-6 py-5">
            <div>
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Recent transactions</h2>
              <p className="text-[12px] text-muted">
                {month.transactionCount} this month
              </p>
            </div>
            <LinkButton to="/transactions">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </LinkButton>
          </div>
          {recentList()}
        </SurfaceCard>
      </div>
    </div>
  );
}
