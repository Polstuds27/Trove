/**
 * Overview.
 *
 * Answers, in order: how much money do I have, where did it go this month, what
 * happened recently, am I inside budget, what's coming. Progressive disclosure —
 * the summary is always visible, the detail is one tap away, and there are no
 * decorative dashboards (§13, §49).
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
  PageHeader,
  ProgressBar,
  Stat,
} from "../../components/ui";
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
  const previousPeriod = useMemo(
    () => shiftPeriod(period, -1),
    [period],
  );
  const previousRange = periodRange(previousPeriod);

  const totals = useMemo(() => portfolio(lookups), [lookups]);
  const month = useMemo(() => summarize(dataset.transactions, range, lookups.fx), [dataset.transactions, range, lookups.fx]);
  const previous = useMemo(
    () => summarize(dataset.transactions, previousRange, lookups.fx),
    [dataset.transactions, previousRange, lookups.fx],
  );
  // Cash-flow chart: the year's monthly buckets (the viewed month alone would
  // yield a single point — the old mini-chart's condition could never fire).
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
    // Scoped to the viewed month: on "November 2026" this lists November's
    // latest six, not the six latest overall.
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
        <PageHeader title="Overview" subtitle="Your financial home" className="mb-2"/>
        <EmptyState
          mascot="idle"
          title="Let's get your accounts in"
          description="Start by adding the cash, bank and card accounts you actually use. Everything else — budgets, goals, reports — builds on top of them."
          action={
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/accounts/new")}>
              Add your first account
            </Button>
          }
          secondaryAction={
            <LinkButton to="/settings">Set your base currency</LinkButton>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        period={<span className="text-sm text-muted">{formatMonth(anchor)}</span>}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAnchor((prev) => shiftPeriod({ kind: "month", anchor: prev, monthStartDay: preferences.monthStartDay }, -1).anchor)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAnchor((prev) => shiftPeriod({ kind: "month", anchor: prev, monthStartDay: preferences.monthStartDay }, 1).anchor)}
            >
              Next
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/transactions?add=expense")}>
              Add
            </Button>
          </>
        }
      />

      {/* 1 + 2. How much money do I have, and how the month moved —
          an un-carded, typographic balance block (direction contract):
          hierarchy from type and whitespace, no hero-metric card. */}
      <section aria-label="Balance summary" className="pb-5 pt-1">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <Stat
            label="Total balance"
            emphasis="hero"
            className="max-w-md"
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

          <dl className="grid grid-cols-3 gap-4 sm:gap-7">
            <div>
              <Stat
                label="Income"
                tone="income"
                value={<span className="tabular">{formatMoney(month.income, currency)}</span>}
                caption={
                  incomeDelta !== null
                    ? `${incomeDelta >= 0 ? "↑" : "↓"} ${formatPercent(Math.abs(incomeDelta))} vs last month`
                    : undefined
                }
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              />
            </div>
            <div>
              <Stat
                label="Expenses"
                tone="expense"
                value={<span className="tabular">{formatMoney(month.expense, currency)}</span>}
                caption={
                  expenseDelta !== null
                    ? `${expenseDelta >= 0 ? "↑" : "↓"} ${formatPercent(Math.abs(expenseDelta))} vs last month`
                    : undefined
                }
                icon={<ArrowDownRight className="h-3.5 w-3.5" />}
              />
            </div>
            <div>
              <Stat
                label="Cash flow"
                tone={month.cashFlow >= 0 ? "income" : "expense"}
                value={<span className="tabular">{formatMoney(month.cashFlow, currency, { signed: true })}</span>}
                caption={`${month.transactionCount} transactions`}
                icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
              />
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* 3. Where the money moved — the dashboard's one chart, on a
              stable surface (charts never go on glass or bare canvas). */}
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

          {/* 4. Recent activity. */}
          <Card>
            <CardHeader
              title="Recent transactions"
              subtitle={recent.length > 0 ? `${rangeLabel(range, "month")}` : undefined}
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
                icon={<ArrowLeftRight className="h-6 w-6" />}
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

          {/* 4. Accounts at a glance. */}
          <Card>
            <CardHeader
              title="Accounts"
              subtitle={`${accounts.length} active`}
              icon={<Wallet className="h-4 w-4" />}
              action={
                <LinkButton to="/accounts">
                  Manage <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </LinkButton>
              }
            />
            {cashAccounts.length === 0 ? (
              <EmptyState
                compact
                icon={<Wallet className="h-6 w-6" />}
                title="No accounts yet"
                description="Add your cash, bank or e-wallet accounts to see balances here."
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate("/accounts/new")}>
                    Add account
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {cashAccounts.slice(0, 6).map((account) => {
                  const Icon = accountIcon(account.type);
                  return (
                    <li key={account.id}>
                      <Link to={`/accounts/${account.id}`} className="row-link flex items-center gap-3 px-4 py-2.5">
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-soft">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{account.name}</span>
                          <span className="block truncate text-xs text-muted">
                            {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
                          </span>
                        </span>
                        <span className="tabular shrink-0 text-sm font-semibold text-ink">
                          {formatMoney(account.current_balance, account.currency)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {creditCards.length > 0 && (
            <>
              <Divider label="Credit" />

              <ul className="divide-y divide-line pb-2">
                {creditCards.map((account) => {
                  const used = Math.max(0, -(account.current_balance ?? 0));
                  const limit = Math.max(0, account.credit_limit ?? 0);

                  const hasCreditLimit = limit > 0;
                  const pct = hasCreditLimit
                    ? Math.min(100, (used / limit) * 100)
                    : 0;

                  return (
                    <li key={account.id}>
                      <Link
                        to={`/accounts/${account.id}`}
                        className="row-link flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft-bg text-primary"
                          >
                            <CreditCard className="h-4 w-4" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">
                              {account.name}
                            </span>

                            {hasCreditLimit ? (
                              <span className="tabular block truncate text-xs text-muted">
                                {formatMoney(used, account.currency)} of{" "}
                                {formatMoney(limit, account.currency)} used
                              </span>
                            ) : (
                              <span className="block truncate text-xs text-muted">
                                No credit limit set
                              </span>
                            )}
                          </span>

                          {hasCreditLimit && (
                            <span
                              className={`tabular shrink-0 text-sm font-semibold ${
                                pct > 80 ? "text-warning" : "text-ink"
                              }`}
                            >
                              {formatPercent(pct)}
                            </span>
                          )}
                        </div>

                        {hasCreditLimit && (
                          <ProgressBar
                            value={pct}
                            size="sm"
                            className="mt-2"
                            tone={pct > 80 ? "warning" : "primary"}
                            label={`${account.name} credit utilization`}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* 5. Am I inside budget. */}
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
                icon={<ArrowDownRight className="h-6 w-6" />}
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
                        {formatMoney(item.spent, currency, { compact: true })} / {formatMoney(item.budget.amount, currency, { compact: true })}
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

          {/* 6. What's coming. */}
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

          {/* 7. Where the money went, at a glance. */}
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

          {/* Goals nudge — only when there is something to nudge about. */}
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
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}