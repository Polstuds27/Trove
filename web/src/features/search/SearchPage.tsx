/**
 * Global search.
 *
 * Runs against the local rows only, so it answers instantly with no connection
 * and never waits on a round trip. Filters are encoded in the URL so a search
 * can be bookmarked, shared, or restored with the Back button.
 *
 * Layout follows the spec: one large search field, a results card, and a
 * filters card beside it. Filters keep every capability the old panel had —
 * section, transaction type, date window and bookmarks — without turning the
 * screen into a form.
 */
import { useMemo } from "react";
import { AccountAvatar } from "../accounts/AccountAvatar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, Search, Tag, FolderTree, X } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  GlassPanel,
  Mascot,
  MascotTipCard,
  PageHeader,
  Pill,
  SurfaceCard,
} from "../../components/ui";
import type { LocalTransaction } from "../../db/types";
import { formatMoney, formatRelativeDay } from "../../design/format";
import { categoryIcon } from "../../design/icons";
import { useLocalData } from "../analytics/useLocalData";
import { periodRange } from "../analytics/period";
import { usePreferences } from "../settings/preferences";
import {
  EMPTY_FILTERS,
  filterAccounts,
  filterCategories,
  filterTransactions,
  type SearchEntity,
} from "../analytics/search";
import { transactionAccounts, transactionTitle } from "../transactions/TransactionList";

const ENTITIES: { id: SearchEntity; label: string }[] = [
  { id: "transactions", label: "Transactions" },
  { id: "accounts", label: "Accounts" },
  { id: "categories", label: "Categories" },
];

const TYPES: { id: "all" | "expense" | "income" | "transfer"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfer" },
];

const DATES: { id: "month" | "any"; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "any", label: "Any time" },
];

export function SearchPage() {
  const { lookups, dataset, ready } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const entity = ((params.get("in") as SearchEntity) || "transactions") as SearchEntity;
  const bookmarked = params.get("bookmarked") === "1";
  const type = (params.get("type") as "expense" | "income" | "transfer" | null) ?? "all";
  const dateWindow = (params.get("date") as "month" | "any" | null) ?? "month";

  const range = useMemo(
    () =>
      dateWindow === "month"
        ? periodRange({ kind: "month", anchor: new Date(), monthStartDay: preferences.monthStartDay })
        : null,
    [dateWindow, preferences.monthStartDay],
  );

  const filters = useMemo(
    () => ({
      ...EMPTY_FILTERS,
      query,
      entities: [entity],
      bookmarkedOnly: bookmarked,
      types: type === "all" ? [] : [type],
      range,
    }),
    [query, entity, bookmarked, type, range],
  );

  const txHits = useMemo(
    () =>
      filterTransactions(dataset.transactions, filters, lookups).map((hit) => hit.transaction),
    [dataset.transactions, filters, lookups],
  );
  const accountHits = useMemo(
    () => filterAccounts(dataset.accounts, filters),
    [dataset.accounts, filters],
  );
  const categoryHits = useMemo(
    () => filterCategories(dataset.categories, filters, lookups),
    [dataset.categories, filters, lookups],
  );

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  function clearAll() {
    const next = new URLSearchParams(params);
    next.delete("type");
    next.delete("date");
    next.delete("bookmarked");
    setParams(next, { replace: true });
  }

  const total = txHits.length + accountHits.length + categoryHits.length;
  const hasQuery = query.trim().length > 0;
  const entityLabel = ENTITIES.find((item) => item.id === entity)?.label ?? "Transactions";
  const typeLabel = TYPES.find((item) => item.id === type)?.label ?? "All";
  const dateLabel = DATES.find((item) => item.id === dateWindow)?.label ?? "This month";
  const filterSummary = [
    type === "all" ? entityLabel : `${entityLabel} · ${typeLabel}`,
    dateLabel,
    bookmarked ? "Bookmarked" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const filtersActive = Boolean(query) || type !== "all" || dateWindow !== "month" || bookmarked;

  const resultCard = (
    <SurfaceCard className="overflow-hidden">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line/70 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold leading-6 text-ink">
            {hasQuery
              ? `${total} ${total === 1 ? "result" : "results"}`
              : `${total} ${total === 1 ? "transaction" : "transactions"}`}
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {hasQuery ? `Matching “${query.trim()}”` : "Everything on this device"}
          </p>
        </div>
        <span className="min-w-0 text-right text-[12px] text-muted">{filterSummary}</span>
      </header>

      {!ready ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Mascot state="loading" size={120} />
          <p className="text-[15px] font-semibold text-primary">Loading your ledger…</p>
          <p className="text-[13px] text-muted">Search runs against the copy stored in this browser.</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <Mascot state="search" size={150} />
          <p className="mt-2 text-[17px] font-semibold text-primary">
            {hasQuery ? `No matches for “${query}”` : "Start typing to search"}
          </p>
          <p className="mt-1.5 max-w-[38ch] text-[13px] leading-5 text-muted">
            {hasQuery
              ? "Try fewer words, widen the date window, or clear the bookmarks filter."
              : "Everything stored on this device is indexed here — transactions, accounts and categories."}
          </p>
          {filtersActive && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      ) : entity === "transactions" ? (
        <>
          <div className="max-h-[360px] overflow-y-auto trove-hairline-list">
            {txHits.map((tx) => (
              <SearchTransactionRow
                key={tx.id}
                tx={tx}
                onOpen={() => navigate(`/transactions/${tx.id}`)}
              />
            ))}
          </div>
        </>
       ) : entity === "accounts" ? (
        <ul className="max-h-[360px] overflow-y-auto trove-hairline-list">
          {accountHits.map(({ account }) => (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => navigate(`/accounts/${account.id}`)}
                className="trove-row w-full text-left"
              >
                <AccountAvatar account={account} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold leading-5 text-ink">
                    {account.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">
                    {account.type} · {account.currency}
                  </span>
                </span>
                <span
                  className={`tabular shrink-0 text-[14px] font-semibold ${
                    account.current_balance < 0 ? "text-expense" : "text-ink"
                  }`}
                >
                  {formatMoney(account.current_balance, account.currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
       ) : (
        <ul className="max-h-[360px] overflow-y-auto trove-hairline-list">
          {categoryHits.map(({ category, total: spent, count }) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => navigate(`/categories/${category.id}/edit`)}
                className="trove-row w-full text-left"
              >
                <Avatar name={category.name} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold leading-5 text-ink">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {category.type} · {count} tx
                  </span>
                </span>
                <span className="tabular shrink-0 text-[14px] font-semibold text-ink">
                  {formatMoney(spent, lookups.dataset.baseCurrency, { compact: true })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );

  const filtersCard = (
    <div className="space-y-[17px]">
      <SurfaceCard className="overflow-hidden">
        <header className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4">
          <h2 className="text-[16px] font-semibold leading-6 text-ink">Filters</h2>
          {filtersActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </header>

        <div className="space-y-4 px-5 py-4">
          <FilterGroup label="Search in">
            {ENTITIES.map((option) => (
              <Pill
                key={option.id}
                active={entity === option.id}
                onClick={() => setParam("in", option.id === "transactions" ? null : option.id)}
              >
                {option.label}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Type">
            {TYPES.map((option) => (
              <Pill
                key={option.id}
                active={type === option.id}
                onClick={() => setParam("type", option.id)}
              >
                {option.label}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Date">
            {DATES.map((option) => (
              <Pill
                key={option.id}
                active={dateWindow === option.id}
                onClick={() => setParam("date", option.id)}
              >
                {option.label}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Saved">
            <Pill active={!bookmarked} onClick={() => setParam("bookmarked", null)}>
              All
            </Pill>
            <Pill active={bookmarked} onClick={() => setParam("bookmarked", "1")}>
              <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
              Bookmarked
            </Pill>
          </FilterGroup>
        </div>
      </SurfaceCard>
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader title="Search" subtitle="Find any transaction" />

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          role="searchbox"
          aria-label="Search everything"
          value={query}
          onChange={(event) => setParam("q", event.target.value)}
          placeholder="Coffee, rent, groceries, 42.50…"
          className="h-[56px] w-full rounded-[16px] border border-sand/70 bg-surface-raised pl-12 pr-12 text-[15px] text-ink shadow-card outline-none transition-colors placeholder:text-faint focus:border-primary/50 focus:ring-2 focus:ring-primary/15 dark:border-line"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setParam("q", null)}
            className="icon-btn absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 min-w-0 space-y-[17px] lg:order-1">
          {resultCard}

          {!hasQuery && total > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-[11.5px] text-muted">
              <span className="font-semibold text-ink-soft">Also searchable:</span>
              <Badge tone="neutral">
                <Tag className="mr-1 inline h-3 w-3" /> Tags
              </Badge>
              <Badge tone="neutral">
                <FolderTree className="mr-1 inline h-3 w-3" /> Subcategories
              </Badge>
              <span>Match on notes, amounts and account names too.</span>
            </div>
          )}

          <GlassPanel className="px-5 py-4">
            <p className="text-[12.5px] leading-5 text-muted">
              <span className="font-semibold text-primary">Offline by design.</span> Search never leaves
              this device. The index is the same rows your reports read, so results are complete even in
              airplane mode.
            </p>
          </GlassPanel>
        </div>

        <div className="order-1 min-w-0 space-y-[17px] lg:order-2">
          {filtersCard}
          <MascotTipCard
            title="Quick tip"
            lines={[
              "Search runs against the copy stored on this device.",
              "Filter by section, type, date or bookmarks to narrow results.",
            ]}
            mascotState="working"
            storageKey="trove_search_tip_dismissed"
          />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function SearchTransactionRow({ tx, onOpen }: { tx: LocalTransaction; onOpen: () => void }) {
  const { lookups } = useLocalData();
  const title = transactionTitle(tx, lookups);
  const category = tx.category_id ? lookups.category.get(tx.category_id)?.name : null;
  const categoryObj = tx.category_id ? lookups.category.get(tx.category_id) : undefined;
  const Icon = categoryIcon(categoryObj?.icon ?? null, categoryObj?.name);
  const meta = [
    category ?? (tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer"),
    formatRelativeDay(tx.date),
  ]
    .filter(Boolean)
    .join(" · ");
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
  const tone =
    tx.type === "income" ? "text-income" : tx.type === "expense" ? "text-expense" : "text-transfer";

  return (
    <button type="button" onClick={onOpen} className="trove-row group w-full text-left">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-surface-sunken text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold leading-5 text-ink group-hover:text-primary">
            {title}
          </span>
          {tx.is_bookmarked && (
            <Bookmark aria-label="Bookmarked" className="h-3 w-3 shrink-0 fill-current text-warning" />
          )}
        </span>
        <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{meta}</span>
      </span>
      <span className="hidden w-[9.5rem] shrink-0 truncate text-[13px] text-muted sm:block">
        {transactionAccounts(tx, lookups)}
      </span>
      <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
        {sign}
        {formatMoney(Math.abs(tx.amount), tx.currency)}
      </span>
    </button>
  );
}
