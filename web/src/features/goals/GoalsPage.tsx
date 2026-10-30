/**
 * Savings goals.
 *
 * Progress is derived from the ledger — contributions are transactions tagged
 * with the goal — so the bar is honest even when recorded offline. A goal that
 * needs money each month to hit its date says exactly how much (§26).
 *
 * The page reads as a savings story first: a glass hero with the money already
 * set aside, then one card per goal with its deadline and progress.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarClock, Plus, Trophy } from "lucide-react";
import {
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  Mascot,
  PageHeader,
  ProgressBar,
  SurfaceCard,
} from "../../components/ui";
import {
  formatDate,
  formatMoney,
  formatMonth,
  formatPercent,
  formatRelativeTime,
} from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { goalProgress, type GoalProgress } from "../analytics/engine";

export function GoalsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const navigate = useNavigate();

  const progress = useMemo(
    () => goalProgress(dataset.goals, dataset.transactions, lookups),
    [dataset.goals, dataset.transactions, lookups],
  );

  const currency = lookups.dataset.baseCurrency;
  const savedTotal = progress.reduce((sum, item) => sum + item.saved, 0);
  const targetTotal = progress.reduce((sum, item) => sum + item.target, 0);
  const completed = progress.filter((item) => item.percent >= 100).length;
  const overall = targetTotal > 0 ? (savedTotal / targetTotal) * 100 : 0;

  const [selected, setSelected] = useState<string | null>(null);
  const detail = progress.find((item) => item.goal.id === selected) ?? null;

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Savings goals"
        subtitle="Little by little"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/goals/new")}
          >
            New goal
          </Button>
        }
      />

      {ready && dataset.goals.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="savings"
            title="No savings goals yet"
            description="A goal turns an abstract number into something you can chase: it tracks what you've put aside, tells you what's left, and shows whether a target date is realistic."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => navigate("/goals/new")}
              >
                Create a goal
              </Button>
            }
            secondaryAction={
              <LinkButton to="/transactions?add=transfer">Record a contribution</LinkButton>
            }
          />
        </GlassPanel>
      ) : (
        <>
          {/* Hero: the whole savings picture before the individual goals. */}
          <GlassPanel className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <div className="relative z-10 max-w-[66%] sm:max-w-[62%] lg:max-w-[52%]">
              <p className="trove-eyebrow">Savings</p>
              <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-primary sm:text-[30px]">
                Little by little
              </h2>
              <p className="mt-1.5 max-w-[24ch] text-[13px] leading-5 text-muted">
                Every peso you set aside counts.
              </p>

              <p className="mt-5 text-[12px] font-medium text-muted">Total saved</p>
              <p className="tabular mt-1 text-[38px] font-bold leading-none tracking-[-0.04em] text-primary sm:text-[46px] lg:text-[54px]">
                {formatMoney(savedTotal, currency)}
              </p>
              <p className="mt-1.5 text-[12px] font-semibold text-ink-soft">
                across {progress.length} {progress.length === 1 ? "goal" : "goals"}
                <span className="mx-1.5 font-normal text-faint">·</span>
                <span className="font-medium text-muted">
                  {formatPercent(overall)} of {formatMoney(targetTotal, currency, { compact: true })}
                </span>
              </p>

              {completed > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1 text-[11.5px] font-medium text-primary dark:bg-white/10">
                  <Trophy aria-hidden="true" className="h-3.5 w-3.5" />
                  {completed} {completed === 1 ? "goal" : "goals"} complete
                </p>
              )}
            </div>

            <div className="pointer-events-none absolute -bottom-3 -right-1 sm:right-2 lg:bottom-0 lg:right-8">
              <Mascot state="savings" size={190} className="sm:hidden" />
              <Mascot state="savings" size={240} className="hidden sm:block" />
            </div>
          </GlassPanel>

          <div className="grid gap-[17px] sm:grid-cols-2 lg:grid-cols-3">
            {progress.map((item) => (
              <GoalCard
                key={item.goal.id}
                item={item}
                currency={currency}
                selected={selected === item.goal.id}
                onToggle={() =>
                  setSelected(selected === item.goal.id ? null : item.goal.id)
                }
                onOpen={() => navigate(`/goals/${item.goal.id}`)}
                onEdit={() => navigate(`/goals/${item.goal.id}/edit`)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <LinkButton to="/goals/new" className="gap-1">
              <Plus className="h-4 w-4" /> Add another goal
            </LinkButton>
            <LinkButton to="/transactions?add=transfer">Record a contribution</LinkButton>
          </div>

          {detail && (
            <SurfaceCard className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">
                    {detail.goal.name} — activity
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {detail.contributions.length} contribution
                    {detail.contributions.length === 1 ? "" : "s"} recorded
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[12px] font-medium text-muted hover:text-ink"
                >
                  Hide
                </button>
              </div>
              {detail.contributions.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] font-medium text-ink">No contributions yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-5 text-muted">
                    Record a transfer into the goal's account and tag it here — the bar updates
                    immediately.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate("/transactions?add=transfer")}
                  >
                    Add a contribution
                  </Button>
                </div>
              ) : (
                <ul className="trove-hairline-list px-5">
                  {detail.contributions.slice(0, 8).map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {tx.notes || "Contribution"}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          {formatRelativeTime(tx.date)}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-[13px] font-semibold text-income">
                        +{formatMoney(Math.abs(tx.amount), tx.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>
          )}
        </>
      )}
    </div>
  );
}

function GoalCard({
  item,
  currency,
  selected,
  onToggle,
  onOpen,
  onEdit,
}: {
  item: GoalProgress;
  currency: string;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const done = item.percent >= 100;
  const pct = Math.min(100, Math.max(0, item.percent));
  const targetDate = item.goal.target_date ? formatMonth(item.goal.target_date, "short") : null;

  return (
    <SurfaceCard
      className={`flex flex-col p-5 transition-colors ${
        selected ? "ring-1 ring-primary/35" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[16px] font-semibold leading-6 text-ink">
              {item.goal.name}
            </span>
            {done && <Trophy aria-label="Goal complete" className="h-4 w-4 shrink-0 text-warning" />}
          </span>
        </button>
        {targetDate ? (
          <span className="shrink-0 text-[11.5px] text-muted">
            Target <span className="tabular font-semibold text-ink-soft">{targetDate}</span>
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-faint">No target date</span>
        )}
      </div>

      <div className="mt-4">
        <p className={`tabular text-[32px] font-bold leading-none tracking-[-0.035em] ${done ? "text-income" : "text-primary"}`}>
          {formatMoney(item.saved, currency)}
        </p>
        <p className="tabular mt-1.5 text-[12px] text-muted">
          of {formatMoney(item.target, currency)}
          <span className="px-1 text-faint">·</span>
          <span className="font-semibold text-ink-soft">{formatPercent(item.percent)}</span>
        </p>
      </div>

      <ProgressBar
        value={pct}
        size="sm"
        tone={done ? "income" : item.onTrack ? "primary" : "primary"}
        className="mt-3"
        label={`${item.goal.name} progress`}
      />

      <p className="tabular mt-2 text-[12px] font-medium text-ink-soft">
        {done ? "Goal reached" : `${formatMoney(item.remaining, currency)} to go`}
      </p>

      {!done && item.requiredMonthly !== null && item.daysLeft !== null && item.daysLeft > 0 && item.goal.target_date && (
        <p className="mt-1 text-[11.5px] leading-4 text-muted">
          {formatMoney(item.requiredMonthly, currency)} a month to hit {formatDate(item.goal.target_date, "short")}
        </p>
      )}

      {done && item.goal.target_date && (
        <p className="mt-1 flex items-center gap-1 text-[11.5px] text-muted">
          <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
          Reached before {formatMonth(item.goal.target_date, "short")}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
        >
          {selected ? "Hide activity" : "View activity"}
          <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </button>
        <span className="flex items-center gap-3 text-[12px] font-medium">
          <button type="button" onClick={onOpen} className="text-muted hover:text-ink">
            Details
          </button>
          <button type="button" onClick={onEdit} className="text-muted hover:text-ink">
            Edit
          </button>
        </span>
      </div>
    </SurfaceCard>
  );
}
