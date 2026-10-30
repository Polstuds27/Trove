/**
 * Bookmarks.
 *
 * The transactions you flagged for later — receipts to check, charges to
 * dispute, anything worth finding again without remembering when it happened.
 * Flagging is a local row edit, so it syncs like any other change.
 *
 * With nothing flagged the page is one tall glass panel, mascot-led, so the
 * empty state still feels like the rest of Trove rather than a dead end.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  Avatar,
  Button,
  GlassPanel,
  Mascot,
  PageHeader,
  Pill,
  SurfaceCard,
} from "../../components/ui";
import type { LocalTransaction } from "../../db/types";
import { byTxNewest, formatMoney, formatRelativeDay } from "../../design/format";
import { useLocalData } from "../analytics/useLocalData";
import { toggleBookmark } from "../../db/repositories";
import { transactionAccounts, transactionTitle } from "../transactions/TransactionList";

type Sort = "recent" | "amount";

export function BookmarksPage() {
  const { dataset, ready } = useLocalData();
  const navigate = useNavigate();
  const [sort, setSort] = useState<Sort>("recent");

  const rows = useMemo(() => {
    const bookmarked = dataset.transactions.filter((tx) => tx.is_bookmarked);
    return sort === "amount"
      ? [...bookmarked].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      : [...bookmarked].sort(byTxNewest);
  }, [dataset.transactions, sort]);

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Bookmarks"
        subtitle={
          rows.length === 0
            ? "Flagged transactions live here"
            : `${rows.length} flagged transaction${rows.length === 1 ? "" : "s"}`
        }
      />

      {ready && rows.length === 0 ? (
        <GlassPanel className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center lg:min-h-[600px]">
          <Mascot state="bookmarks" size={190} className="mb-3" />
          <h2 className="text-[26px] font-semibold leading-8 tracking-[-0.025em] text-primary sm:text-[30px]">
            Nothing bookmarked yet
          </h2>
          <p className="mt-2 max-w-[32ch] text-[13.5px] leading-6 text-muted">
            Bookmark a transaction to find it again quickly.
          </p>
          <Button
            variant="primary"
            className="mt-5"
            onClick={() => navigate("/transactions")}
          >
            Browse transactions
          </Button>
        </GlassPanel>
      ) : (
        <>
          {rows.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill active={sort === "recent"} onClick={() => setSort("recent")}>
                Most recent
              </Pill>
              <Pill active={sort === "amount"} onClick={() => setSort("amount")}>
                Largest first
              </Pill>
            </div>
          )}

          <SurfaceCard className="overflow-hidden">
            <header className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Saved for later</h2>
              <span className="tabular text-[12px] text-muted">{rows.length} total</span>
            </header>
            <div className="trove-hairline-list">
              {rows.map((tx) => (
                <BookmarkRow
                  key={tx.id}
                  tx={tx}
                  onOpen={() => navigate(`/transactions/${tx.id}`)}
                />
              ))}
            </div>
          </SurfaceCard>

          <p className="px-1 text-[12px] leading-5 text-muted">
            Bookmarks are stored with the transaction itself, so they follow you between devices
            on the next sync and stay readable offline.
          </p>
        </>
      )}
    </div>
  );
}

function BookmarkRow({ tx, onOpen }: { tx: LocalTransaction; onOpen: () => void }) {
  const { lookups } = useLocalData();
  const category = tx.category_id ? lookups.category.get(tx.category_id) : undefined;
  const title = transactionTitle(tx, lookups);
  const meta = [category?.name ?? (tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer"), formatRelativeDay(tx.date)]
    .filter(Boolean)
    .join(" · ");
  const accounts = transactionAccounts(tx, lookups);
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
  const tone =
    tx.type === "income" ? "text-income" : tx.type === "expense" ? "text-ink" : "text-transfer";

  return (
    <div className="trove-row group">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
      >
        <Avatar name={title} size={38} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold leading-5 text-ink group-hover:text-primary">
              {title}
            </span>
            <Star aria-label="Bookmarked" className="h-3 w-3 shrink-0 fill-current text-warning" />
          </span>
          <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{meta}</span>
        </span>
        <span className="hidden w-[9.5rem] shrink-0 truncate text-[13px] text-muted lg:block">
          {accounts}
        </span>
        <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
          {sign}
          {formatMoney(Math.abs(tx.amount), tx.currency)}
        </span>
      </button>

      <button
        type="button"
        aria-label="Remove bookmark"
        title="Remove bookmark"
        onClick={() => void toggleBookmark(tx.id)}
        className="icon-btn shrink-0 text-warning hover:bg-warning-soft"
      >
        <Star className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
}
