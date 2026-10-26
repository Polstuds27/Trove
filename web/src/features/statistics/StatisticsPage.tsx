/**
 * Statistics — spending breakdown and trends.
 *
 * The page is a report, so everything is derived from the local ledger and can
 * be read offline. Two headline cards answer the questions people actually ask:
 * where the money went, and whether income is keeping up. Net worth and income
 * by source stay below so the old report tabs' data never disappears.
 */
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TrendingUp, Wallet } from "lucide-react";
import {
  Button,
  DonutChart,
  EmptyState,
  GlassPanel,
  LineChart,
  Mascot,
  PageHeader,
  Pill,
  RankedBars,
  SurfaceCard,
} from "../../components/ui";
import { formatMoney, formatPercent } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import {
  categoryBreakdown,
  netWorthSeries,
  portfolio,
  series,
  summarize,
} from "../analytics/engine";
import { periodRange, rangeLabel, type Period } from "../analytics/period";

type RangeId = "month" | "3m" | "6m" | "1y" | "all";

const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
];

/** The six categorical colours, in the order the spec names them. */
const CHART_COLORS = [
  "rgb(var(--color-chart-1))",
  "rgb(var(--color-chart-2))",
  "rgb(var(--color-chart-3))",
  "rgb(var(--color-chart-4))",
  "rgb(var(--color-chart-5))",
  "rgb(var(--color-chart-6))",
] as const;

const INCOME_BAR = "bg-sage";
const EXPENSE_BAR = "bg-sand";
const INCOME_BAR_CURRENT = "bg-primary";
const EXPENSE_BAR_CURRENT = "bg-terracotta";

export function StatisticsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const rawRange = params.get("range") ?? "month";
  const rangeId: RangeId =
    rawRange === "mtd"
      ? "month"
      : rawRange === "quarter"
        ? "3m"
        : rawRange === "year"
          ? "1y"
          : rawRange === "3m" || rawRange === "6m" || rawRange === "1y" || rawRange === "all"
            ? rawRange
            : "month";

  const now = useMemo(() => new Date(), []);
  const currency = lookups.dataset.baseCurrency;

  const selectedPeriod = useMemo<Period>(() => {
    if (rangeId === "month") {
      return { kind: "mtd", anchor: now, monthStartDay: preferences.monthStartDay };
    }
    if (rangeId === "all") {
      return { kind: "all", anchor: now, monthStartDay: preferences.monthStartDay };
    }
    const months = rangeId === "3m" ? 3 : rangeId === "6m" ? 6 : 12;
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      kind: "custom",
      anchor: now,
      monthStartDay: preferences.monthStartDay,
      custom: { start, end },
    };
  }, [rangeId, now, preferences.monthStartDay]);

  const range = periodRange(selectedPeriod);

  const summary = useMemo(
    () => summarize(dataset.transactions, range, lookups.fx),
    [dataset.transactions, range, lookups.fx],
  );

  const expenseSlices = useMemo(
    () => categoryBreakdown(dataset.transactions, range, lookups, "expense", 8),
    [dataset.transactions, range, lookups],
  );
  const incomeSlices = useMemo(
    () => categoryBreakdown(dataset.transactions, range, lookups, "income", 8),
    [dataset.transactions, range, lookups],
  );

  /** Fixed trailing six months for the income / expense card. */
  const trendPeriod = useMemo<Period>(() => {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      kind: "custom",
      anchor: now,
      monthStartDay: preferences.monthStartDay,
      custom: { start, end },
    };
  }, [now, preferences.monthStartDay]);

  const trend = useMemo(
    () => series(dataset.transactions, trendPeriod, lookups, 6),
    [dataset.transactions, trendPeriod, lookups],
  );

  const currentMonthRange = periodRange({
    kind: "mtd",
    anchor: now,
    monthStartDay: preferences.monthStartDay,
  });
  const currentMonth = useMemo(
    () => summarize(dataset.transactions, currentMonthRange, lookups.fx),
    [dataset.transactions, currentMonthRange, lookups.fx],
  );

  const worth = useMemo(
    () => netWorthSeries(dataset, lookups, trendPeriod, 6),
    [dataset, lookups, trendPeriod],
  );
  const worthSeries = useMemo(
    () => worth.map((point) => ({ label: point.label, value: point.net })),
    [worth],
  );
  const totals = useMemo(() => portfolio(lookups), [lookups]);

  const savingsRate =
    summary.income > 0 ? ((summary.income - summary.expense) / summary.income) * 100 : 0;

  function setRange(next: RangeId) {
    const nextParams = new URLSearchParams(params);
    if (next === "month") nextParams.delete("range");
    else nextParams.set("range", next);
    setParams(nextParams, { replace: true });
  }

  if (!ready) {
    return (
      <div className="space-y-4 lg:space-y-[18px]">
        <PageHeader title="Statistics" subtitle="Spending breakdown and trends" />
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option) => (
            <div key={option.id} className="h-[34px] w-[5.5rem] animate-pulse rounded-full bg-surface-sunken" />
          ))}
        </div>
        <div className="grid gap-[17px] lg:grid-cols-2">
          <div className="trove-card h-[390px] animate-pulse" />
          <div className="trove-card h-[390px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (dataset.transactions.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Statistics" subtitle="Spending breakdown and trends" />
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="statistics"
            title="Nothing to report yet"
            description="Statistics are built from your own transactions, which is why they work with no connection. Record a handful of entries and this screen fills in."
            action={
              <Button variant="primary" onClick={() => navigate("/transactions/new")}>
                Record your first transaction
              </Button>
            }
          />
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader title="Statistics" subtitle="Spending breakdown and trends" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Pill
              key={option.id}
              active={rangeId === option.id}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </Pill>
          ))}
        </div>
        <span className="hidden text-[12px] text-muted sm:block">
          {rangeLabel(range, selectedPeriod.kind)}
        </span>
      </div>

      <div className="grid gap-[17px] lg:grid-cols-2 lg:items-start">
        {/* Spending by category. */}
        <SurfaceCard className="overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
            <h2 className="text-[16px] font-semibold leading-6 text-ink">Spending by category</h2>
            <span className="tabular text-[13px] font-semibold text-primary">
              {formatMoney(summary.expense, currency)}
            </span>
          </div>

          {expenseSlices.length === 0 ? (
            <p className="px-6 py-12 text-center text-[13px] text-muted">
              No expenses in this range.
            </p>
          ) : (
            <div className="flex items-center gap-4 px-5 py-6 sm:gap-6 sm:px-6">
              <div className="shrink-0">
                <div className="lg:hidden">
                  <DonutChart
                    slices={expenseSlices.map((slice) => ({ label: slice.name, value: slice.value }))}
                    size={112}
                    thickness={18}
                    centerLabel="Spent"
                    centerValue={formatMoney(summary.expense, currency, { compact: true })}
                    ariaLabel="Spending by category"
                    colors={CHART_COLORS}
                    showLegend={false}
                  />
                </div>
                <div className="hidden lg:block">
                  <DonutChart
                    slices={expenseSlices.map((slice) => ({ label: slice.name, value: slice.value }))}
                    size={172}
                    thickness={26}
                    centerLabel="Spent"
                    centerValue={formatMoney(summary.expense, currency, { compact: true })}
                    ariaLabel="Spending by category"
                    colors={CHART_COLORS}
                    showLegend={false}
                  />
                </div>
              </div>

              <ul className="min-w-0 flex-1 space-y-2.5">
                {expenseSlices.map((slice, index) => (
                  <li key={slice.id} className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {slice.name}
                    </span>
                    <span className="tabular shrink-0 text-[12px] text-muted">
                      <span className="hidden lg:inline">
                        {formatMoney(slice.value, currency, { compact: true })}
                        <span className="px-1 text-faint">·</span>
                      </span>
                      {formatPercent(slice.share)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 border-t border-line/70">
            <MiniFigure label="Income" value={formatMoney(summary.income, currency, { compact: true })} tone="text-income" />
            <MiniFigure label="Expenses" value={formatMoney(summary.expense, currency, { compact: true })} tone="text-expense" />
            <MiniFigure
              label="Saved"
              value={formatPercent(savingsRate)}
              tone={savingsRate >= 0 ? "text-income" : "text-expense"}
            />
          </div>
        </SurfaceCard>

        {/* Income vs expenses + mascot. */}
        <div className="space-y-3">
          <SurfaceCard className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Income vs. expenses</h2>
              <span className="text-[12px] text-muted">Last 6 months</span>
            </div>

            <div className="px-5 pb-2 pt-5 sm:px-6">
              <TrendBars points={trend} currency={currency} />
            </div>

            <div className="flex items-center justify-center gap-5 px-5 pb-4 text-[11.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-[3px] ${INCOME_BAR}`} />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-[3px] ${EXPENSE_BAR}`} />
                Expenses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] border border-primary/50" />
                Current month
              </span>
            </div>

            <p className="border-t border-line/70 px-5 py-3.5 text-[12px] leading-5 text-muted sm:px-6">
              {now.toLocaleDateString(undefined, { month: "long" })}:{" "}
              <span className="font-semibold text-income">
                {formatMoney(currentMonth.income, currency, { compact: true })} in
              </span>{" "}
              <span className="text-faint">·</span>{" "}
              <span className="font-semibold text-expense">
                {formatMoney(currentMonth.expense, currency, { compact: true })} out
              </span>{" "}
              <span className="text-faint">·</span>{" "}
              <span className={currentMonth.net >= 0 ? "font-semibold text-income" : "font-semibold text-expense"}>
                {currentMonth.net >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(currentMonth.net), currency, { compact: true })} left over
              </span>
            </p>
          </SurfaceCard>

          <div className="hidden justify-center pt-1 lg:flex">
            <Mascot state="statistics" size={176} />
          </div>
          <div className="flex justify-center lg:hidden">
            <Mascot state="statistics" size={138} />
          </div>
        </div>
      </div>

      {/* Reports kept from the earlier tabbed page. */}
      <div className="grid gap-[17px] lg:grid-cols-2 lg:items-start">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Net worth</h2>
              <p className="mt-0.5 text-[12px] text-muted">Assets minus liabilities</p>
            </div>
            <div className="text-right">
              <p className="tabular text-[20px] font-bold leading-none tracking-[-0.03em] text-primary">
                {formatMoney(totals.netWorth, currency)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {formatMoney(totals.assets, currency, { compact: true })} assets
              </p>
            </div>
          </div>
          <div className="mt-5">
            <LineChart
              data={worthSeries}
              height={150}
              ariaLabel="Net worth over the last six months"
              tone="primary"
              fill
              format={(value) => formatMoney(value, currency, { compact: true })}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
            <Wallet className="h-3.5 w-3.5" /> Transfers between your own accounts are excluded.
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Income by source</h2>
              <p className="mt-0.5 text-[12px] text-muted">{rangeLabel(range, selectedPeriod.kind)}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-income-soft text-income">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            {incomeSlices.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-muted">No income in this range.</p>
            ) : (
              <RankedBars
                items={incomeSlices.map((slice) => ({
                  label: slice.name,
                  value: slice.value,
                  caption: `${slice.count} tx · ${formatPercent(slice.share)}`,
                }))}
                format={(value) => formatMoney(value, currency, { compact: true })}
                ariaLabel="Income by source"
                tone="income"
                limit={6}
              />
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

/** Paired rounded bars, with the current month in the darker pair. */
function TrendBars({
  points,
  currency,
}: {
  points: { key: string; label: string; income: number; expense: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
  const CHART_HEIGHT = 190;

  if (points.length === 0) {
    return <p className="py-10 text-center text-[13px] text-muted">No activity yet.</p>;
  }

  return (
    <div
      role="img"
      aria-label="Income and expenses over the last six months"
      className="flex items-end gap-1.5"
      style={{ height: CHART_HEIGHT }}
    >
      {points.map((point, index) => {
        const current = index === points.length - 1;
        const incomeHeight = Math.max(3, (point.income / max) * (CHART_HEIGHT - 26));
        const expenseHeight = Math.max(3, (point.expense / max) * (CHART_HEIGHT - 26));
        return (
          <div key={point.key} className="group flex h-full flex-1 flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-1">
              <div
                title={`${point.label} income: ${formatMoney(point.income, currency)}`}
                className={`w-[42%] rounded-t-[5px] transition-opacity ${current ? INCOME_BAR_CURRENT : INCOME_BAR} opacity-90 group-hover:opacity-100`}
                style={{ height: `${incomeHeight}px` }}
              />
              <div
                title={`${point.label} expenses: ${formatMoney(point.expense, currency)}`}
                className={`w-[42%] rounded-t-[5px] transition-opacity ${current ? EXPENSE_BAR_CURRENT : EXPENSE_BAR} opacity-90 group-hover:opacity-100`}
                style={{ height: `${expenseHeight}px` }}
              />
            </div>
            <span className={`mt-2 truncate text-center text-[10px] ${current ? "font-semibold text-ink" : "text-muted"}`}>
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniFigure({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-r border-line/70 px-4 py-3 last:border-r-0">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`tabular mt-1 truncate text-[15px] font-bold tracking-[-0.02em] ${tone}`}>{value}</p>
    </div>
  );
}
