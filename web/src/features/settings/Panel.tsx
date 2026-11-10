/**
 * Small shared pieces for the settings panels: a titled card and a switch row.
 *
 * Keeping them here means every section reads the same and no panel invents its
 * own toggle markup (and therefore its own focus/keyboard behaviour).
 */
import type { ReactNode } from "react";
import { Toggle } from "../../components/ui/Toggle";

export function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </header>
      <div className="px-4 py-3">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">
          {footer}
        </footer>
      )}
    </section>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {/* Shared liquid toggle (EasyUI LiquidToggle port). */}
      <Toggle id={id} checked={checked} onChange={onChange} label={label} disabled={disabled} className="mt-0.5" />
    </div>
  );
}
