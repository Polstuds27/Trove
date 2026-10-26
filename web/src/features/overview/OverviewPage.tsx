/**
 * Overview — dashboard.
 *
 * Answers, in order: how much money do I have, where did it go this month, what
 * happened recently, am I inside budget, what's coming. Progressive disclosure —
 * the summary is always visible, the detail is one tap away, and there are no
 * decorative dashboards.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Landmark,
  Plus,
  Target,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Button,
  Card,
  CardHeader,
  ChartFrame,
  ChartLegend,
  Divider,
  EmptyState,
  LinkButton,
  Mascot,
  PageHeader,
  ProgressBar,
  Stat,
} from "../../components/ui";
import { MASCOT_BY_STATE } from "../../components/ui/mascots";
import { byTxNewest, formatMoney, formatMonth, formatPercent } from "../../design/format";
import { ACCOUNT_TYPE_LABELS, accountIcon, categoryIcon } from "../../design/icons";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import {
  budgetProgress,
  categoryBreakdown,
  goalProgress,
  portfolio,
  series,
  summarize,
  upcoming,
} from "../analytics/engine";
import { inRange, periodRange, rangeLabel, shiftPeriod, type Period } from "../analytics/period";
import { TransactionRow } from "../transactions/TransactionList";

/** Time-of-day greeting copy. */
function greetingCopy() {
  const hour = typeof window !== "undefined" ? new Date().getHours() : 9;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function OverviewPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());
  const currency = dataset.baseCurrency;

  const period: Period = useMemo(
    () => ({ kind: "month", anchor, monthStartDay: preferences.monthStartDay }),
    [anchor, preferences.monthStartDay],
  );
  const range = periodRange(period);
  const previousPeriod = useMemo(() => shiftPeriod(period, -1), [period]);
  const previousRange = periodRange(previousPeriod);

  const totals = useMemo(() => portfolio(lookups), [lookups]);
  const month = useMemo(() => summarize(dataset.transactions, range, lookups.fx), [
    dataset.transactions,
    range,
    lookups.fx,
  ]);
  const previous = useMemo(
    () => summarize(dataset.transactions, previousRange, lookups.fx),
    [dataset.transactions, previousRange, lookups.fx],
  );
  const trend = useMemo(
    () =>
      series(
        dataset.transactions,
        { kind: "ytd", anchor, monthStartDay: preferences.monthStartDay },
        lookups,
        12,
      ),
    [dataset.transactions, anchor, preferences.monthStartDay, lookups],
  );
  const trendHasData = trend.some((point) => point.income > 0 || point.expense > 0);
  const budgets = useMemo(
    () => budgetProgress(dataset.budgets, dataset.transactions, lookups, anchor, preferences.monthStartDay),
    [dataset.budgets, dataset.transactions, lookups, anchor, preferences.monthStartDay],
  );
  const bills = useMemo(() => upcoming(lookups, 30), [lookups]);
  const goals = useMemo(
    () => goalProgress(dataset.goals, dataset.transactions, lookups),
    [dataset.goals, dataset.transactions, lookups],
  );
  const breakdown = useMemo(
    () => categoryBreakdown(dataset.transactions, range, lookups, "expense", 5),
    [dataset.transactions, range, lookups],
  );

  const recent = useMemo(
    () => dataset.transactions.filter((tx) => inRange(tx.date, range)).sort(byTxNewest).slice(0, 6),
    [dataset.transactions, range],
  );

  const accounts = useMemo(
    () => dataset.accounts.filter((a) => !a.archived),
    [dataset.accounts],
  );
  const creditCards = useMemo(
    () => accounts.filter((a) => a.type === "credit" || a.type === "debit"),
    [accounts],
  );
  const cashAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "credit" && a.type !== "loan"),
    [accounts],
  );

  const expenseDelta = previous.expense > 0 ? ((month.expense - previous.expense) / previous.expense) * 100 : null;
  const incomeDelta = previous.income > 0 ? ((month.income - previous.income) / previous.income) * 100 : null;

  if (ready && accounts.length === 0) {
    return (
      <>
        <PageHeader title="Overview" subtitle="Your financial home" className="mb-2" />
        <EmptyState
          mascot={MASCOT_BY_STATE.emptyAccounts}
          title="Let's get your accounts in"
          description="Start by adding the cash, bank and card accounts you actually use. Everything else — budgets, goals, reports — builds on top of them."
          action={
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/accounts/new")}>
              Add your first account
            </Button>
          }
          secondaryAction={<LinkButton to="/settings">Set your base currency</LinkButton>}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting — calm, with the mascot, not a wall of widgets. */}
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">{greetingCopy()}</p>
          <h1 className="text-display font-semibold tracking-tight text-ink">
            Your finances, at a glance
          </h1>
        </div>
        <div className="flex shrink-0 items-end gap-4">
          <Mascot pose={MASCOT_BY_STATE.greeting} size={96} className="hidden sm:block" />
          <div className="flex items-end gap-2">
            <Stat
              label="Total balance"
              value={
                <span className="tabular text-display-lg leading-none font-semibold text-ink">
                  {formatMoney(totals.assets, currency)}
                </span>
              }
              caption={
                <span className="tabular mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>
                    Net worth <span className="font-semibold text-ink-soft">{formatMoney(totals.netWorth, currency)}</span>
                  </span>
                  {totals.liabilities !== 0 && <span>{formatMoney(totals.liabilities, currency)} owed</span>}
                  {totals.creditAvailable !== null && (
                    <span>{formatMoney(totals.creditAvailable, currency)} credit available</span>
                  )}
                </span>
              }
            />
          </div>
        </div>
      </section>

      {/* Income / expenses / cash flow summary cards. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Income</p>
              <p className="tabular text-title font-semibold text-ink">
                {formatMoney(month.income, currency)}
              </p>
            </div>
            <span className="rounded-lg bg-income-soft p-1.5 text-income">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          {incomeDelta !== null && (
            <p className="mt-1 text-xs {incomeDelta >= 0 ? "text-income" : "text-expense"}">
              {incomeDelta >= 0 ? "↑" : "↓"} {formatPercent(Math.abs(incomeDelta))} vs last month
            </p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Expenses</p>
              <p className="tabular text-title font-semibold text-ink">
                {formatMoney(month.expense, currency)}
              </p>
            </div>
            <span className="rounded-lg bg-expense-soft p-1.5 text-expense">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          {expenseDelta !== null && (
            <p className="mt-1 text-xs {expenseDelta >= 0 ? "text-expense" : "text-income"}">
              {expenseDelta >= 0 ? "↑" : "↓"} {formatPercent(Math.abs(expenseDelta))} vs last month
            </p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Cash flow</p>
              <p className="tabular text-title font-semibold text-ink">
                {formatMoney(month.cashFlow, currency, { signed: true })}
              </p>
            </div>
            <span className={`rounded-lg p-1.5 ${month.cashFlow >= 0 ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
              <ArrowLeftRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{month.transactionCount} transactions</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main column: cash-flow chart + recent transactions (col-span-3). */}
        <div className="space-y-6 lg:col-span-3">
          {/* Cash-flow chart. */}
          {trend.length > 1 && trendHasData ? (
            <ChartFrame
              title="Cash flow"
              subtitle={`Income and spending · ${formatMonth(anchor)} year to date`}
              legend={
                <ChartLegend
                  items={[
                    { label: "Earned", color: "rgb(var(--color-income))" },
                    { label: "Spent", color: "rgb(var(--color-primary))" },
                  ]}
                />
              }
              action={<LinkButton to="/statistics">Full report</LinkButton>}
            >
              <BarChart
                data={trend.map((point) => ({ label: point.label, value: point.expense, secondary: point.income }))}
                format={(value) => formatMoney(value, currency, { compact: true })}
                ariaLabel={`Monthly income and spending through ${formatMonth(anchor)}`}
                height={200}
              />
            </ChartFrame>
          ) : (
            <ChartFrame title="Cash flow" empty="Not enough history to chart yet" />
          )}

          {/* Recent transactions list. */}
          <Card>
            <CardHeader
              title="Recent transactions"
              subtitle={recent.length > 0 ? rangeLabel(range, "month") : undefined}
              icon={<ArrowLeftRight className="h-4 w-4" />}
              action={
                <LinkButton to="/transactions">
                  View all <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </LinkButton>
              }
            />
            {recent.length === 0 ? (
              <EmptyState
                compact
                mascot={MASCOT_BY_STATE.emptyTransactions}
                title="No transactions yet"
                description="Record your first expense, income or transfer — it works offline too."
                action={
                  <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/transactions?add=expense")}>
                    Add transaction
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {recent.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} lookups={lookups} showCategory />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar column: budget cards, upcoming, top spending, goals. */}
        <div className="space-y-6 lg:col-span-1">
          {/* Budget cards. */}
          <Card>
            <CardHeader
              title="Budget"
              subtitle={budgets.length > 0 ? `${budgets.filter((b) => b.overBudget).length} over` : "Not set up"}
              icon={<ArrowDownRight className="h-4 w-4" />}
              action={
                <LinkButton to="/budgets">
                  Open <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </LinkButton>
              }
            />
            {budgets.length === 0 ? (
              <EmptyState
                compact
                mascot={MASCOT_BY_STATE.emptyBudgets}
                title="No budgets yet"
                description="Set a monthly limit per category and Trove will track it for you."
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate("/budgets?new=1")}>
                    Create budget
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {budgets.slice(0, 5).map((item) => (
                  <li key={item.budget.id} className="px-4 py-3">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-ink">
                        {item.categoryName ?? "All spending"}
                      </span>
                      <span className="tabular shrink-0 text-xs text-muted">
                        {formatMoney(item.spent, currency, { compact: true })} /{" "}
                        {formatMoney(item.budget.amount, currency, { compact: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={item.percent}
                        size="sm"
                        tone={item.overBudget ? "expense" : item.alert ? "warning" : "primary"}
                        className="flex-1"
                        label={`${item.categoryName ?? "All spending"} budget usage`}
                      />
                      <span className={`tabular w-9 shrink-0 text-right text-xs font-semibold ${item.overBudget ? "text-expense" : item.alert ? "text-warning" : "text-ink-soft"}`}>
                        {formatPercent(item.percent)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Upcoming. */}
          <Card>
            <CardHeader
              title="Upcoming"
              subtitle="Next 30 days"
              icon={<CalendarDays className="h-4 w-4" />}
              action={
                <LinkButton to="/calendar">
                  Calendar <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </LinkButton>
              }
            />
            {bills.length === 0 ? (
              <EmptyState
                compact
                icon={<CalendarDays className="h-6 w-6" />}
                title="Nothing scheduled"
                description="Recurring payments, installments and goal deadlines will show up here."
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate("/recurring?new=1")}>
                    Add recurring
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {bills.slice(0, 5).map((item) => (
                  <li key={item.key} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.tone === "income" ? "bg-income-soft text-income" : item.tone === "expense" ? "bg-expense-soft text-expense" : "bg-surface-sunken text-ink-soft"
                      }`}
                    >
                      {item.kind === "goal" ? <Target className="h-4 w-4" /> : item.kind === "debt" ? <Landmark className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {item.inDays === 0 ? "Today" : item.inDays === 1 ? "Tomorrow" : `In ${item.inDays} days`}
                      </span>
                    </span>
                    <span className={`tabular shrink-0 text-sm font-semibold ${item.tone === "income" ? "text-income" : item.tone === "expense" ? "text-expense" : "text-transfer"}`}>
                      {formatMoney(item.amount, currency, { compact: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Top spending. */}
          {breakdown.length > 0 && (
            <Card>
              <CardHeader
                title="Top spending"
                subtitle={formatMonth(anchor)}
                icon={<ArrowDownRight className="h-4 w-4" />}
                action={
                  <LinkButton to="/statistics">
                    Analyse <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </LinkButton>
                }
              />
              <ul className="divide-y divide-line">
                {breakdown.map((slice) => {
                  const Icon = categoryIcon(slice.icon, slice.name);
                  return (
                    <li key={slice.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-soft">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{slice.name}</span>
                        <span className="tabular block text-xs text-muted">{formatPercent(slice.share)} of spend</span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold text-expense">
                        −{formatMoney(slice.value, currency, { compact: true })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Financial insights + contextual mascot panel. */}
          {goals.length > 0 && (
            <Card>
              <CardHeader
                title="Savings goals"
                icon={<Target className="h-4 w-4" />}
                action={
                  <LinkButton to="/goals">
                    Open <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </LinkButton>
                }
              />
              <ul className="divide-y divide-line">
                {goals.slice(0, 3).map((item) => (
                  <li key={item.goal.id} className="px-4 py-3">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{item.goal.name}</span>
                      <span className="tabular shrink-0 text-xs text-muted">
                        {formatMoney(item.saved, currency, { compact: true })} /{" "}
                        {formatMoney(item.target, currency, { compact: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={item.percent}
                        size="sm"
                        tone={item.percent >= 100 ? "income" : "primary"}
                        className="flex-1"
                        label={`${item.goal.name} progress`}
                      />
                      <span className="tabular w-9 shrink-0 text-right text-xs font-semibold text-ink-soft">
                        {formatPercent(item.percent)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {/* Contextual mascot panel when a goal is reached. */}
              {goals.some((item) => item.percent >= 100) && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary-soft-bg p-4">
                  <Mascot pose={MASCOT_BY_STATE.goalReached} size={48} label="Goal reached" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">Goal reached!</p>
                    <p className="mt-0.5 text-xs text-muted">
                      You've hit a savings target. Celebrate the win.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
