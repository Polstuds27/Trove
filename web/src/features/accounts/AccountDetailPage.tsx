/**
 * Account detail.
 *
 * One account's whole story: balance and credit utilization, this month's
 * in/out, and the full transaction history. Cards get their statement/due dates
 * surfaced because that is the number people actually check (§24).
 */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Archive,
  ChevronLeft,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  MascotTipCard,
  CardHeader,
  ConfirmOverlay,
  DetailRow,
  EmptyState,
  PageHeader,
  ProgressBar,
  Stat,
  useToast,
  WalletCard,
  walletThemeFor,
} from "../../components/ui";
import { byTxNewest, formatMoney, formatPercent } from "../../design/format";
import { ACCOUNT_TYPE_LABELS } from "../../design/icons";
import { AccountAvatar } from "./AccountAvatar";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import { isLiability, summarize } from "../analytics/engine";
import { periodRange, type Period } from "../analytics/period";
import { updateAccount, toggleBookmark } from "../../db/repositories";
import { AccountHistoryList } from "./AccountHistoryList";

export function AccountDetailPage() {
  // Served by both `/accounts/:accountId` and `/credit-cards/:cardId` — the
  // ledger detail screen is identical, only the section chrome differs.
  const { accountId, cardId } = useParams<{ accountId: string; cardId: string }>();
  const id = accountId ?? cardId ?? "";
  const sectionBase = accountId !== undefined ? "/accounts" : "/credit-cards";
  const navigate = useNavigate();
  const toast = useToast();
  const { lookups, dataset } = useLocalData();
  const { preferences } = usePreferences();

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"all" | "in" | "out">("all");

  const account = lookups.account.get(id) ?? null;

  const period: Period = useMemo(
    () => ({ kind: "month", anchor: new Date(), monthStartDay: preferences.monthStartDay }),
    [preferences.monthStartDay],
  );
  const range = periodRange(period);

  const history = useMemo(
    () =>
      dataset.transactions
        .filter((tx) => tx.from_account_id === id || tx.to_account_id === id)
        .sort(byTxNewest),
    [dataset.transactions, id],
  );

  const filtered = useMemo(() => {
    if (view === "all") return history;
    return history.filter((tx) => (view === "in" ? tx.to_account_id === id : tx.from_account_id === id));
  }, [history, view, id]);

  const month = useMemo(
    () => summarize(history, range, lookups.fx, [id]),
    [history, range, lookups.fx, id],
  );

  if (!account) {
    return (
      <>
        <PageHeader title="Account" />
        <Card>
          <EmptyState
            icon={<Wallet className="h-7 w-7" />}
            title="Account not found"
            description="It may have been deleted on another device, or the link is out of date."
            action={
              <Button variant="primary" onClick={() => navigate(sectionBase)}>
                Back to {sectionBase === "/credit-cards" ? "credit cards" : "accounts"}
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const isCard = account.type === "credit" || account.type === "debit";
  const used = Math.abs(Math.min(0, account.current_balance));
  const utilization = account.credit_limit ? (used / account.credit_limit) * 100 : null;
  const nextStatement = account.statement_day ? nextDayOfMonth(account.statement_day) : null;
  const nextDue = account.due_day ? nextDayOfMonth(account.due_day) : null;

  /**
   * Re-bound after the null guard: TypeScript does not keep the narrowing inside
   * the hoisted `runArchive` declaration, so the closure reads this local.
   */
  const active = account;

  async function runArchive() {
    setBusy(true);
    try {
      if (active.archived) {
        await updateAccount(active.id, { archived: false });
        toast.push({ tone: "success", title: "Account restored" });
      } else {
        await updateAccount(active.id, { archived: true });
        toast.push({ tone: "success", title: "Account archived" });
      }
      setConfirmArchive(false);
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Couldn't update account",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        leading={
          <>
            <button
              type="button"
              aria-label="Back to accounts"
              className="lg:hidden -ml-3 inline-flex h-11 w-11 shrink-0 self-center items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-sunken active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => navigate(sectionBase)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <AccountAvatar account={account} size={40} className="self-center" />
          </>
        }
        title={
          <span className="flex items-center gap-2">
            <span className="truncate">{account.name}</span>
            {account.archived && <Badge tone="neutral">Archived</Badge>}
          </span>
        }
        subtitle={`${account.bank_name ? `${account.bank_name} · ` : ""}${ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · ${account.currency}`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => navigate(`${sectionBase}/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/transactions?add=expense")}
            >
              Add
            </Button>
          </>
        }
      />

      {/* Balance hero (EasyUI WalletCard) beside this month's movement. */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
        <WalletCard
          title={account.name}
          subtitle={`${account.bank_name ? `${account.bank_name} · ` : ""}${ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · ${account.currency}`}
          balance={formatMoney(account.current_balance, account.currency)}
          balanceLabel={isLiability(account.type) ? "Amount owed" : "Current balance"}
          footer={`Opening ${formatMoney(account.opening_balance, account.currency)}`}
          theme={walletThemeFor(account.type)}
          action={{
            label: "Transfer",
            icon: <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />,
            onClick: () => navigate("/transactions?add=transfer"),
          }}
        />
        <Card className="flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pt-5">
            <Stat
              label="In this month"
              tone="income"
              value={formatMoney(month.income, lookups.dataset.baseCurrency)}
            />
            <Stat
              label="Out this month"
              tone="expense"
              value={formatMoney(month.expense, lookups.dataset.baseCurrency)}
            />
          </div>
          <div className="px-5 pb-5 pt-4">
            {month.income + month.expense > 0 ? (
              <>
                {/* Share of this month's movement that came in vs. went out. */}
                <div className="flex h-2 gap-1" aria-hidden="true">
                  {month.income > 0 && <div className="h-full origin-left animate-progress-in rounded-full bg-income" style={{ flex: month.income }} />}
                  {month.expense > 0 && <div className="h-full origin-left animate-progress-in rounded-full bg-expense [animation-delay:80ms]" style={{ flex: month.expense }} />}
                </div>
                <p className="tabular mt-2 text-[12px] text-muted">
                  Net {formatMoney(month.income - month.expense, lookups.dataset.baseCurrency, { signed: true })} this month
                </p>
              </>
            ) : (
              <p className="text-[12px] text-muted">No money in or out of this account yet this month.</p>
            )}
            <p className="mt-1 text-[12px] text-faint">{history.length} transactions in total</p>
          </div>
        </Card>
      </div>

      {isCard && account.credit_limit ? (
        <Card>
            <div className="px-4 py-3.5">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink">Credit used</span>
                <span className="tabular text-sm text-muted">
                  {formatMoney(used, account.currency)} of {formatMoney(account.credit_limit, account.currency)}
                </span>
              </div>
              <ProgressBar
                value={utilization ?? 0}
                tone={(utilization ?? 0) > 80 ? "warning" : "primary"}
                label={`${account.name} credit utilization`}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {formatPercent(utilization ?? 0)} used ·{" "}
                  {formatMoney(Math.max(0, account.credit_limit - used), account.currency)} available
                </span>
              </div>
              {(nextStatement || nextDue) && (
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
                  {nextStatement && (
                    <DetailRow label="Next statement">{nextStatement.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</DetailRow>
                  )}
                  {nextDue && (
                    <DetailRow label="Payment due">{nextDue.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</DetailRow>
                  )}
                </dl>
              )}
            </div>
        </Card>
      ) : null}

      <MascotTipCard
        title="Quick tip"
        lines={[
          "Select an account to see its balance and recent activity.",
          "Use Transfer to move money between your own accounts. It won't count as spending.",
        ]}
        mascotState="accounts"
        storageKey="trove_accounts_tip_dismissed"
        mascotSize={60}
      />

      <CardHeader
        title="History"
        subtitle={`${filtered.length} transactions`}
        action={
          <div className="flex items-center gap-1">
            {(["all", "in", "out"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === key ? "bg-primary-soft-bg text-primary" : "text-muted hover:text-ink"
                }`}
              >
                {key === "all" ? "All" : key === "in" ? "In" : "Out"}
              </button>
            ))}
          </div>
        }
      />
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title={history.length === 0 ? "No transactions on this account yet" : "Nothing matches this filter"}
            description={
              history.length === 0
                ? "Record an expense, income or a transfer to see it here — offline is fine."
                : "Switch back to All to see the full history."
            }
            action={
              history.length === 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate("/transactions?add=expense")}
                >
                  Add transaction
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setView("all")}>
                  Show all
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <AccountHistoryList
          transactions={filtered}
          lookups={lookups}
          onToggleBookmark={(txId) => void toggleBookmark(txId)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Archive className="h-4 w-4" />}
          onClick={() => setConfirmArchive(true)}
        >
          {account.archived ? "Restore account" : "Archive account"}
        </Button>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Accounts with transactions can be archived but not deleted.
        </span>
      </div>

      <ConfirmOverlay
        open={confirmArchive}
        busy={busy}
        tone="primary"
        confirmLabel={account.archived ? "Restore" : "Archive"}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => void runArchive()}
        title={account.archived ? "Restore this account?" : "Archive this account?"}
        message={
          account.archived
            ? `${account.name} will show on your Accounts page and can be used in transactions again.`
            : `${account.name} will be hidden from your default lists. Its history is kept and you can restore it any time.`
        }
      />
    </div>
  );
}

/** Next occurrence of a day-of-month, this month or the following one. */
function nextDayOfMonth(day: number): Date | null {
  const now = new Date();
  const clamped = (year: number, month: number) =>
    new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
  const thisMonth = clamped(now.getFullYear(), now.getMonth());
  return thisMonth >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    ? thisMonth
    : clamped(now.getFullYear(), now.getMonth() + 1);
}
