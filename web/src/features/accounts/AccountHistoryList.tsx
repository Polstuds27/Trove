import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { SurfaceCard } from "../../components/ui";
import { formatMoney, formatRelativeDay } from "../../design/format";
import { categoryIcon } from "../../design/icons";
import { transactionTitle, groupByDay, dayTotals } from "../transactions/TransactionList";
import type { LocalTransaction } from "../../db/types";
import type { Lookups } from "../analytics/engine";
import { toggleBookmark } from "../../db/repositories";

export function AccountHistoryList({
  transactions,
  lookups,
  onToggleBookmark,
}: {
  transactions: LocalTransaction[];
  lookups: Lookups;
  onToggleBookmark?: (id: string) => void;
}) {
  const groups = useMemo(() => groupByDay(transactions), [transactions]);
  const navigate = useNavigate();

  function ledgerRow(tx: LocalTransaction) {
    const title = transactionTitle(tx, lookups);
    const category = tx.category_id ? lookups.category.get(tx.category_id)?.name : null;
    const categoryObj = tx.category_id ? lookups.category.get(tx.category_id) : undefined;
    const Icon = categoryIcon(categoryObj?.icon ?? null, categoryObj?.name);
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

    return (
      <div key={tx.id} className="trove-row group">
        <button
          type="button"
          onClick={() => navigate(`/transactions/${tx.id}`)}
          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-surface-sunken text-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-5 text-ink group-hover:text-primary">
              {title}
            </span>
            <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-muted">{description}</span>
          </span>
          <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
            {sign}
            {amount}
          </span>
        </button>
        <button
          type="button"
          aria-label={tx.is_bookmarked ? "Remove bookmark" : "Bookmark this transaction"}
          aria-pressed={tx.is_bookmarked}
          onClick={() => {
            if (onToggleBookmark) onToggleBookmark(tx.id);
            else void toggleBookmark(tx.id);
          }}
          className={`icon-btn -mr-1 h-8 w-8 ${tx.is_bookmarked ? "text-warning" : ""}`}
        >
          <Bookmark className={`h-4 w-4 ${tx.is_bookmarked ? "fill-warning/25" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
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
              <div className="trove-hairline-list">{group.rows.map((tx) => ledgerRow(tx))}</div>
            </SurfaceCard>
          </section>
        );
      })}
    </div>
  );
}
