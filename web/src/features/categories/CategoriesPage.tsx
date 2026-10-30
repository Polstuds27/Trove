/**
 * Categories.
 *
 * The taxonomy behind every report. Two cards — expense and income — with a
 * colour swatch, the transaction count and the total for each row, so the
 * screen answers "where does my money actually go?" at a glance. Subcategories
 * stay indented under their parent as a quiet second level.
 *
 * Creation and editing live at `/categories/new` and
 * `/categories/:categoryId/edit`.
 */
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Tags } from "lucide-react";
import { Button, EmptyState, LinkButton, PageHeader, SurfaceCard } from "../../components/ui";
import type { LocalCategory } from "../../db/types";
import { formatMoney } from "../../design/format";
import { categoryIcon } from "../../design/icons";
import { useLocalData } from "../analytics/useLocalData";
import { convert, type FxTable } from "../analytics/fx";

interface CategoryNode {
  category: LocalCategory;
  children: CategoryNode[];
  usage: number;
  total: number;
}

export function CategoriesPage() {
  const { dataset, lookups, ready } = useLocalData();
  const navigate = useNavigate();
  const currency = lookups.dataset.baseCurrency;

  /** Per-category activity: number of transactions and the converted total. */
  const activity = useMemo(() => {
    const rows = new Map<string, { count: number; total: number }>();
    for (const tx of dataset.transactions) {
      if (!tx.category_id || tx.type === "transfer") continue;
      const current = rows.get(tx.category_id) ?? { count: 0, total: 0 };
      rows.set(tx.category_id, {
        count: current.count + 1,
        total: current.total + Math.abs(convert(tx.amount, tx.currency, lookups.fx as FxTable)),
      });
    }
    return rows;
  }, [dataset.transactions, lookups.fx]);

  const nodes = useMemo(() => {
    const roots = dataset.categories
      .filter((row) => !row.parent_id)
      .sort((a, b) => a.name.localeCompare(b.name));
    const build = (root: LocalCategory): CategoryNode => {
      const children = dataset.categories
        .filter((row) => row.parent_id === root.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => build(child));
      const own = activity.get(root.id) ?? { count: 0, total: 0 };
      return {
        category: root,
        children,
        usage: own.count + children.reduce((sum, child) => sum + child.usage, 0),
        total: own.total + children.reduce((sum, child) => sum + child.total, 0),
      };
    };
    return roots.map(build);
  }, [dataset.categories, activity]);

  const expense = nodes.filter((node) => node.category.type === "expense");
  const income = nodes.filter((node) => node.category.type === "income");

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader
        title="Categories"
        subtitle="How your money is sorted"
        showActionsOnMobile
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/categories/new")}
          >
            Add category
          </Button>
        }
      />

      {ready && dataset.categories.length === 0 ? (
        <SurfaceCard className="mt-5 px-6 py-12">
          <EmptyState
            state="budgetOnTrack"
            title="No categories yet"
            description="Categories turn a list of transactions into a report: they tell you where the money went and give budgets something to hold onto."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => navigate("/categories/new")}
              >
                Create your first category
              </Button>
            }
            secondaryAction={<LinkButton to="/transactions">I'll do this later</LinkButton>}
          />
        </SurfaceCard>
      ) : (
        <div className="grid gap-[17px] lg:grid-cols-2 lg:items-start">
          <CategoryCard
            kind="expense"
            title="Expense"
            nodes={expense}
            currency={currency}
            onAdd={() => navigate("/categories/new?type=expense")}
          />
          <CategoryCard
            kind="income"
            title="Income"
            nodes={income}
            currency={currency}
            onAdd={() => navigate("/categories/new?type=income")}
          />
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  kind,
  title,
  nodes,
  currency,
  onAdd,
}: {
  kind: "expense" | "income";
  title: string;
  nodes: CategoryNode[];
  currency: string;
  onAdd: () => void;
}) {
  const total = nodes.reduce((sum, node) => sum + node.total, 0);

  return (
    <section className="min-w-0">
      {/* Mobile keeps the heading outside the card, per spec §7.1. */}
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1 lg:hidden">
        <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h2>
        <span className="tabular text-[12px] text-muted">
          {formatMoney(total, currency)}
        </span>
      </div>

      <SurfaceCard className="overflow-hidden">
        <header className="hidden items-baseline justify-between gap-3 border-b border-line/70 px-6 py-4 lg:flex">
          <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">
            {title}
          </h2>
          <span className="tabular text-[12px] text-muted">
            {nodes.length} {nodes.length === 1 ? "category" : "categories"}
            <span className="px-1.5 text-faint">·</span>
            {formatMoney(total, currency)}
          </span>
        </header>

        {nodes.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <span
              aria-hidden="true"
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface-sunken text-muted"
            >
              <Tags className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-ink">
              No {kind} categories
            </p>
            <p className="mx-auto mt-1 max-w-[30ch] text-[12.5px] leading-5 text-muted">
              Add one so transactions can be classified as they happen.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" icon={<Plus className="h-3.5 w-3.5" />} onClick={onAdd}>
              Add {kind} category
            </Button>
          </div>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto px-3 sm:px-4">
            {nodes.map((node) => (
              <CategoryRow key={node.category.id} node={node} depth={0} currency={currency} />
            ))}
          </ul>
        )}

        <div className="border-t border-line/70 px-5 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add category
          </button>
        </div>
      </SurfaceCard>
    </section>
  );
}

function CategoryRow({
  node,
  depth,
  currency,
}: {
  node: CategoryNode;
  depth: number;
  currency: string;
}) {
  const { category } = node;
  const Icon = categoryIcon(category.icon, category.name);
  const countLabel =
    node.usage === 0
      ? "No activity"
      : `${node.usage} transaction${node.usage === 1 ? "" : "s"}`;

  return (
    <li>
      <Link
        to={`/categories/${category.id}/edit`}
        className="group flex items-center gap-3 rounded-[16px] py-3 pr-2 transition-colors hover:bg-surface-sunken/45"
        style={{ paddingLeft: `${depth * 18}px` }}
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-sunken text-primary"
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-semibold leading-5 text-ink ${
              depth > 0 ? "text-[14px]" : "text-[15px]"
            }`}
          >
            {category.name}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] leading-[18px] text-muted">
            {depth > 0 && <span aria-hidden="true" className="mr-1 text-faint">↳</span>}
            {countLabel}
          </span>
        </span>
        <span className="tabular shrink-0 text-right text-[14px] font-semibold text-ink">
          {formatMoney(node.total, currency)}
        </span>
        <Pencil
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <CategoryRow
              key={child.category.id}
              node={child}
              depth={depth + 1}
              currency={currency}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
