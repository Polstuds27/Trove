/**
 * Segmented "where it went" bar with a labelled key.
 *
 * Adapted from the spending-breakdown section of Watermelon UI's `BudgetCard`
 * (MIT, WatermelonCorp, github.com/WatermelonCorp/watermellon-registry).
 * Kept: flex-weighted segments separated by a gap, each growing in from the
 * left in sequence, and the label/amount grid beneath. Trove changes: no demo
 * months/transactions or modal; segments come from real budget progress; the
 * motion/react scale animation is a CSS keyframe; segments are listed for
 * screen readers; amounts are formatted by the caller.
 */
export interface BreakdownItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function BreakdownBar({
  items,
  format,
  label,
  maxKeys = 6,
}: {
  items: BreakdownItem[];
  format: (value: number) => string;
  /** Accessible name for the whole breakdown. */
  label: string;
  maxKeys?: number;
}) {
  const positive = items.filter((item) => item.value > 0);
  if (positive.length === 0) return null;
  const total = positive.reduce((sum, item) => sum + item.value, 0);

  return (
    <figure className="w-full">
      <figcaption className="sr-only">
        {label}: {positive.map((item) => `${item.label} ${format(item.value)}`).join(", ")}
      </figcaption>
      <div aria-hidden="true" className="flex h-2 gap-1">
        {positive.map((item, index) => (
          <div
            key={item.id}
            title={`${item.label}: ${format(item.value)} (${Math.round((item.value / total) * 100)}%)`}
            className="h-full origin-left animate-progress-in rounded-full first:rounded-l-full last:rounded-r-full"
            style={{ flex: item.value, background: item.color, animationDelay: `${Math.min(index * 70, 350)}ms` }}
          />
        ))}
      </div>
      <dl aria-hidden="true" className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {positive.slice(0, maxKeys).map((item) => (
          <div key={item.id} className="min-w-0">
            <dt className="flex items-center gap-1.5 truncate text-[11.5px] text-muted">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="tabular mt-0.5 text-[13px] font-semibold text-ink">{format(item.value)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
