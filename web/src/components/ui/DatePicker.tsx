/**
 * Date picker: trigger + popover calendar.
 *
 * Adapted from EasyUI's `DatePicker` and `Calendar` (MIT, (c) 2026 Suraj
 * Maurya, github.com/Surajmaurya1/easyui). Kept: the trigger with calendar
 * icon, the popover that pops from the trigger edge, the month header that
 * slides in the direction of travel, the selection pill, today's dot, min/max
 * limits, the full keyboard model (arrows, Home/End, PageUp/PageDown with
 * Shift for years), the short beat before closing and focus returning to the
 * trigger. Trove changes:
 * - Framer Motion springs / layoutId became CSS keyframes (reduced motion
 *   collapses them via the global rule).
 * - Values are Trove's "YYYY-MM-DD" date keys in and out, so editors keep
 *   their existing state and validation untouched.
 * - Field chrome (label, hint, error, required) matches `Input`.
 * - "Today" and "Clear" (optional fields only) in a popover footer.
 * - The trigger/popover shell is shared with TimePicker (PickerField.tsx):
 *   portalled so sheets never clip it, and Escape closes only the popover.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { PickerField } from "./PickerField";

/* ── date helpers (local calendar days, no dependencies) ── */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
};
const isSameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const dayKey = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;

/** "YYYY-MM-DD" → local Date (null when empty/invalid). */
export function parseDateKey(key: string | null | undefined): Date | null {
  const match = key ? /^(\d{4})-(\d{2})-(\d{2})/.exec(key) : null;
  if (!match) return null;
  const date = new Date(+match[1], +match[2] - 1, +match[3]);
  return Number.isNaN(+date) ? null : date;
}

/* ───────────────────────────── calendar ───────────────────────────── */

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  weekStartsOn = 0,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  weekStartsOn?: 0 | 1;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [dir, setDir] = useState<1 | -1>(1);
  const [focus, setFocus] = useState<Date>(value ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;
  const disabled = (d: Date) => (!!min && d < min) || (!!max && d > max);

  const y = view.getFullYear();
  const m = view.getMonth();
  const canPrev = !min || new Date(y, m, 0) >= min;
  const canNext = !max || new Date(y, m + 1, 1) <= max;

  const go = (target: Date, direction?: 1 | -1) => {
    setDir(direction ?? (target > view ? 1 : -1));
    setView(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  const monthFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }), []);
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: "full" }), []);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
    // 1 Aug 2021 is a Sunday.
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2021, 7, 1 + ((weekStartsOn + i) % 7))));
  }, [weekStartsOn]);

  const dim = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() - weekStartsOn + 7) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => {
    const n = i - offset + 1;
    return n < 1 || n > dim ? null : new Date(y, m, n);
  });
  const tabDate = isSameMonth(focus, view) ? focus : new Date(y, m, 1);

  const pick = (d: Date) => {
    if (disabled(d)) return;
    setFocus(d);
    onChange(d);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const element = (event.target as HTMLElement).closest<HTMLElement>("[data-date]");
    if (!element) return;
    const current = parseDateKey(element.dataset.date);
    if (!current) return;
    const col = (current.getDay() - weekStartsOn + 7) % 7;
    let next: Date | null = null;
    if (event.key === "ArrowLeft") next = addDays(current, -1);
    else if (event.key === "ArrowRight") next = addDays(current, 1);
    else if (event.key === "ArrowUp") next = addDays(current, -7);
    else if (event.key === "ArrowDown") next = addDays(current, 7);
    else if (event.key === "Home") next = addDays(current, -col);
    else if (event.key === "End") next = addDays(current, 6 - col);
    else if (event.key === "PageUp") next = addMonths(current, event.shiftKey ? -12 : -1);
    else if (event.key === "PageDown") next = addMonths(current, event.shiftKey ? 12 : 1);
    if (!next) return;
    event.preventDefault();
    if (min && next < min) next = min;
    if (max && next > max) next = max;
    shouldFocus.current = true;
    setFocus(next);
    if (!isSameMonth(next, view)) go(next);
  };

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${dayKey(focus)}"]`)?.focus();
  }, [focus, view]);

  const slideClass = dir === 1 ? "animate-cal-next" : "animate-cal-prev";

  return (
    <div className="w-fit select-none p-3">
      <div className="mb-2 flex h-8 items-center gap-1">
        <NavButton label="Previous month" disabled={!canPrev} onClick={() => go(addMonths(view, -1), -1)}>
          <ChevronLeft className="h-4 w-4" />
        </NavButton>
        <div className="relative h-5 flex-1 overflow-hidden text-center text-sm font-semibold text-ink">
          <span key={y * 12 + m} aria-live="polite" className={`absolute inset-0 ${slideClass}`}>
            {monthFmt.format(view)}
          </span>
        </div>
        <NavButton label="Next month" disabled={!canNext} onClick={() => go(addMonths(view, 1), 1)}>
          <ChevronRight className="h-4 w-4" />
        </NavButton>
      </div>

      <div className="flex" aria-hidden="true">
        {weekdays.map((w, i) => (
          <div key={i} className="grid h-8 w-9 place-items-center text-[11px] font-medium text-faint">
            {w}
          </div>
        ))}
      </div>

      <div className="-m-1 overflow-hidden p-1">
        <div ref={gridRef} role="grid" aria-label={monthFmt.format(view)} onKeyDown={onKeyDown} className="relative h-[216px]">
          <div key={y * 12 + m} className={`absolute inset-0 ${slideClass}`}>
            {Array.from({ length: 6 }, (_, r) => (
              <div key={r} role="row" className="flex">
                {cells.slice(r * 7, r * 7 + 7).map((d, col) => {
                  if (!d) return <div key={col} role="gridcell" className="h-9 w-9" />;
                  const picked = isSameDay(d, value);
                  const off = disabled(d);
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={col} role="gridcell" aria-selected={picked} className="relative h-9 w-9">
                      <button
                        type="button"
                        data-date={dayKey(d)}
                        tabIndex={isSameDay(d, tabDate) ? 0 : -1}
                        aria-label={dayFmt.format(d)}
                        aria-disabled={off || undefined}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => pick(d)}
                        className={`group relative grid h-9 w-9 place-items-center rounded-[10px] text-[13px] tabular-nums outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--ring-focus)/0.7)] ${
                          picked ? "font-semibold text-primary-contrast" : "text-ink"
                        } ${!picked && !off ? "hover:bg-surface-sunken" : ""} ${off ? "cursor-not-allowed opacity-30" : ""}`}
                      >
                        {picked && <span aria-hidden="true" className="absolute inset-0 animate-cal-pill rounded-[10px] bg-primary" />}
                        <span className="relative transition-transform duration-fast group-active:scale-90">{d.getDate()}</span>
                        {isToday && !picked && <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted outline-none hover:bg-surface-sunken hover:text-ink focus-visible:shadow-[0_0_0_2px_rgb(var(--ring-focus)/0.7)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── picker ───────────────────────────── */

const triggerFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export interface DatePickerProps {
  label?: ReactNode;
  /** "YYYY-MM-DD", or "" for no date. */
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  /** "YYYY-MM-DD" bounds. */
  min?: string;
  max?: string;
  weekStartsOn?: 0 | 1;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder = "Pick a date",
  min,
  max,
  weekStartsOn = 0,
  disabled,
  className = "",
}: DatePickerProps) {
  const date = parseDateKey(value);
  const minDate = parseDateKey(min);
  const maxDate = parseDateKey(max);

  return (
    <PickerField
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
      icon={<CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />}
      text={date ? triggerFmt.format(date) : null}
      placeholder={placeholder}
      popoverLabel={typeof label === "string" ? `Choose ${label.toLowerCase()}` : "Choose date"}
      focusSelector='[role="grid"] button[tabindex="0"]'
    >
      {({ closeSoon, closeNow }) => (
        <>
          <Calendar
            value={date}
            minDate={minDate}
            maxDate={maxDate}
            weekStartsOn={weekStartsOn}
            onChange={(next) => {
              onChange(dayKey(next));
              closeSoon();
            }}
          />
          <div className="flex items-center justify-between gap-2 border-t border-line/70 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                const today = startOfDay(new Date());
                if ((minDate && today < startOfDay(minDate)) || (maxDate && today > startOfDay(maxDate))) return;
                onChange(dayKey(today));
                closeSoon();
              }}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary-soft-bg"
            >
              Today
            </button>
            {!required && value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  closeNow(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted hover:bg-surface-sunken hover:text-ink"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </>
      )}
    </PickerField>
  );
}
