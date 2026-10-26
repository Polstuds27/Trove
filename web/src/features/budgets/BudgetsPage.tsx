/**
 * Budget — category allocations for the current period.
 *
 * Left: one figure (spent of allocated), the overall bar and a block per
 * category. Right: a mascot panel that reacts to the budget closest to trouble,
 * then the spending that no budget covers. Month / Week (and Year when it
 * exists) filter the cadence without hiding the underlying budgets from each
 * other. New, detail and edit routes are unchanged.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CircleAlert,
  Pencil,
  PiggyBank,
  Plus,
} from "lucide-react";
import {
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  MascotPanel,
  PageHeader,
  ProgressBar,
  SegmentedControl,
  SurfaceCard,
} from "../../components/ui";
import { daysBetween, formatMoney, formatMonth, formatPercent } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import { budgetProgress, type BudgetProgress } from "../analytics/engine";
import { inRange, periodRange, type Period } from "../analytics/period";
import { convert } from "../analytics/fx";

type View = "all" | "attention";
type Cadence = "month" | "week" | "year";

const CADENCE_PERIOD: Record<Cadence, "monthly" | "weekly" | "yearly"> = {
  month: "monthly",
  week: "weekly",
  year: "yearly",
};

function cadenceLabel(cadence: Cadence) {
  return cadence === "week" ? "Week" : cadence === "year" ? "Year" : "Month";
}

function cadenceNoun(cadence: Cadence) {
  return cadence === "week" ? "weekly" : cadence === "year" ? "yearly" : "monthly";
}

export function BudgetsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") as View) ?? "all";

  const [cadence, setCadence] = useState<Cadence>("month");
  const anchor = useMemo(() => new Date(), []);

  const progress = useMemo(
    () =>
      budgetProgress(
        dataset.budgets,
        dataset.transactions,
        lookups,
        anchor,
        preferences.monthStartDay,
      ),
    [dataset.budgets, dataset.transactions, lookups, anchor, preferences.monthStartDay],
  );

  const currency = lookups.dataset.baseCurrency;
  const monthName = formatMonth(anchor);
  const monthRange = useMemo<Period>(
    () => ({ kind: "month", anchor, monthStartDay: preferences.monthStartDay }),
    [anchor, preferences.monthStartDay],
  );

  const range = periodRange(monthRange);
  const daysLeft = range ? Math.max(0, daysBetween(new Date(), range.end)) : 0;

  const byCadence = useMemo(
    () => progress.filter((item) => item.budget.period === CADENCE_PERIOD[cadence]),
    [progress, cadence],
  );
  const sorted = useMemo(
    () => [...byCadence].sort((a, b) => b.percent - a.percent),
    [byCadence],
  );
  const attention = sorted.filter((item) => item.alert);
  const visible = view === "attention" ? attention : sorted;

  const totalLimit = byCadence.reduce((sum, item) => sum + item.spent + item.remaining, 0);
  const totalSpent = byCadence.reduce((sum, item) => sum + item.spent, 0);
  const overallPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const overallLeft = totalLimit - totalSpent;
  const overCount = byCadence.filter((item) => item.overBudget).length;

  const counts = useMemo(
    () => ({
      month: progress.filter((item) => item.budget.period === "monthly").length,
      week: progress.filter((item) => item.budget.period === "weekly").length,
      year: progress.filter((item) => item.budget.period === "yearly").length,
    }),
    [progress],
  );

  const cadenceOptions = [
    { id: "month" as const, label: "Month" },
    { id: "week" as const, label: "Week" },
    ...(counts.year > 0 ? [{ id: "year" as const, label: "Year" }] : []),
  ];

  /** Spending that no current budget covers, so it is never silently counted twice. */
  const unbudgeted = useMemo(() => {
    const covered = new Set(
      dataset.budgets
        .map((budget) => budget.category_id)
        .filter((id): id is string => Boolean(id)),
    );
    const hasGlobal = dataset.budgets.some((budget) => !budget.category_id);
    if (hasGlobal) return 0;
    let total = 0;
    for (const tx of dataset.transactions) {
      if (tx.type !== "expense" || !inRange(tx.date, range)) continue;
      const root = tx.category_id
        ? lookups.categoryRoot.get(tx.category_id) ?? tx.category_id
        : null;
      if (root && covered.has(root)) continue;
      total += convert(Math.abs(tx.amount), tx.currency, lookups.fx);
    }
    return total;
  }, [dataset.budgets, dataset.transactions, range, lookups]);

  const focus = attention[0] ?? [...byCadence].sort((a, b) => b.remaining - a.remaining)[0] ?? null;
  const focusState = focus
    ? focus.overBudget
      ? "budgetOver"
      : focus.alert
        ? "budgetWarning"
        : "budgetOnTrack"
    : "budgetOnTrack";
  const focusTitle = focus
    ? focus.overBudget
      ? `${focus.categoryName ?? "A budget"} is over budget`
      : focus.alert
        ? `${focus.categoryName ?? "A budget"} is nearly at its limit`
        : `${focus.categoryName ?? "Every budget"} is on track`
    : "No budgets in this view";
  const focusValue = focus
    ? focus.remaining >= 0
      ? `${formatMoney(focus.remaining, currency)} left`
      : `${formatMoney(Math.abs(focus.remaining), currency)} over`
    : formatMoney(0, currency);
  const focusDescription = focus
    ? cadence === "week"
      ? `Left for the next ${Math.max(1, Math.min(7, daysLeft))} days.`
      : cadence === "year"
        ? "Left for the rest of the year."
        : `Left for the next ${daysLeft} days of ${monthName}.`
    : "Add a budget to start tracking this period.";

  function setView(next: View) {
    const nextParams = new URLSearchParams(params);
    if (next === "all") nextParams.delete("view");
    else nextParams.set("view", next);
    setParams(nextParams, { replace: true });
  }

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Budget"
        subtitle={`Category allocations for ${monthName}`}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/budgets/new")}
          >
            New budget
          </Button>
        }
      />

      {!ready ? (
        <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="trove-card h-[480px] animate-pulse" />
          <div className="space-y-4">
            <div className="trove-card h-[190px] animate-pulse" />
            <div className="trove-card h-[120px] animate-pulse" />
          </div>
        </div>
      ) : progress.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="budgetOnTrack"
            title="No budgets yet"
            description="Give your biggest spending categories a ceiling and Trove tracks them offline, automatically."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => navigate("/budgets/new")}
              >
                Create your first budget
              </Button>
            }
            secondaryAction={<LinkButton to="/categories">Review my categories</LinkButton>}
          />
        </GlassPanel>
      ) : (
        <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
          {/* Total + category blocks. */}
          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[12px] text-muted">Spent across {cadenceNoun(cadence)} budgets</p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="tabular text-[40px] font-bold leading-none tracking-[-0.035em] text-primary">
                    {formatMoney(totalSpent, currency)}
                  </span>
                  <span className="text-[13px] text-muted">
                    of {formatMoney(totalLimit, currency)}
                  </span>
                </div>
              </div>
              <SegmentedControl
                size="sm"
                options={cadenceOptions}
                value={cadence}
                onChange={setCadence}
                ariaLabel="Budget period"
                className="min-w-[142px]"
              />
            </div>

            <ProgressBar
              value={overallPercent}
              tone={overallPercent > 100 || overallPercent >= 90 ? "expense" : "primary"}
              className="mt-4"
              label={`${cadenceLabel(cadence)} budget usage`}
            />

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-muted">
                {formatPercent(overallPercent)} used ·{" "}
                <span className={overallLeft < 0 ? "font-semibold text-expense" : "font-semibold text-income"}>
                  {overallLeft >= 0
                    ? `${formatMoney(overallLeft, currency)} left`
                    : `${formatMoney(Math.abs(overallLeft), currency)} over`}
                </span>
                {overCount > 0 && ` · ${overCount} over`}
              </span>
              {attention.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView(view === "attention" ? "all" : "attention")}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors ${
                    view === "attention"
                      ? "bg-expense-soft text-expense"
                      : "text-muted hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  <CircleAlert className="h-3.5 w-3.5" />
                  {view === "attention" ? "Show all" : `${attention.length} need attention`}
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <EmptyState
                compact
                state="budgetOnTrack"
                title={view === "attention" ? "Nothing needs attention" : `No ${cadenceNoun(cadence)} budgets`}
                description={
                  view === "attention"
                    ? "Every budget is below its alert threshold. Enjoy it while it lasts."
                    : "Switch the period above, or create a budget for this cadence."
                }
                action={
                  view === "attention" ? (
                    <Button variant="secondary" size="sm" onClick={() => setView("all")}>
                      Show all budgets
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => navigate("/budgets/new")}
                    >
                      New budget
                    </Button>
                  )
                }
              />
            ) : (
              <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
                {visible.map((item) => (
                  <BudgetBlock key={item.budget.id} item={item} currency={currency} />
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
              <span className="text-[11.5px] text-muted">
                Expenses only · parent categories include their subcategories
              </span>
              <LinkButton to="/budgets/new" className="gap-1 lg:hidden">
                <Plus className="h-3.5 w-3.5" /> New budget
              </LinkButton>
            </div>
          </SurfaceCard>

          {/* Mascot + unbudgeted spending. */}
          <div className="space-y-4">
            <MascotPanel
              state={focusState}
              title={focusTitle}
              value={focusValue}
              description={focusDescription}
              tone={focus?.overBudget ? "peach" : "sage"}
              mascotSize={140}
              action={
                focus ? (
                  <LinkButton to={`/budgets/${focus.budget.id}`} className="text-[12px]">
                    Open budget
                  </LinkButton>
                ) : undefined
              }
            />

            <SurfaceCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Not in a budget</p>
                  <p className="tabular mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-primary">
                    {formatMoney(unbudgeted, currency)}
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {unbudgeted > 0 ? `Other spending in ${monthName}` : "All spending is covered this month"}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-primary dark:bg-primary-soft">
                  <PiggyBank className="h-5 w-5" />
                </span>
              </div>
              <Link
                to="/transactions"
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
              >
                Review transactions
              </Link>
            </SurfaceCard>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetBlock({ item, currency }: { item: BudgetProgress; currency: string }) {
  const label = item.categoryName ?? "All spending";
  const limit = item.spent + item.remaining;
  const urgent = item.overBudget || item.percent >= 90 || item.alert;
  const editHref = `/budgets/${item.budget.id}/edit`;

  return (
    <li>
      <div className="group py-4 first:pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Link
            to={`/budgets/${item.budget.id}`}
            className="min-w-0 truncate text-[17px] font-semibold leading-6 text-ink transition-colors hover:text-primary"
          >
            {label}
          </Link>
          <div className="flex items-center gap-2">
            <span className="tabular text-right text-[12.5px] text-muted">
              {formatMoney(item.spent, currency, { compact: true })}{" "}
              <span className="text-faint">of</span>{" "}
              {formatMoney(limit, currency, { compact: true })}
              <span className="mx-1 text-faint">·</span>
              <span className={`font-semibold ${urgent || item.remaining < 0 ? "text-expense" : "text-primary"}`}>
                {item.remaining >= 0
                  ? `${formatMoney(item.remaining, currency, { compact: true })} left`
                  : `${formatMoney(Math.abs(item.remaining), currency, { compact: true })} over`}
              </span>
            </span>
            <Link
              to={editHref}
              aria-label={`Edit ${label} budget`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-faint opacity-0 transition-all hover:bg-surface-sunken hover:text-ink focus:opacity-100 group-hover:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <ProgressBar
          value={item.percent}
          size="sm"
          tone={urgent || item.remaining < 0 ? "expense" : "primary"}
          className="mt-2.5"
          label={`${label} budget usage`}
        />
      </div>
    </li>
  );
}
