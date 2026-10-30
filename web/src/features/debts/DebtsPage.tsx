/**
 * Debts & receivables.
 *
 * Two lists, never mixed: money you owe and money owed to you. Both are visible
 * at once so neither side can hide, and selecting a person shows their payment
 * history underneath. Nothing here is income or expense, so a borrowed sum can
 * never inflate a report (§27).
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import {
  Avatar,
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  PageHeader,
  SurfaceCard,
} from "../../components/ui";
import { formatDate, formatMoney, formatPercent } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { debtSummary, type DebtSummary } from "../analytics/engine";

export function DebtsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const navigate = useNavigate();

  const summary = useMemo(
    () => debtSummary(dataset.debts, dataset.transactions, lookups),
    [dataset.debts, dataset.transactions, lookups],
  );

  const currency = lookups.dataset.baseCurrency;
  const owed = summary.filter((item) => item.debt.direction === "i_owe");
  const receivable = summary.filter((item) => item.debt.direction === "owed_to_me");

  /** Raw remainders; every debt keeps its own currency. */
  const sumRemaining = (rows: DebtSummary[]) =>
    rows.reduce((total, item) => total + item.debt.remaining_amount, 0);

  const outstanding = sumRemaining(owed);
  const receivableTotal = sumRemaining(receivable);

  /** The history card follows the last selected person, defaulting to the first debt. */
  const firstWithPayments =
    summary.find((item) => item.payments.length > 0) ?? summary[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = summary.find((item) => item.debt.id === selectedId) ?? firstWithPayments;

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Debts"
        subtitle="Money owed to you and by you"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/debts/new")}
          >
            New debt
          </Button>
        }
      />

      {ready && dataset.debts.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="creditDue"
            title="No debts recorded"
            description="Whether it's a credit-card balance, a friend you'll repay, or money someone owes you, keeping it here means the total is always visible instead of lurking in the back of your mind."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/debts/new")}>
                Record one
              </Button>
            }
            secondaryAction={<LinkButton to="/credit-cards">Open credit cards</LinkButton>}
          />
        </GlassPanel>
      ) : (
        <>
          <div className="grid gap-[17px] lg:grid-cols-2">
            <DebtColumn
              title="Owed to you"
              empty="Nobody owes you anything right now."
              total={receivableTotal}
              currency={currency}
              rows={receivable}
              onSelect={setSelectedId}
              onEdit={(id) => navigate(`/debts/${id}/edit`)}
            />
            <DebtColumn
              title="You owe"
              empty="Nothing to repay right now."
              total={outstanding}
              currency={currency}
              rows={owed}
              onSelect={setSelectedId}
              onEdit={(id) => navigate(`/debts/${id}/edit`)}
            />
          </div>

          <section className="min-w-0">
            <div className="mb-2 flex items-end justify-between gap-3 px-1 lg:hidden">
              <h2 className="min-w-0 text-[16px] font-semibold leading-6 text-ink">
                Payment history
                {selected ? (
                  <span className="font-normal text-muted"> · {selected.debt.counterparty}</span>
                ) : null}
              </h2>
              {selected && (
                <span className="tabular shrink-0 text-right text-[13px] font-bold text-primary">
                  {formatMoney(selected.debt.remaining_amount, selected.debt.currency)}
                </span>
              )}
            </div>

            <SurfaceCard className="overflow-hidden">
            <div className="hidden flex-wrap items-baseline justify-between gap-2 border-b border-line/70 px-5 py-4 sm:px-6 lg:flex">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-ink">
                  Payment history
                  {selected ? (
                    <span className="font-normal text-muted"> · {selected.debt.counterparty}</span>
                  ) : null}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {selected?.payments.length
                    ? `${selected.payments.length} payment${selected.payments.length === 1 ? "" : "s"} recorded`
                    : "Payments appear here as they're recorded"}
                </p>
              </div>
              {selected && (
                <span className="shrink-0 text-right">
                  <span className="block text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
                    Remaining
                  </span>
                  <span className="tabular mt-0.5 block text-[18px] font-bold tracking-[-0.02em] text-primary">
                    {formatMoney(selected.debt.remaining_amount, selected.debt.currency)}
                  </span>
                </span>
              )}
            </div>

            {!selected || selected.payments.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] font-medium text-ink">No payments yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-5 text-muted">
                  Record a repayment as a transfer linked to this debt and it will show up here,
                  with the remaining balance updated automatically.
                </p>
                {selected && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/debts/${selected.debt.id}`)}
                  >
                    Open debt
                  </Button>
                )}
              </div>
            ) : (
              <ul className="trove-hairline-list px-5 sm:px-6">
                {selected.payments.slice(0, 8).map((tx) => {
                  const received = selected.debt.direction === "owed_to_me";
                  return (
                    <li key={tx.id}>
                      <Link
                        to={`/transactions/${tx.id}`}
                        className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            received
                              ? "bg-sage-light text-primary dark:bg-primary-soft"
                              : "bg-peach text-clay dark:bg-white/10 dark:text-accent"
                          }`}
                        >
                          {received ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-ink">
                            {tx.notes || (received ? "Payment received" : "Repayment made")}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-muted">
                            {formatDate(tx.date, "medium")}
                          </span>
                        </span>
                        <span
                          className={`tabular shrink-0 text-[13px] font-semibold ${
                            received ? "text-income" : "text-expense"
                          }`}
                        >
                          {received ? "+" : "−"}
                          {formatMoney(Math.abs(tx.amount), tx.currency)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            </SurfaceCard>
          </section>
        </>
      )}
    </div>
  );
}

function DebtColumn({
  title,
  empty,
  total,
  currency,
  rows,
  onSelect,
  onEdit,
}: {
  title: string;
  empty: string;
  total: number;
  currency: string;
  rows: DebtSummary[];
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1 lg:hidden">
        <h2 className="text-[16px] font-semibold leading-6 text-ink">{title}</h2>
        <span className="tabular text-[13px] font-semibold text-ink-soft">
          {formatMoney(total, currency)}
        </span>
      </div>

      <SurfaceCard className="flex flex-col overflow-hidden">
      <div className="hidden items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6 lg:flex">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <span className="tabular text-[13px] font-semibold text-ink-soft">
          {formatMoney(total, currency)}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-[12.5px] leading-5 text-muted sm:px-6">{empty}</p>
      ) : (
        <ul className="trove-hairline-list">
          {rows.map((item) => {
            const { debt } = item;
            const iOwe = debt.direction === "i_owe";
            const meta = debt.due_date
              ? item.overdue && item.daysUntilDue !== null
                ? `Overdue by ${Math.abs(item.daysUntilDue)} ${Math.abs(item.daysUntilDue) === 1 ? "day" : "days"}`
                : item.daysUntilDue === 0
                  ? "Due today"
                  : item.daysUntilDue !== null
                    ? `Due in ${item.daysUntilDue} ${item.daysUntilDue === 1 ? "day" : "days"}`
                    : `Due ${formatDate(debt.due_date, "medium")}`
              : debt.notes || `Added ${formatDate(debt.created_at, "medium")}`;
            return (
              <li key={debt.id} className="group flex items-center">
                <button
                  type="button"
                  onClick={() => onSelect(debt.id)}
                  className="trove-row min-w-0 flex-1 text-left"
                  title={`Show ${debt.counterparty}'s payment history`}
                >
                  <Avatar name={debt.counterparty} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14.5px] font-semibold leading-5 text-ink">
                        {debt.counterparty}
                      </span>
                      {item.overdue && (
                        <span className="rounded-full bg-expense-soft px-1.5 py-0.5 text-[10px] font-semibold text-expense">
                          Overdue
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[11.5px] ${
                        item.overdue ? "text-expense" : "text-muted"
                      }`}
                    >
                      {meta}
                      {debt.notes && debt.due_date ? ` · ${debt.notes}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`tabular block text-[14px] font-semibold ${
                        iOwe ? "text-expense" : "text-income"
                      }`}
                    >
                      {formatMoney(debt.remaining_amount, debt.currency)}
                    </span>
                    <span className="tabular mt-0.5 block text-[10.5px] text-faint">
                      {formatPercent(item.percent)} settled
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1 pr-3">
                  <button
                    type="button"
                    onClick={() => onEdit(debt.id)}
                    className="rounded-full px-2 py-1 text-[11px] font-medium text-muted opacity-0 transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                  <Link
                    to={`/debts/${debt.id}`}
                    aria-label={`Open ${debt.counterparty}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-surface-sunken hover:text-ink"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 px-5 py-3 sm:px-6">
        <LinkButton to="/debts/new" className="gap-1 text-[12px]">
          <Plus className="h-3.5 w-3.5" /> Add debt
        </LinkButton>
        {rows.length > 0 && (
          <span className="text-[11px] text-muted">
            {rows.length} open
          </span>
        )}
      </div>
      </SurfaceCard>
    </section>
  );
}
