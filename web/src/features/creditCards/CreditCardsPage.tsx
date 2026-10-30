/**
 * Credit cards.
 *
 * Their own section because the questions differ from a bank account: what have
 * I used, when does the statement close, when is it due. The card visual and the
 * payment-due panel read like a wallet; activity underneath is the same local
 * ledger the rest of the app uses (§25).
 */
import { useMemo, useState } from "react";
import { AccountAvatar } from "../accounts/AccountAvatar";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Landmark, Plus } from "lucide-react";
import {
  Avatar,
  Button,
  EmptyState,
  GlassPanel,
  LinkButton,
  Mascot,
  PageHeader,
  Pill,
  ProgressBar,
  SurfaceCard,
} from "../../components/ui";
import { formatDate, formatMoney, formatPercent, formatRelativeDay } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import { isLiability, summarize } from "../analytics/engine";
import { periodRange, type Period } from "../analytics/period";
import { transactionTitle } from "../transactions/TransactionList";

const CARD_TYPES = new Set(["credit", "debit"]);

/** Next occurrence of a monthly due day, honouring short months. */
function nextDueDate(day: number | null): Date | null {
  if (!day) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inMonth = (year: number, month: number) => {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, last), 12);
  };
  let due = inMonth(today.getFullYear(), today.getMonth());
  if (due.getTime() < today.getTime()) {
    due = inMonth(today.getFullYear(), today.getMonth() + 1);
  }
  return due;
}

function daysUntil(due: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function CreditCardsPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      dataset.accounts
        .filter((account) => CARD_TYPES.has(account.type) && !account.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [dataset.accounts],
  );

  const card = cards.find((item) => item.id === selectedId) ?? cards[0] ?? null;

  const period: Period = useMemo(
    () => ({ kind: "month", anchor: new Date(), monthStartDay: preferences.monthStartDay }),
    [preferences.monthStartDay],
  );
  const range = periodRange(period);

  const cardStats = useMemo(() => {
    if (!card) return { used: 0, limit: 0, percent: 0, monthCharges: 0 };
    const used = Math.abs(Math.min(0, card.current_balance));
    const limit = card.credit_limit ?? 0;
    const summary = summarize(
      dataset.transactions.filter((tx) => tx.from_account_id === card.id),
      range,
      lookups.fx,
      [card.id],
    );
    return {
      used,
      limit,
      percent: limit > 0 ? (used / limit) * 100 : 0,
      monthCharges: summary.expense,
    };
  }, [card, dataset.transactions, range, lookups.fx]);

  const activity = useMemo(() => {
    if (!card) return [];
    return dataset.transactions
      .filter(
        (tx) =>
          !tx.deleted_at &&
          (tx.from_account_id === card.id || tx.to_account_id === card.id),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [card, dataset.transactions]);

  const due = card ? nextDueDate(card.due_day) : null;
  const dueDays = due ? daysUntil(due) : null;

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Credit cards"
        subtitle="Balances and due dates"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/credit-cards/new")}
          >
            Add card
          </Button>
        }
      />

      {ready && cards.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="creditDue"
            title="No credit cards yet"
            description="Add one and Trove tracks its balance, statement day, payment due date and utilization — then shows everything you owe in one place on this screen."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/credit-cards/new")}>
                Add a card
              </Button>
            }
            secondaryAction={<LinkButton to="/accounts">See all accounts</LinkButton>}
          />
        </GlassPanel>
      ) : card ? (
        <>
          {cards.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {cards.map((item) => (
                <Pill
                  key={item.id}
                  active={item.id === card.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  {item.name}
                </Pill>
              ))}
            </div>
          )}

          <div className="grid gap-[17px] lg:grid-cols-2 lg:items-start">
            {/* The card itself, then how much of its limit is in use. */}
            <div className="space-y-[17px]">
              <Link
                to={`/credit-cards/${card.id}`}
                className="relative block overflow-hidden rounded-[28px] bg-primary px-6 py-6 text-primary-contrast shadow-[0_18px_40px_-22px_rgba(41,71,55,0.75)] transition-transform duration-base ease-smooth hover:-translate-y-0.5 sm:px-7 sm:py-7"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <AccountAvatar account={card} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-semibold tracking-[-0.02em]">{card.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-primary-contrast/65">
                      {card.currency}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-primary-contrast">
                    {card.type === "debit" ? "Debit" : "Credit"}
                  </span>
                </div>

                <div className="relative mt-9 sm:mt-12">
                  <p className="text-[11.5px] font-medium text-primary-contrast/65">Balance</p>
                  <p className="tabular mt-1 text-[36px] font-bold leading-none tracking-[-0.04em] sm:text-[44px]">
                    {formatMoney(Math.abs(Math.min(0, card.current_balance)), card.currency)}
                  </p>
                </div>

                <div className="relative mt-7 flex items-end justify-between gap-3 text-[11.5px] text-primary-contrast/70">
                  <span className="tabular tracking-[0.18em]">•••• •••• ••••</span>
                  <span>
                    {card.statement_day ? `Statement day ${card.statement_day}` : "Trove card"}
                  </span>
                </div>
              </Link>

              <SurfaceCard className="p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-ink">Credit used</h2>
                  <span className="tabular text-[13px] text-muted">
                    {cardStats.limit > 0
                      ? `${formatPercent(cardStats.percent)} of ${formatMoney(cardStats.limit, card.currency)}`
                      : "No limit set"}
                  </span>
                </div>
                <p className="tabular mt-3 text-[28px] font-bold leading-none tracking-[-0.03em] text-primary">
                  {formatMoney(cardStats.used, card.currency)}
                </p>
                <ProgressBar
                  value={cardStats.percent}
                  tone={cardStats.percent > 80 ? "warning" : "primary"}
                  className="mt-4"
                  label={`${card.name} credit utilization`}
                />
                <p className="mt-2 text-[12px] text-muted">
                  {cardStats.monthCharges > 0
                    ? `${formatMoney(cardStats.monthCharges, card.currency)} charged this month`
                    : "No charges this month yet"}
                  {card.credit_limit
                    ? ` · ${formatMoney(Math.max(0, cardStats.limit - cardStats.used), card.currency)} available`
                    : ""}
                </p>
              </SurfaceCard>
            </div>

            {/* Payment due and the latest activity. */}
            <div className="space-y-[17px]">
              <GlassPanel className="relative overflow-hidden px-5 py-5 sm:px-6">
                <div className="relative z-10 max-w-[68%]">
                  <p className="trove-eyebrow">Payment due</p>
                  {due ? (
                    <>
                      <p className="tabular mt-1.5 text-[34px] font-bold leading-none tracking-[-0.035em] text-primary">
                        {formatDate(due, "short")}
                      </p>
                      <p className={`mt-2 text-[12.5px] ${dueDays !== null && dueDays <= 5 ? "text-warning" : "text-muted"}`}>
                        {dueDays !== null && dueDays <= 0
                          ? "Due today"
                          : `In ${dueDays ?? 0} ${dueDays === 1 ? "day" : "days"}`}
                        <span className="px-1 text-faint">·</span>
                        <span className="font-semibold text-ink-soft">
                          {formatMoney(cardStats.used, card.currency)}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em] text-primary">
                        Not scheduled
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-5 text-muted">
                        Add a due day to see the next payment date here.
                      </p>
                    </>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/credit-cards/${card.id}/edit`)}
                    >
                      Edit card
                    </Button>
                    <Link
                      to={`/credit-cards/${card.id}`}
                      className="text-[12px] font-semibold text-primary hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                </div>
                <div className="pointer-events-none absolute -bottom-3 right-0 sm:right-2">
                  <Mascot state="creditDue" size={150} className="sm:hidden" />
                  <Mascot state="creditDue" size={190} className="hidden sm:block" />
                </div>
              </GlassPanel>

              <SurfaceCard className="overflow-hidden">
                <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
                  <h2 className="text-[15px] font-semibold text-ink">Card activity</h2>
                  <Link
                    to={`/credit-cards/${card.id}`}
                    className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary hover:underline"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {activity.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[12.5px] text-muted sm:px-6">
                    No activity on this card yet. Every swipe you record shows up here.
                  </p>
                ) : (
                  <ul className="trove-hairline-list px-5 sm:px-6">
                    {activity.map((tx) => {
                      const outgoing = tx.from_account_id === card.id;
                      const category = tx.category_id
                        ? lookups.category.get(tx.category_id)?.name
                        : null;
                      return (
                        <li key={tx.id}>
                          <Link
                            to={`/transactions/${tx.id}`}
                            className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                          >
                            <Avatar name={transactionTitle(tx, lookups)} size={34} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-semibold text-ink">
                                {transactionTitle(tx, lookups)}
                              </span>
                              <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                                {category ? `${category} · ` : ""}
                                {formatRelativeDay(tx.date)}
                              </span>
                            </span>
                            <span
                              className={`tabular shrink-0 text-[13px] font-semibold ${
                                outgoing ? "text-expense" : "text-income"
                              }`}
                            >
                              {outgoing ? "−" : "+"}
                              {formatMoney(Math.abs(tx.amount), tx.currency)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SurfaceCard>
            </div>
          </div>

          {dataset.accounts.some(
            (account) => isLiability(account.type) && !CARD_TYPES.has(account.type),
          ) && (
            <SurfaceCard className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Landmark aria-hidden="true" className="h-4 w-4 text-muted" />
                  <h2 className="text-[15px] font-semibold text-ink">Loan accounts</h2>
                </div>
                <LinkButton to="/accounts">Open accounts</LinkButton>
              </div>
              <ul className="trove-hairline-list">
                {dataset.accounts
                  .filter((account) => isLiability(account.type) && !CARD_TYPES.has(account.type))
                  .map((account) => (
                    <li key={account.id}>
                      <Link to={`/accounts/${account.id}`} className="trove-row">
                        <AccountAvatar account={account} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-ink">
                            {account.name}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-muted">
                            {account.currency}
                          </span>
                        </span>
                        <span className="tabular shrink-0 text-[13px] font-semibold text-expense">
                          {formatMoney(Math.abs(account.current_balance), account.currency)}
                        </span>
                        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                      </Link>
                    </li>
                  ))}
              </ul>
            </SurfaceCard>
          )}
        </>
      ) : null}
    </div>
  );
}
