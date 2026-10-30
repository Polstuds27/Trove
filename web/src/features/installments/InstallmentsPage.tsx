/**
 * Installment plans.
 *
 * A plan shows what was bought, how many parts are left, and how much is still
 * to pay. The schedule and the paid markers both come from the ledger, so an
 * offline-recorded payment is reflected the moment it is entered (§23).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  Mascot,
  PageHeader,
  ProgressBar,
  StatusBadge,
  SurfaceCard,
} from "../../components/ui";
import { formatDate, formatMoney, formatPercent } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { installmentProgress, type InstallmentProgress } from "../analytics/engine";

const CADENCE: Record<string, { unit: string }> = {
  weekly: { unit: "week" },
  monthly: { unit: "month" },
  quarterly: { unit: "quarter" },
};

export function InstallmentsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const plans = useMemo(
    () => installmentProgress(dataset.installments, dataset.transactions, lookups),
    [dataset.installments, dataset.transactions, lookups],
  );

  const selected = plans.find((item) => item.plan.id === selectedId) ?? plans[0] ?? null;

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Installments"
        subtitle="Schedules and progress"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/installments/new")}
          >
            New plan
          </Button>
        }
      />

      {ready && plans.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="installments"
            title="No installment plans yet"
            description="Bought something on a payment plan? Record it once and Trove tracks every part — how many are left, what each costs, and when the next one is due."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => navigate("/installments/new")}
              >
                Create a plan
              </Button>
            }
            secondaryAction={<LinkButton to="/calendar">Open the calendar</LinkButton>}
          />
        </GlassPanel>
      ) : (
        <>
          <div className="grid gap-[17px] sm:grid-cols-2">
            {plans.map((item) => (
              <PlanCard
                key={item.plan.id}
                item={item}
                selected={selected?.plan.id === item.plan.id}
                onSelect={() => setSelectedId(item.plan.id)}
                onOpen={() => navigate(`/installments/${item.plan.id}`)}
                onEdit={() => navigate(`/installments/${item.plan.id}/edit`)}
              />
            ))}
          </div>

          {selected && <ScheduleCard item={selected} />}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <LinkButton to="/installments/new" className="gap-1">
              <Plus className="h-4 w-4" /> Add another plan
            </LinkButton>
            <LinkButton to="/calendar">Open the calendar</LinkButton>
          </div>

          <div className="flex justify-end pr-2 sm:pr-8">
            <Mascot state="installments" size={150} className="sm:hidden" />
            <Mascot state="installments" size={188} className="hidden sm:block" />
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({
  item,
  selected,
  onSelect,
  onOpen,
  onEdit,
}: {
  item: InstallmentProgress;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const { plan } = item;
  const done = item.remainingParts === 0;
  const cadence = CADENCE[plan.frequency] ?? CADENCE.monthly;
  const remaining = Math.max(0, plan.total_amount - item.paidAmount);

  return (
    <SurfaceCard
      className={`flex flex-col p-5 transition-shadow sm:p-6 ${
        selected ? "ring-1 ring-primary/35" : ""
      }`}
    >
      <button type="button" onClick={onSelect} className="text-left">
        <p className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[16px] font-semibold leading-6 text-ink">
            {plan.notes || "Installment plan"}
          </span>
          <span className="shrink-0 text-[11.5px] text-muted">
            {plan.parts_count} {plan.frequency === "weekly" ? "weeks" : plan.frequency === "quarterly" ? "quarters" : "months"}
            <span className="px-1 text-faint">·</span>
            {formatMoney(plan.total_amount, plan.currency)}
          </span>
        </p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="tabular text-[36px] font-bold leading-none tracking-[-0.04em] text-primary sm:text-[42px]">
            {formatMoney(item.partAmount, plan.currency)}
          </span>
          <span className="text-[12px] text-muted">/ {cadence.unit}</span>
        </div>

        <ProgressBar
          value={Math.min(100, Math.max(0, item.percent))}
          tone={done ? "income" : "primary"}
          className="mt-4"
          label={`${plan.notes || "Installment"} repayment progress`}
        />

        <p className="tabular mt-2 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
          <span>
            {item.paidParts} of {plan.parts_count} paid
          </span>
          <span className="text-faint">·</span>
          <span className={`font-semibold ${done ? "text-income" : "text-ink-soft"}`}>
            {done ? "Fully paid" : `${formatMoney(remaining, plan.currency)} remaining`}
          </span>
          {!done && item.nextDueDate && (
            <>
              <span className="text-faint">·</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                Next {formatDate(item.nextDueDate, "short")}
              </span>
            </>
          )}
        </p>
      </button>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-3">
        <button
          type="button"
          onClick={onSelect}
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          {selected ? "Schedule shown below" : "View schedule"}
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

function ScheduleCard({ item }: { item: InstallmentProgress }) {
  const { plan } = item;
  const nextIndex = item.schedule.findIndex((part) => !part.paid);

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-semibold leading-6 text-ink">
            {plan.notes || "Installment"} schedule
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {formatPercent(item.percent)} paid · {formatMoney(Math.max(0, plan.total_amount - item.paidAmount), plan.currency)} remaining
          </p>
        </div>
        <LinkButton to={`/installments/${plan.id}`} className="shrink-0 text-[12px]">
          Details
        </LinkButton>
      </div>

      <ul className="divide-y divide-line/70 px-5 sm:px-6">
        {item.schedule.map((part) => {
          const status: "paid" | "next" | "upcoming" = part.paid
            ? "paid"
            : part.index === nextIndex
              ? "next"
              : "upcoming";
          return (
            <li
              key={part.index}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5"
            >
              <span className="text-[12.5px] text-muted">
                <span className="hidden sm:inline">Part {part.index + 1} · </span>
                {formatDate(part.date, "medium")}
              </span>
              <StatusBadge status={status} />
              <span className="tabular text-right text-[13px] font-semibold text-ink">
                {formatMoney(part.amount, plan.currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </SurfaceCard>
  );
}
