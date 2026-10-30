/**
 * Recurring rules.
 *
 * The schedule that will produce future transactions: what repeats, how often,
 * and when it next runs. The summary sits directly on the page — money in and
 * committed money out — then one Upcoming card covers the next 30 days. A paused
 * rule can never be mistaken for one that is about to charge you (§21).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Pause, Play, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Dropdown,
  EmptyState,
  GlassPanel,
  LinkButton,
  Mascot,
  PageHeader,
  Pill,
  SurfaceCard,
} from "../../components/ui";
import type { LocalRecurring } from "../../db/types";
import { formatDate, formatMoney } from "../../design/format";
import { categoryIcon } from "../../design/icons";
import { useLocalData } from "../analytics/useLocalData";
import { updateRecurring } from "../../db/repositories";

type Filter = "all" | "expense" | "income" | "paused";

const FREQUENCY_LABEL: Record<LocalRecurring["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

/** The category-style column from the spec: what kind of money this is. */
function kindLabel(rule: LocalRecurring): string {
  return rule.type === "income" ? "Income" : rule.type === "expense" ? "Bills" : "Transfer";
}

function withinDays(rule: LocalRecurring, days: number): boolean {
  const when = new Date(rule.next_run_at).getTime();
  return when <= Date.now() + days * 86_400_000;
}

export function RecurringPage() {
  const { lookups, dataset, ready } = useLocalData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const ordered = [...dataset.recurring].sort((a, b) =>
      a.next_run_at.localeCompare(b.next_run_at),
    );
    if (filter === "all") return ordered;
    if (filter === "paused") return ordered.filter((row) => !row.enabled);
    return ordered.filter((row) => row.type === filter);
  }, [dataset.recurring, filter]);

  const soon = rows.filter((row) => row.enabled && withinDays(row, 30));
  const later = rows.filter((row) => !row.enabled || !withinDays(row, 30));

  const activeCount = dataset.recurring.filter((row) => row.enabled).length;
  const pausedCount = dataset.recurring.length - activeCount;

  const monthlyOut = dataset.recurring
    .filter((row) => row.enabled && row.type === "expense" && row.frequency === "monthly")
    .reduce((sum, row) => sum + row.amount, 0);
  const monthlyIn = dataset.recurring
    .filter((row) => row.enabled && row.type === "income" && row.frequency === "monthly")
    .reduce((sum, row) => sum + row.amount, 0);

  const currency = lookups.dataset.baseCurrency;

  async function toggle(rule: LocalRecurring) {
    await updateRecurring(rule.id, { enabled: !rule.enabled });
  }

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Recurring"
        subtitle="Repeating income and bills"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/recurring/new")}
          >
            New rule
          </Button>
        }
      />

      {ready && dataset.recurring.length === 0 ? (
        <GlassPanel className="px-6 py-12">
          <EmptyState
            state="recurring"
            title="No recurring rules yet"
            description="Rent, subscriptions, salary — if it repeats, put it here and you'll always know what's committed before you spend. Entries land in your ledger as they come due."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate("/recurring/new")}>
                Add a recurring rule
              </Button>
            }
            secondaryAction={<LinkButton to="/calendar">See the calendar</LinkButton>}
          />
        </GlassPanel>
      ) : (
        <>
          {/* The two figures sit on the page itself, with the lounging mascot. */}
          <div className="relative flex min-h-[112px] flex-wrap items-end gap-x-10 gap-y-5 pb-1 pr-28 sm:min-h-[128px] sm:gap-x-16 sm:pr-40 lg:pr-52">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Monthly income
              </p>
              <p className="tabular mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-primary sm:text-[36px]">
                {formatMoney(monthlyIn, currency)}
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted">
                {dataset.recurring.filter((row) => row.enabled && row.type === "income").length} active
                {dataset.recurring.filter((row) => row.enabled && row.type === "income").length === 1
                  ? " rule"
                  : " rules"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Monthly bills
              </p>
              <p className="tabular mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-primary sm:text-[36px]">
                {formatMoney(monthlyOut, currency)}
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted">
                {dataset.recurring.filter((row) => row.enabled && row.type === "expense").length} active
                {dataset.recurring.filter((row) => row.enabled && row.type === "expense").length === 1
                  ? " rule"
                  : " rules"}
              </p>
            </div>

            <div className="pointer-events-none absolute -top-4 right-0 sm:-top-6 sm:right-2">
              <Mascot state="recurring" size={128} className="sm:hidden" />
              <Mascot state="recurring" size={176} className="hidden sm:block" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: `All (${dataset.recurring.length})` },
                { id: "expense", label: `Bills (${dataset.recurring.filter((row) => row.type === "expense").length})` },
                { id: "income", label: `Income (${dataset.recurring.filter((row) => row.type === "income").length})` },
                { id: "paused", label: `Paused (${pausedCount})` },
              ] as { id: Filter; label: string }[]
            ).map((option) => (
              <Pill
                key={option.id}
                active={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}
              </Pill>
            ))}
            <span className="ml-auto hidden text-[11.5px] text-muted sm:block">
              {activeCount} active{pausedCount > 0 ? ` · ${pausedCount} paused` : ""}
            </span>
          </div>

          <SurfaceCard className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Upcoming</h2>
              <span className="text-[12px] text-muted">Next 30 days</span>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                compact
                state="recurring"
                title="Nothing matches this filter"
                description="Switch back to All to see every recurring rule you've set up."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>
                    Show all
                  </Button>
                }
              />
            ) : (
              <>
                {soon.length > 0 ? (
                  <ul className="trove-hairline-list px-5 sm:px-6">
                    {soon.map((rule) => (
                      <RecurringRow
                        key={rule.id}
                        rule={rule}
                        lookups={lookups}
                        onToggle={() => void toggle(rule)}
                        onOpen={() => navigate(`/recurring/${rule.id}`)}
                        onEdit={() => navigate(`/recurring/${rule.id}/edit`)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-6 text-[12.5px] text-muted sm:px-6">
                    Nothing falls due in the next 30 days for this filter.
                  </p>
                )}

                {later.length > 0 && (
                  <div className="border-t border-line/70">
                    <p className="px-5 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint sm:px-6">
                      Later {filter === "paused" ? "" : "and paused"}
                    </p>
                    <ul className="trove-hairline-list px-5 pb-1 sm:px-6">
                      {later.map((rule) => (
                        <RecurringRow
                          key={rule.id}
                          rule={rule}
                          lookups={lookups}
                          onToggle={() => void toggle(rule)}
                          onOpen={() => navigate(`/recurring/${rule.id}`)}
                          onEdit={() => navigate(`/recurring/${rule.id}/edit`)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 px-5 py-3 sm:px-6">
              <LinkButton to="/recurring/new" className="gap-1 text-[12px]">
                <Plus className="h-3.5 w-3.5" /> Add recurring rule
              </LinkButton>
              <LinkButton to="/calendar" className="text-[12px]">
                Open calendar
              </LinkButton>
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  );
}

function RecurringRow({
  rule,
  lookups,
  onToggle,
  onOpen,
  onEdit,
}: {
  rule: LocalRecurring;
  lookups: ReturnType<typeof useLocalData>["lookups"];
  onToggle: () => void;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const category = rule.category_id ? lookups.category.get(rule.category_id) : undefined;
  const Icon = categoryIcon(category?.icon ?? null, category?.name);
  const tone = rule.type === "income" ? "text-income" : rule.type === "expense" ? "text-expense" : "text-transfer";
  const sign = rule.type === "income" ? "+" : rule.type === "expense" ? "−" : "";
  const name = rule.notes || category?.name || `${kindLabel(rule)} rule`;
  const meta = `${FREQUENCY_LABEL[rule.frequency]} · ${formatDate(rule.next_run_at, "short")}`;

  return (
    <li className={`group flex items-center gap-3 py-3 ${rule.enabled ? "" : "opacity-65"}`}>
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          rule.type === "income"
            ? "bg-sage-light text-primary dark:bg-primary-soft"
            : rule.type === "expense"
              ? "bg-peach text-clay dark:bg-white/10 dark:text-accent"
              : "bg-surface-sunken text-muted"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-semibold leading-5 text-ink">{name}</span>
          {!rule.enabled && <Badge tone="neutral">Paused</Badge>}
        </span>
        <span className="tabular mt-0.5 block truncate text-[11.5px] text-muted">{meta}</span>
      </button>

      <span className="hidden w-[84px] shrink-0 text-[12px] text-muted sm:block">{kindLabel(rule)}</span>

      <span className={`tabular shrink-0 text-right text-[14px] font-semibold ${tone}`}>
        {sign}
        {formatMoney(rule.amount, rule.currency)}
      </span>

      <Dropdown
        label={`Actions for ${name}`}
        trigger={<MoreHorizontal className="h-4 w-4" />}
        items={[
          { id: "view", label: "View details", onSelect: onOpen },
          { id: "edit", label: "Edit", onSelect: onEdit },
          {
            id: "toggle",
            label: rule.enabled ? "Pause" : "Resume",
            icon: rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
            onSelect: onToggle,
          },
        ]}
      />
    </li>
  );
}
