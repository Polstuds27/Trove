/**
 * Statistics — spending breakdown and trends.
 *
 * The page is a report, so everything is derived from the local ledger and can
 * be read offline. Two headline cards answer the questions people actually ask:
 * where the money went, and whether income is keeping up. Net worth and income
 * by source stay below so the old report tabs' data never disappears.
 */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import {
  ActivityHeatmap,
  Button,
  DonutChart,
  EarningsCard,
  EmptyState,
  type EarningsPeriod,
  GlassPanel,
  KpiCard,
  Mascot,
  PageHeader,
  Pill,
  SurfaceCard,
} from "../../components/ui";
import { addDays, formatDate, formatMoney, formatPercent, toDateKey, todayKey } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import {
  categoryBreakdown,
  dailyTotals,
  upcoming,
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

  /** Daily spending for the activity heatmap: the trailing 52 weeks. */
  const heatRange = useMemo(() => ({ start: addDays(now, -52 * 7), end: addDays(now, 1) }), [now]);
  const spendingDays = useMemo(
    () => dailyTotals(dataset.transactions, heatRange, lookups, "expense"),
    [dataset.transactions, heatRange, lookups],
  );
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  /**
   * Income card periods. Every figure comes from the existing engine helpers
   * (dailyTotals, series, summarize, categoryBreakdown); each period is compared
   * with the same-length window right before it.
   */
  const incomePeriods = useMemo<EarningsPeriod[]>(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

    const sourcesFor = (range: { start: Date; end: Date }, previous: { start: Date; end: Date }) => {
      const current = categoryBreakdown(dataset.transactions, range, lookups, "income");
      const before = new Map(categoryBreakdown(dataset.transactions, previous, lookups, "income").map((slice) => [slice.id, slice.value]));
      const top = current.slice(0, 5);
      const rest = current.slice(5);
      const rows = top.map((slice, index) => {
        const prev = before.get(slice.id);
        return {
          id: slice.id,
          label: slice.name,
          amount: slice.value,
          change: prev ? ((slice.value - prev) / prev) * 100 : undefined,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
      });
      if (rest.length > 0) {
        rows.push({
          id: "__other__",
          label: `Other (${rest.length})`,
          amount: rest.reduce((sum, slice) => sum + slice.value, 0),
          change: undefined,
          color: CHART_COLORS[5],
        });
      }
      return rows;
    };

    const daily = (days: number, id: string, label: string): EarningsPeriod => {
      const start = addDays(today, -(days - 1));
      const range = { start, end: addDays(today, 1) };
      const previous = { start: addDays(start, -days), end: start };
      const byDay = new Map(dailyTotals(dataset.transactions, range, lookups, "income").map((point) => [point.date, point.value]));
      const keys = Array.from({ length: days }, (_, i) => addDays(start, i));
      return {
        id,
        label,
        comparison: `vs previous ${days} days`,
        total: summarize(dataset.transactions, range, lookups.fx).income,
        previous: summarize(dataset.transactions, previous, lookups.fx).income,
        trend: keys.map((day) => byDay.get(toDateKey(day)) ?? 0),
        trendLabels: keys.map((day) => dayLabel.format(day)),
        sources: sourcesFor(range, previous),
      };
    };

    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const yearEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearRange = { start: yearStart, end: yearEnd };
    const yearPrevious = { start: new Date(now.getFullYear() - 1, now.getMonth() - 11, 1), end: yearStart };
    const months = series(
      dataset.transactions,
      { kind: "custom", anchor: now, monthStartDay: preferences.monthStartDay, custom: { start: yearStart, end: new Date(yearEnd.getTime() - 1) } },
      lookups,
      12,
    );

    return [
      daily(7, "7d", "7D"),
      daily(30, "30d", "30D"),
      {
        id: "12m",
        label: "12M",
        comparison: "vs previous 12 months",
        total: summarize(dataset.transactions, yearRange, lookups.fx).income,
        previous: summarize(dataset.transactions, yearPrevious, lookups.fx).income,
        trend: months.map((point) => point.income),
        trendLabels: months.map((point) => point.label),
        sources: sourcesFor(yearRange, yearPrevious),
      },
    ];
  }, [dataset.transactions, lookups, now, preferences.monthStartDay]);

  const nextIncome = useMemo(() => upcoming(lookups, 60).find((item) => item.tone === "income") ?? null, [lookups]);

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
            <div key={option.id} className="skeleton h-[34px] w-[5.5rem] rounded-full" />
          ))}
        </div>
        <div className="grid gap-[17px] lg:grid-cols-2">
          <div className="trove-card h-[390px] p-6"><div className="skeleton h-full w-full rounded-2xl" /></div>
          <div className="trove-card h-[390px] p-6"><div className="skeleton h-full w-full rounded-2xl" /></div>
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


      {/*
        Layout, top to bottom: the month at a glance; the range-driven pair
        (where it went, income vs. expenses); the two trend cards (net worth,
        income); then the full-width activity heatmap. Each row is a grid with
        stretched items, so cards in a row share a height and nothing floats.
      */}
      {/* 1. The month at a glance: the headline reading, with the mascot. */}
          <GlassPanel className="flex items-center gap-3 py-2 pl-5 pr-3 sm:pl-6 sm:pr-4">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-5 text-muted">
                {now.toLocaleDateString(undefined, { month: "long" })}:{" "}
                <span className="font-semibold text-income">
                  {formatMoney(currentMonth.income, currency, { compact: true })} in
                </span>{" "}
                <span className="text-faint">·</span>{" "}
                <span className="font-semibold text-expense">
                  {formatMoney(currentMonth.expense, currency, { compact: true })} out
                </span>
              </p>
              <p
                className={`mt-0.5 text-[12px] font-semibold ${
                  currentMonth.net >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {currentMonth.net >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(currentMonth.net), currency, { compact: true })} left over
                this month
              </p>
            </div>
            <Mascot state="statistics" size={84} className="shrink-0" />
          </GlassPanel>

      {/* 2. Where the money went, and whether income kept up. The range pills drive this row. */}
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
      <div className="grid gap-[17px] lg:grid-cols-2">
        {/* Spending by category. */}
        <SurfaceCard className="flex h-full flex-col overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
            <h2 className="text-[16px] font-semibold leading-6 text-ink">Spending by category</h2>
            <span className="tabular text-[13px] font-semibold text-primary">
              {formatMoney(summary.expense, currency)}
            </span>
          </div>

          {expenseSlices.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-6 py-12 text-center text-[13px] text-muted">
              No expenses in this range.
            </p>
          ) : (
            <div className="flex flex-1 flex-col items-center gap-5 px-5 py-6 sm:flex-row sm:gap-6 sm:px-6">
              {/* One donut size everywhere: phones stack it above the legend
                  instead of shrinking it, so the centre readout stays legible. */}
              <div className="shrink-0">
                <DonutChart
                  slices={expenseSlices.map((slice) => ({ label: slice.name, value: slice.value }))}
                  size={172}
                  thickness={24}
                  centerLabel="Spent"
                  centerValue={formatMoney(summary.expense, currency, { compact: true })}
                  ariaLabel="Spending by category"
                  colors={CHART_COLORS}
                  showLegend={false}
                  activeIndex={activeSlice}
                  onActiveChange={setActiveSlice}
                  formatValue={(value) => formatMoney(value, currency, { compact: true })}
                />
              </div>

              {/* Interactive legend (EasyUI DonutChart pattern): hovering or
                  focusing a row highlights its arc and fills the centre. */}
              <ul className="w-full min-w-0 flex-1 space-y-0.5" aria-label="Spending categories">
                {expenseSlices.map((slice, index) => (
                  <li key={slice.id}>
                    <button
                      type="button"
                      aria-pressed={activeSlice === index}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse") setActiveSlice(index);
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse") setActiveSlice(null);
                      }}
                      onFocus={() => setActiveSlice(index)}
                      onBlur={() => setActiveSlice(null)}
                      // Mouse users already highlighted on hover; a click
                      // toggles only for touch and keyboard.
                      onClick={(event) => {
                        if ((event.nativeEvent as PointerEvent).pointerType === "mouse") return;
                        setActiveSlice(activeSlice === index ? null : index);
                      }}
                      className={`flex min-h-[34px] w-full items-center gap-2.5 rounded-xl px-2 text-left hover:bg-surface-sunken/60 ${
                        activeSlice !== null && activeSlice !== index ? "opacity-55" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                        {slice.name}
                      </span>
                      <span className="tabular shrink-0 text-[12px] text-muted">
                        <span>
                          {formatMoney(slice.value, currency, { compact: true })}
                          <span className="px-1 text-faint">·</span>
                        </span>
                        {formatPercent(slice.share)}
                      </span>
                    </button>
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
          <SurfaceCard className="flex h-full flex-col overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Income vs. expenses</h2>
              <span className="text-[12px] text-muted">Last 6 months</span>
            </div>

            <div className="flex flex-1 flex-col justify-end px-5 pb-2 pt-5 sm:px-6">
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

          </SurfaceCard>
      </div>

      {/* 3. Trends you can scrub. */}
      <div className="grid gap-[17px] lg:grid-cols-2">
        {/* Net worth (EasyUI StatCard → KpiCard): scrub or arrow through months. */}
        <KpiCard
          label="Net worth"
          description="Assets minus liabilities"
          value={totals.netWorth}
          trend={worthSeries.map((point) => point.value)}
          trendLabels={worthSeries.map((point) => point.label)}
          // Month-over-month change, both sides from the same net-worth series.
          previous={worthSeries.length > 1 ? worthSeries[worthSeries.length - 2].value : undefined}
          changeFrom={worthSeries.length > 0 ? worthSeries[worthSeries.length - 1].value : undefined}
          period="vs last month"
          format={(value) => formatMoney(value, currency)}
          chartHeight={120}
          className="h-full"
          aside={
            <p className="tabular text-[11px] text-muted">
              {formatMoney(totals.assets, currency, { compact: true })} assets
            </p>
          }
          footer={
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <Wallet className="h-3.5 w-3.5" /> Transfers between your own accounts are excluded.
            </p>
          }
        />
        {/* Income (EasyUI Earnings → EarningsCard): 7D / 30D / 12M, by source. */}
        <EarningsCard
          title="Income"
          periods={incomePeriods}
          format={(value) => formatMoney(value, currency)}
          emptyText="No income in this period."
          footer={
            nextIncome
              ? {
                  label: (
                    <>
                      Next incoming · <span className="text-ink-soft">{nextIncome.title}</span> ·{" "}
                      <span className="text-ink-soft">{formatDate(nextIncome.date, "short")}</span>
                    </>
                  ),
                  value: formatMoney(nextIncome.amount, nextIncome.currency),
                }
              : undefined
          }
        />
      </div>

      {/* 4. Spending activity: daily expense heatmap (EasyUI ActivityHeatmap). */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-ink">Spending activity</h2>
            <p className="mt-0.5 text-[12px] text-muted">Daily expenses, up to the last 12 months</p>
          </div>
          <ActivityHeatmap
            data={spendingDays}
            endDate={todayKey()}
            weeks={52}
            weekStart={preferences.weekStartsOn}
            color="rgb(var(--color-expense))"
            formatValue={(value) => formatMoney(value, currency)}
            summaryLabel={(total, columns) =>
              `${formatMoney(total, currency)} spent in the last ${columns >= 8 ? `${Math.round(columns / 4.345)} months` : `${columns} weeks`}`
            }
            ariaLabel="Daily spending heatmap"
          />
        </SurfaceCard>
    </div>
  );
}

/**
 * Paired rounded bars, with the current month in the darker pair. Each month is
 * focusable and shows an accessible tooltip with the exact figures (the
 * tooltip card follows EasyUI's chart tooltip treatment, positioned in CSS).
 */
function TrendBars({
  points,
  currency,
}: {
  points: { key: string; label: string; income: number; expense: number }[];
  currency: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
  const CHART_HEIGHT = 190;

  if (points.length === 0) {
    return <p className="py-10 text-center text-[13px] text-muted">No activity yet.</p>;
  }

  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="relative">
      <div
        role="list"
        aria-label="Income and expenses over the last six months"
        className="flex items-end gap-1.5"
        style={{ height: CHART_HEIGHT }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
      >
        {points.map((point, index) => {
          const current = index === points.length - 1;
          const on = active === index;
          const incomeHeight = Math.max(3, (point.income / max) * (CHART_HEIGHT - 26));
          const expenseHeight = Math.max(3, (point.expense / max) * (CHART_HEIGHT - 26));
          return (
            <div
              key={point.key}
              role="listitem"
              tabIndex={0}
              aria-label={`${point.label}: income ${formatMoney(point.income, currency)}, expenses ${formatMoney(point.expense, currency)}`}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className={`group flex h-full flex-1 flex-col justify-end rounded-lg outline-none transition-colors focus-visible:bg-surface-sunken/60 ${on ? "bg-surface-sunken/40" : ""}`}
            >
              <div className="flex flex-1 items-end justify-center gap-1">
                <div
                  className={`w-[42%] origin-bottom animate-bar-grow rounded-t-[5px] transition-opacity ${current ? INCOME_BAR_CURRENT : INCOME_BAR} ${active !== null && !on ? "opacity-50" : "opacity-90"}`}
                  style={{ height: `${incomeHeight}px`, animationDelay: `${Math.min(index * 30, 180)}ms` }}
                />
                <div
                  className={`w-[42%] origin-bottom animate-bar-grow rounded-t-[5px] transition-opacity ${current ? EXPENSE_BAR_CURRENT : EXPENSE_BAR} ${active !== null && !on ? "opacity-50" : "opacity-90"}`}
                  style={{ height: `${expenseHeight}px`, animationDelay: `${Math.min(index * 30, 180)}ms` }}
                />
              </div>
              <span className={`mt-2 truncate text-center text-[10px] ${current ? "font-semibold text-ink" : "text-muted"}`}>
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      {activePoint && active !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 z-10 w-[148px] animate-fade-in rounded-xl border border-line/70 bg-surface-raised px-3 py-2 text-[12px] shadow-raised"
          style={{
            left: `clamp(0px, calc(${((active + 0.5) / points.length) * 100}% - 74px), calc(100% - 148px))`,
          }}
        >
          <p className="font-semibold text-ink">{activePoint.label}</p>
          <p className="tabular mt-1 flex justify-between gap-2 text-muted">
            Income <span className="text-income">{formatMoney(activePoint.income, currency, { compact: true })}</span>
          </p>
          <p className="tabular flex justify-between gap-2 text-muted">
            Expenses <span className="text-expense">{formatMoney(activePoint.expense, currency, { compact: true })}</span>
          </p>
          <p className="tabular mt-0.5 flex justify-between gap-2 border-t border-line/60 pt-1 text-muted">
            Net
            <span className={activePoint.income - activePoint.expense >= 0 ? "text-income" : "text-expense"}>
              {formatMoney(activePoint.income - activePoint.expense, currency, { compact: true, signed: true })}
            </span>
          </p>
        </div>
      )}
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
