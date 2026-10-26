/**
 * Transactions — the ledger.
 *
 * Desktop keeps the overview and the selected record side by side (master /
 * detail). Mobile groups rows by day and opens the record in a bottom sheet.
 * Search, period, account, category, type and bookmark filters all survive.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmOverlay,
  DetailRow,
  EmptyState,
  IconButton,
  Overlay,
  PageHeader,
  Pill,
  SearchInput,
  Select,
  SurfaceCard,
  useToast,
} from "../../components/ui";
import { byTxNewest, formatDateTime, formatMoney, formatMonth, formatRelativeDay } from "../../design/format";
import type { LocalTransaction } from "../../db/types";
import { deleteTransaction, toggleBookmark } from "../../db/repositories";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";
import { summarize } from "../analytics/engine";
import {
  periodRange,
  rangeLabel,
  shiftPeriod,
  type Period,
  type PeriodKind,
} from "../analytics/period";
import {
  dayTotals,
  groupByDay,
  transactionAccounts,
  transactionTitle,
} from "./TransactionList";

type TypeFilter = "all" | "income" | "expense" | "transfer" | "bookmarked";

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
  { id: "transfer", label: "Transfer" },
];

const PERIOD_KINDS: { id: PeriodKind; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
  { id: "all", label: "All time" },
];

export function TransactionsPage() {
  const { lookups, dataset } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const toast = useToast();

  const [kind, setKind] = useState<PeriodKind>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const period: Period = useMemo(
    () => ({ kind, anchor, monthStartDay: preferences.monthStartDay }),
    [kind, anchor, preferences.monthStartDay],
  );
  const range = periodRange(period);

  const activeFilterCount =
    (accountId ? 1 : 0) +
    (categoryId ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (query ? 1 : 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return dataset.transactions
      .filter((tx) => {
        if (range && (new Date(tx.date) < range.start || new Date(tx.date) >= range.end)) return false;
        if (typeFilter === "bookmarked") {
          if (!tx.is_bookmarked) return false;
        } else if (typeFilter !== "all" && tx.type !== typeFilter) {
          return false;
        }
        if (accountId && tx.from_account_id !== accountId && tx.to_account_id !== accountId) return false;
        if (categoryId) {
          const root = tx.category_id ? lookups.categoryRoot.get(tx.category_id) ?? tx.category_id : null;
          if (root !== categoryId && tx.category_id !== categoryId) return false;
        }
        if (needle) {
          const category = tx.category_id ? lookups.category.get(tx.category_id)?.name ?? "" : "";
          const haystack = [tx.notes, category, transactionAccounts(tx, lookups)].join(" ").toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort(byTxNewest);
  }, [dataset.transactions, range, typeFilter, accountId, categoryId, query, lookups]);

  const summary = useMemo(() => summarize(filtered, null, lookups.fx), [filtered, lookups.fx]);

  const accounts = useMemo(
    () => [...dataset.accounts].sort((a, b) => a.name.localeCompare(b.name)),
    [dataset.accounts],
  );
  const categories = useMemo(
    () =>
      [...dataset.categories]
        .filter((category) => !category.parent_id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [dataset.categories],
  );

  const selected = filtered.find((tx) => tx.id === selectedId) ?? filtered[0] ?? null;
  const periodLabel = kind === "month" ? formatMonth(anchor) : rangeLabel(range, kind);

  function clearFilters() {
    setTypeFilter("all");
    setAccountId("");
    setCategoryId("");
    setQuery("");
    setKind("month");
    setAnchor(new Date());
  }

  const stepPeriod = (direction: -1 | 1) => setAnchor(shiftPeriod(period, direction).anchor);

  async function runDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteTransaction(selected.id);
      toast.push({ tone: "success", title: "Transaction deleted" });
      setConfirmDelete(false);
      setSheetOpen(false);
      setSelectedId(null);
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Couldn't delete",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  function openRow(tx: LocalTransaction) {
    setSelectedId(tx.id);
  }

  function openSheet(tx: LocalTransaction) {
    setSelectedId(tx.id);
    setSheetOpen(true);
  }

  const typePills = (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {TYPE_FILTERS.map((item) => (
        <Pill
          key={item.id}
          active={typeFilter === item.id}
          onClick={() => setTypeFilter(item.id)}
          className="shrink-0"
        >
          {item.label}
        </Pill>
      ))}
      <Pill
        active={typeFilter === "bookmarked"}
        onClick={() => setTypeFilter("bookmarked")}
        aria-label="Bookmarked transactions"
        className="shrink-0"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Saved
      </Pill>
    </div>
  );

  const periodNav = (
    <div className="flex shrink-0 items-center gap-0.5 text-[12px] text-muted">
      <IconButton label="Previous period" size="sm" onClick={() => stepPeriod(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </IconButton>
      <span className="min-w-[5.5rem] text-center font-medium">{periodLabel}</span>
      <IconButton label="Next period" size="sm" onClick={() => stepPeriod(1)}>
        <ChevronRight className="h-4 w-4" />
      </IconButton>
    </div>
  );

  const filterBar = (mobile: boolean) => (
    <div className={mobile ? "space-y-3" : "border-b border-line/70 p-5"}>
      <div className="flex items-center gap-2">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search transactions…"
          className="flex-1"
        />
        <IconButton
          label={filtersOpen ? "Hide filters" : "Show filters"}
          onClick={() => setFiltersOpen((next) => !next)}
          className={activeFilterCount > 0 ? "text-primary" : ""}
        >
          <ListFilter className="h-5 w-5" />
        </IconButton>
      </div>
      {mobile ? (
        <>
          <div className="-mx-0.5 overflow-x-auto px-0.5">{typePills}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              Period
            </span>
            {periodNav}
          </div>
        </>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          {typePills}
          <div className="ml-auto">{periodNav}</div>
        </div>
      )}
    </div>
  );

  const filtersPanel = filtersOpen && (
    <SurfaceCard className="p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Period" value={kind} onChange={(event) => setKind(event.target.value as PeriodKind)}>
          {PERIOD_KINDS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select label="Account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <option value="">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <div className="flex items-end gap-2">
          <Button variant="secondary" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
            Clear filters
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/transactions/new")}>
            Full form
          </Button>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-muted">
        {summary.transactionCount} transaction{summary.transactionCount === 1 ? "" : "s"} ·{" "}
        {formatMoney(summary.income, lookups.dataset.baseCurrency)} in ·{" "}
        {formatMoney(summary.expense, lookups.dataset.baseCurrency)} out
      </p>
    </SurfaceCard>
  );

  function ledgerRow(tx: LocalTransaction, onSelect: (tx: LocalTransaction) => void, compact = false) {
    const title = transactionTitle(tx, lookups);
    const category = tx.category_id ? lookups.category.get(tx.category_id)?.name : null;
    const account = transactionAccounts(tx, lookups);
    const description = [
      category ?? (tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer"),
      formatRelativeDay(tx.date),
    ]
      .filter(Boolean)
      .join(" · ");
    const amount = formatMoney(Math.abs(tx.amount), tx.currency);
    const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
    const tone =
      tx.type === "income" ? "text-income" : tx.type === "expense" ? "text-expense" : "text-transfer";
    const active = selected?.id === tx.id && !compact;

    return (
      <div
        key={tx.id}
        className={`trove-row group ${active ? "bg-primary-soft-bg/50" : ""}`}
      >
        <button
          type="button"
          onClick={() => onSelect(tx)}
          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-sage-light text-[12px] font-semibold text-primary dark:bg-primary-soft">
            {title.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-5 text-ink group-hover:text-primary">
              {title}
            </span>
            <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{description}</span>
          </span>
          <span className="hidden w-[8.5rem] shrink-0 truncate text-[13px] text-muted lg:block">{account}</span>
          <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
            {sign}
            {amount}
          </span>
        </button>
        <button
          type="button"
          aria-label={tx.is_bookmarked ? "Remove bookmark" : "Bookmark this transaction"}
          aria-pressed={tx.is_bookmarked}
          onClick={() => void toggleBookmark(tx.id)}
          className={`icon-btn -mr-1 h-8 w-8 ${tx.is_bookmarked ? "text-warning" : ""}`}
        >
          <Bookmark className={`h-4 w-4 ${tx.is_bookmarked ? "fill-warning/25" : ""}`} />
        </button>
      </div>
    );
  }

  function detailBody(tx: LocalTransaction, showEyebrow = true): ReactNode {
    const category = tx.category_id ? lookups.category.get(tx.category_id) : undefined;
    const account = transactionAccounts(tx, lookups);
    const title = transactionTitle(tx, lookups);
    const amount = formatMoney(Math.abs(tx.amount), tx.currency);
    const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";

    return (
      <div>
        {showEyebrow && <p className="trove-eyebrow">Transaction</p>}
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h2 className={`${showEyebrow ? "text-[24px]" : "text-[21px]"} font-semibold leading-8 tracking-[-0.02em] text-primary`}>
            {title}
          </h2>
          <button
            type="button"
            aria-label={tx.is_bookmarked ? "Remove bookmark" : "Bookmark this transaction"}
            onClick={() => void toggleBookmark(tx.id)}
            className={`icon-btn shrink-0 ${tx.is_bookmarked ? "text-warning" : ""}`}
          >
            <Bookmark className={`h-5 w-5 ${tx.is_bookmarked ? "fill-warning/25" : ""}`} />
          </button>
        </div>
        <p className="trove-amount-lg mt-3">
          {sign}
          {amount}
        </p>
        <div className="mt-3">
          <Badge tone={tx.type === "income" ? "paid" : tx.type === "expense" ? "expense" : "neutral"}>
            {tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer"}
          </Badge>
        </div>

        <dl className="mt-6">
          <DetailRow label="Category">{category?.name ?? "—"}</DetailRow>
          <DetailRow label="Account">{account || "—"}</DetailRow>
          <DetailRow label="Date">{formatDateTime(tx.date)}</DetailRow>
          <DetailRow label="Note">{tx.notes.trim() || "—"}</DetailRow>
        </dl>

        <div className="mt-6 flex items-center gap-2">
          <Button
            variant="primary"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => navigate(`/transactions/${tx.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Transactions"
        subtitle="Income, expenses and transfers"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/transactions?add=expense")}
          >
            Add transaction
          </Button>
        }
      />

      {filtersPanel}

      {/* Desktop master / detail. */}
      <div className="hidden gap-[17px] lg:grid lg:grid-cols-3">
        <SurfaceCard className="col-span-2 overflow-hidden">
          {filterBar(false)}
          <div className="max-h-[calc(100vh-19rem)] overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState
                state={activeFilterCount > 0 ? "searchEmpty" : "transactionsEmpty"}
                title={activeFilterCount > 0 ? "No transactions match" : "Nothing recorded in this period"}
                description={
                  activeFilterCount > 0
                    ? "Try widening the period or clearing a filter."
                    : "Record an expense, income or transfer. It saves on this device straight away."
                }
                action={
                  activeFilterCount > 0 ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => navigate("/transactions?add=expense")}
                    >
                      Add transaction
                    </Button>
                  )
                }
              />
            ) : (
              <div className="trove-hairline-list">
                {filtered.map((tx) => ledgerRow(tx, openRow))}
              </div>
            )}
          </div>
        </SurfaceCard>

        <div>
          <SurfaceCard className="overflow-hidden">
            {selected ? (
              <div className="p-6">{detailBody(selected)}</div>
            ) : (
              <EmptyState
                state="transactionsEmpty"
                title="Select a transaction"
                description="Choose a row to see its details."
              />
            )}
          </SurfaceCard>
          <div className="flex justify-center pt-3">
            <img
              src="/mascot/ultra-refined/Curios.png"
              alt=""
              className="pointer-events-none h-[150px] w-[150px] object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Mobile grouped ledger. */}
      <div className="space-y-4 pb-2 lg:hidden">
        <SurfaceCard className="p-4">{filterBar(true)}</SurfaceCard>

        {filtered.length === 0 ? (
          <SurfaceCard>
            <EmptyState
              state={activeFilterCount > 0 ? "searchEmpty" : "transactionsEmpty"}
              title={activeFilterCount > 0 ? "No transactions match" : "Nothing recorded yet"}
              description={
                activeFilterCount > 0
                  ? "Try widening the period or clearing a filter."
                  : "Record an expense, income or transfer. It works offline too."
              }
              action={
                activeFilterCount > 0 ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => navigate("/transactions?add=expense")}
                  >
                    Add transaction
                  </Button>
                )
              }
            />
          </SurfaceCard>
        ) : (
          groups.map((group) => {
            const totals = dayTotals(group.rows, lookups.fx);
            return (
              <section key={group.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {group.label}
                  </h2>
                  <span className="tabular text-[11px] text-muted">
                    {totals.income > 0 && (
                      <span className="text-income">
                        +{formatMoney(totals.income, lookups.dataset.baseCurrency, { compact: true })}
                      </span>
                    )}
                    {totals.income > 0 && totals.expense > 0 && " · "}
                    {totals.expense > 0 && (
                      <span>
                        −{formatMoney(totals.expense, lookups.dataset.baseCurrency, { compact: true })}
                      </span>
                    )}
                  </span>
                </div>
                <SurfaceCard className="overflow-hidden">
                  <div className="trove-hairline-list">
                    {group.rows.map((tx) => ledgerRow(tx, openSheet, true))}
                  </div>
                </SurfaceCard>
              </section>
            );
          })
        )}
      </div>

      <Overlay
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Transaction"
        variant="sheet"
        size="md"
      >
        {selected && detailBody(selected, false)}
      </Overlay>

      <ConfirmOverlay
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void runDelete()}
        title="Delete this transaction?"
        message="It will be removed from this device and synced as a deletion. This cannot be undone."
        busy={deleting}
      />
    </div>
  );
}
