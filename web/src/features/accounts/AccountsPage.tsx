/**
 * Accounts — where the money lives.
 *
 * Desktop keeps a live account list beside the selected account's balance and
 * recent activity. Mobile tells the same story in one column: a glass total,
 * then the account rows. Tapping a row on mobile opens the routed detail
 * screen; on desktop it swaps the right-hand panel. Creating, editing,
 * archiving and deleting all still use the existing routes and repository.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive,
  ChevronRight,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmOverlay,
  MascotTipCard,
  Dropdown,
  GlassPanel,
  LinkButton,
  PageHeader,
  ProgressBar,
  SurfaceCard,
  useToast,
} from "../../components/ui";
import { Mascot } from "../../components/ui";
import { AccountAvatar } from "./AccountAvatar";
import type { LocalAccount, LocalTransaction } from "../../db/types";
import { byTxNewest, formatMoney, formatPercent, formatRelativeDay } from "../../design/format";
import { ACCOUNT_TYPE_LABELS, accountIcon, categoryIcon } from "../../design/icons";
import { deleteAccount, updateAccount } from "../../db/repositories";
import { useLocalData } from "../analytics/useLocalData";
import {
  accountTotals,
  isLiability,
  portfolio,
  type AccountTotals,
} from "../analytics/engine";
import { periodRange, type Period } from "../analytics/period";
import { usePreferences } from "../settings/preferences";
import { transactionTitle } from "../transactions/TransactionList";

export function AccountsPage() {
  const { lookups, ready } = useLocalData();
  const { preferences, update } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LocalAccount | null>(null);
  const [busy, setBusy] = useState(false);


  const period: Period = useMemo(
    () => ({ kind: "month", anchor: new Date(), monthStartDay: preferences.monthStartDay }),
    [preferences.monthStartDay],
  );
  const range = periodRange(period);

  const totals = useMemo(
    () => accountTotals(lookups.dataset, lookups, range),
    [lookups, range],
  );
  const summary = useMemo(() => portfolio(lookups), [lookups]);

  const visible = useMemo(() => {
    const list = preferences.showArchived ? totals : totals.filter((t) => !t.account.archived);
    return [...list].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [totals, preferences.showArchived]);

  const selected = visible.find((item) => item.account.id === selectedId) ?? visible[0] ?? null;

  const recent = useMemo(() => {
    if (!selected) return [];
    return lookups.dataset.transactions
      .filter(
        (tx) =>
          tx.from_account_id === selected.account.id ||
          tx.to_account_id === selected.account.id,
      )
      .sort(byTxNewest)
      .slice(0, 4);
  }, [lookups.dataset.transactions, selected]);

  const archivedCount = totals.filter((t) => t.account.archived).length;
  const currency = lookups.dataset.baseCurrency;

  // Creating and editing go through the routed editor so the URL always says
  // which screen is open and the browser Back button closes it.
  const openCreate = () => navigate("/accounts/new");
  const openEdit = (account: LocalAccount) => navigate(`/accounts/${account.id}/edit`);

  async function toggleArchive(account: LocalAccount) {
    await updateAccount(account.id, { archived: !account.archived });
    toast.push({
      tone: "success",
      title: account.archived ? "Account restored" : "Account archived",
      description: account.archived
        ? "It will show on your Accounts page again."
        : "History is kept — it just leaves your default lists.",
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteAccount(pendingDelete.id);
      toast.push({ tone: "success", title: "Account deleted" });
      setPendingDelete(null);
      setSelectedId(null);
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Couldn't delete account",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Accounts"
        subtitle="Where your money lives"
        actions={
          <>
            {archivedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void update({ showArchived: !preferences.showArchived })}
              >
                {preferences.showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add account
            </Button>
          </>
        }
      />

      {!ready ? (
        <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
          <div className="trove-card h-[380px] animate-pulse" />
          <div className="trove-card hidden h-[380px] animate-pulse lg:block" />
        </div>
      ) : visible.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <Mascot state="accountsEmpty" size={150} />
            <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-ink">
              No accounts yet
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              Add the cash, bank and card accounts you actually use. Trove recalculates
              balances from your transactions, so an accurate opening balance is all it
              needs.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add your first account
              </Button>
              <Button variant="ghost" onClick={() => navigate("/settings/currency")}>
                Change base currency
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : (
        <>
          {/* Mobile hero: total across every visible account. */}
          <GlassPanel className="relative overflow-hidden px-5 py-5 lg:hidden">
            <div className="relative z-10 max-w-[64%]">
              <p className="text-[12px] font-medium text-muted">
                Total assets · {visible.length} {visible.length === 1 ? "account" : "accounts"}
              </p>
              <p className="tabular mt-1.5 text-[36px] font-bold leading-none tracking-[-0.035em] text-primary">
                {formatMoney(summary.assets, currency)}
              </p>
              <p className="mt-2 text-[12px] text-muted">
                {formatMoney(summary.netWorth, currency)} net worth
              </p>
            </div>
            <div className="pointer-events-none absolute -bottom-2 right-0">
              <Mascot state="accounts" size={132} />
            </div>
          </GlassPanel>

          <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)] lg:items-start">
            {/* Account list — the left card on desktop, the only card on mobile. */}
            <SurfaceCard className="overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
                <h2 className="text-[15px] font-semibold text-ink">
                  {visible.length} {visible.length === 1 ? "account" : "accounts"}
                </h2>
                <span className="tabular text-[13px] text-muted">
                  Assets {formatMoney(summary.assets, currency)}
                </span>
              </div>
              <div className="trove-hairline-list">
                {visible.map((item) => (
                  <div key={item.account.id} className="flex items-center">
                    <AccountRowMain
                      item={item}
                      currency={currency}
                      selected={selected?.account.id === item.account.id}
                      onSelect={() => {
                        if (window.innerWidth >= 1024) setSelectedId(item.account.id);
                        else navigate(`/accounts/${item.account.id}`);
                      }}
                    />
                    <div className="pr-3">
                      <AccountMenu
                        account={item.account}
                        onOpen={() => navigate(`/accounts/${item.account.id}`)}
                        onEdit={() => openEdit(item.account)}
                        onToggleArchive={() => void toggleArchive(item.account)}
                        onDelete={() => setPendingDelete(item.account)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line/70 px-5 py-3 sm:px-6">
                <LinkButton to="/accounts/new" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add another account
                </LinkButton>
                {archivedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void update({ showArchived: !preferences.showArchived })}
                    className="text-[12px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    {preferences.showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
                  </button>
                )}
              </div>
            </SurfaceCard>

            <div className="lg:hidden">
              <MascotTipCard
                title="Quick tip"
                lines={[
                  "Select an account to see its balance and recent activity.",
                  "Use Transfer to move money between your own accounts. It won't count as spending.",
                ]}
                mascotState="accounts"
                storageKey="trove_accounts_tip_dismissed"
              />
            </div>

            {/* Desktop selected account. */}
            <div className="hidden space-y-4 lg:block">
              <SurfaceCard className="overflow-hidden">
                {selected ? (
                  <>
                    <div className="border-b border-line/70 p-6">
                      <AccountAvatar account={selected.account} size={44} className="mb-3" />
                      <p className="trove-eyebrow">
                        {ACCOUNT_TYPE_LABELS[selected.account.type] ?? selected.account.type}
                      </p>
                      <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.02em] text-ink">
                        {selected.account.name}
                      </h2>
                      <p className="tabular mt-3 text-[40px] font-bold leading-none tracking-[-0.035em] text-primary">
                        {formatMoney(selected.balance, currency)}
                      </p>
                      <p className="mt-2 text-[12px] text-muted">
                        {selected.account.currency !== currency
                          ? `${formatMoney(selected.account.current_balance, selected.account.currency)} in account currency`
                          : "Current balance"}
                        {selected.account.archived ? " · Archived" : ""}
                      </p>

                      {selected.creditLimit !== null && selected.utilization !== null && (
                        <div className="mt-4">
                          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
                            <span className="text-muted">Credit used</span>
                            <span className="tabular text-ink-soft">
                              {formatMoney(selected.creditUsed ?? 0, currency)} of{" "}
                              {formatMoney(selected.creditLimit, currency)} ·{" "}
                              {formatPercent(selected.utilization)}
                            </span>
                          </div>
                          <ProgressBar
                            value={selected.utilization}
                            size="sm"
                            tone={selected.utilization > 80 ? "warning" : "primary"}
                            label={`${selected.account.name} credit utilization`}
                          />
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/transactions?add=transfer")}
                        >
                          Transfer
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => openEdit(selected.account)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[14px] font-semibold text-ink">Recent activity</h3>
                        <Link
                          to={`/accounts/${selected.account.id}`}
                          className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary hover:underline"
                        >
                          View all <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      {recent.length === 0 ? (
                        <p className="mt-4 text-[13px] leading-5 text-muted">
                          No activity on this account yet. Add a transaction and it will show
                          up here.
                        </p>
                      ) : (
                        <ul className="mt-1.5 divide-y divide-line/70">
                          {recent.slice(0, 3).map((tx) => (
                            <RecentRow
                              key={tx.id}
                              transaction={tx}
                              accountId={selected.account.id}
                              lookups={lookups}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-[13px] text-muted">
                    Select an account to see its balance and activity.
                  </div>
                )}
              </SurfaceCard>

              <MascotTipCard
                title="Quick tip"
                lines={[
                  "Select an account to see its balance and recent activity.",
                  "Use Transfer to move money between your own accounts. It won't count as spending.",
                ]}
                mascotState="accounts"
                storageKey="trove_accounts_tip_dismissed"
                mascotSize={96}
              />
            </div>
          </div>
        </>
      )}

      <ConfirmOverlay
        open={pendingDelete !== null}
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete this account?"
        confirmLabel="Delete account"
        message={
          <>
            <strong>{pendingDelete?.name}</strong> will be removed from this device and your
            other devices. Accounts with transactions can only be archived.
          </>
        }
      />
    </div>
  );
}

/** The main clickable part of an account row. */
function AccountRowMain({
  item,
  currency,
  selected,
  onSelect,
}: {
  item: AccountTotals;
  currency: string;
  selected: boolean;
  /** When present the row behaves as a desktop selector; otherwise it links. */
  onSelect?: () => void;
}) {
  const account = item.account;
  const Icon = accountIcon(account.type);
  const isCard = account.type === "credit" || account.type === "debit";
  const liability = isLiability(account.type);
  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] ?? account.type;
  const meta =
    item.creditLimit !== null && item.utilization !== null
      ? `${typeLabel} · ${formatPercent(item.utilization)}`
      : account.currency === currency
        ? typeLabel
        : `${typeLabel} · ${account.currency}`;

  const body = (
    <>
      <AccountAvatar account={account} size={40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold leading-5 text-ink">
            {account.name}
          </span>
          {account.archived && <Badge tone="neutral">Archived</Badge>}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-muted">
          {isCard ? (
            <CreditCard aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          )}
          {meta}
        </span>
      </span>
      <span
        className={`tabular shrink-0 text-right text-[15px] font-semibold ${
          liability ? "text-expense" : "text-ink"
        }`}
      >
        {formatMoney(item.balance, currency)}
      </span>
      {!onSelect && <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />}
    </>
  );

  const className = `trove-row group min-w-0 flex-1 text-left ${
    selected ? "bg-primary-soft-bg/50" : ""
  }`;

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className}>
        {body}
      </button>
    );
  }

  return (
    <Link to={`/accounts/${account.id}`} className={className}>
      {body}
    </Link>
  );
}

function AccountMenu({
  account,
  onOpen,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  account: LocalAccount;
  onOpen: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <Dropdown
      label={`Actions for ${account.name}`}
      trigger={<MoreHorizontal className="h-5 w-5" />}
      items={[
        {
          id: "open",
          label: "View history",
          icon: <ChevronRight aria-hidden="true" className="h-4 w-4" />,
          onSelect: onOpen,
        },
        {
          id: "edit",
          label: "Edit",
          icon: <Pencil aria-hidden="true" className="h-4 w-4" />,
          onSelect: onEdit,
        },
        {
          id: "archive",
          label: account.archived ? "Restore" : "Archive",
          icon: <Archive aria-hidden="true" className="h-4 w-4" />,
          onSelect: onToggleArchive,
        },
        {
          id: "delete",
          label: "Delete",
          tone: "danger",
          icon: <Trash2 aria-hidden="true" className="h-4 w-4" />,
          onSelect: onDelete,
        },
      ]}
    />
  );
}

/** A compact recent-activity line inside the selected account card. */
function RecentRow({
  transaction,
  accountId,
  lookups,
}: {
  transaction: LocalTransaction;
  accountId: string;
  lookups: ReturnType<typeof useLocalData>["lookups"];
}) {
  const title = transactionTitle(transaction, lookups);
  const categoryObj = transaction.category_id ? lookups.category.get(transaction.category_id) : null;
  const Icon = categoryIcon(categoryObj?.icon ?? null, categoryObj?.name);
  const incoming = transaction.to_account_id === accountId;
  const sign = transaction.type === "transfer" ? "" : incoming ? "+" : "−";
  const tone =
    transaction.type === "transfer" ? "text-transfer" : incoming ? "text-income" : "text-expense";

  return (
    <li>
      <Link
        to={`/transactions/${transaction.id}`}
        className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{title}</span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            {formatRelativeDay(transaction.date)}
          </span>
        </span>
        <span className={`tabular shrink-0 text-[14px] font-semibold ${tone}`}>
          {sign}
          {formatMoney(Math.abs(transaction.amount), transaction.currency)}
        </span>
      </Link>
    </li>
  );
}
