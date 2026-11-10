/**
 * Time picker: same trigger + popover as DatePicker, with scrolling columns.
 *
 * None of the approved libraries ships a time picker (EasyUI, Watermelon,
 * OpenSource UI, Amicro and PanelUI were all checked), so this is Trove's own,
 * built on the shared PickerField shell (from EasyUI's DatePicker) so the two
 * pickers look and behave as one family.
 *
 * - Value is "HH:mm" (24-hour), exactly what the forms already store.
 * - Columns follow the device locale: hour / minute / AM-PM on 12-hour
 *   locales, hour / minute on 24-hour ones.
 * - Every minute is selectable (no rounding), so an existing time is never
 *   altered just by opening the picker.
 * - Each column is a listbox with roving focus: Up/Down (wraps), Home/End,
 *   PageUp/PageDown (±5), Tab to the next column. Choices apply immediately;
 *   "Done" or Escape closes. The selected row scrolls into the centre.
 */
import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Clock } from "lucide-react";
import { PickerField } from "./PickerField";

const pad = (n: number) => `${n}`.padStart(2, "0");

function parseTime(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? { h, m } : null;
}

function uses12Hour(): boolean {
  try {
    const cycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
    return cycle ? cycle === "h12" || cycle === "h11" : true;
  } catch {
    return true;
  }
}

interface Option {
  value: number;
  label: string;
}

function Column({
  label,
  options,
  selected,
  onSelect,
  hideLabel = false,
}: {
  label: string;
  hideLabel?: boolean;
  options: Option[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, options.findIndex((option) => option.value === selected));

  // Keep the selected row centred (instant on open, smooth afterwards).
  const first = useRef(true);
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!list || !row) return;
    list.scrollTo({
      top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2,
      behavior: first.current ? "auto" : "smooth",
    });
    first.current = false;
  }, [index]);

  const move = (next: number) => {
    const wrapped = (next + options.length) % options.length;
    onSelect(options[wrapped].value);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-index="${wrapped}"]`)?.focus({ preventScroll: true }));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
    if (event.key in step) {
      event.preventDefault();
      move(index + step[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(options.length - 1);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span aria-hidden="true" className={`mb-1 h-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint ${hideLabel ? "invisible" : ""}`}>
        {label}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="scroll-area relative h-[196px] w-[64px] snap-y snap-mandatory overflow-y-auto overscroll-contain py-[80px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option, i) => {
          const on = i === index;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              data-index={i}
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(option.value)}
              className={`relative mx-auto flex h-9 w-[56px] snap-center items-center justify-center rounded-[10px] text-[14px] tabular-nums outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--ring-focus)/0.7)] ${
                on ? "font-semibold text-primary-contrast" : "text-ink-soft hover:bg-surface-sunken"
              }`}
            >
              {on && <span aria-hidden="true" className="absolute inset-0 animate-cal-pill rounded-[10px] bg-primary" />}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const triggerFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export function TimePicker({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder = "Pick a time",
  disabled,
  className = "",
}: {
  label?: string;
  /** "HH:mm" (24-hour), or "" for none. */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const twelve = useMemo(uses12Hour, []);
  const time = parseTime(value);
  const h = time?.h ?? 12;
  const m = time?.m ?? 0;

  const hourOptions: Option[] = useMemo(
    () =>
      twelve
        ? Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))
        : Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad(i) })),
    [twelve],
  );
  const minuteOptions: Option[] = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad(i) })), []);
  const periodOptions: Option[] = useMemo(() => {
    const parts = (hour: number) =>
      new Intl.DateTimeFormat(undefined, { hour: "numeric", hour12: true }).formatToParts(new Date(2021, 0, 1, hour)).find((p) => p.type === "dayPeriod")?.value;
    return [
      { value: 0, label: parts(9) ?? "AM" },
      { value: 1, label: parts(21) ?? "PM" },
    ];
  }, []);

  const period = h >= 12 ? 1 : 0;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const set = (hours: number, minutes: number) => onChange(`${pad(hours)}:${pad(minutes)}`);

  const text = time ? triggerFmt.format(new Date(2021, 0, 1, time.h, time.m)) : null;

  return (
    <PickerField
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
      icon={<Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />}
      text={text}
      placeholder={placeholder}
      popoverLabel={label ? `Choose ${label.toLowerCase()}` : "Choose time"}
      focusSelector='[role="listbox"] [aria-selected="true"]'
    >
      {({ closeSoon, closeNow }) => (
        <>
          <div className="relative flex gap-1 px-3 pb-2 pt-3">
            <Column
              label="Hour"
              options={hourOptions}
              selected={twelve ? hour12 : h}
              onSelect={(next) => set(twelve ? (next % 12) + period * 12 : next, m)}
            />
            <span aria-hidden="true" className="mt-[100px] self-start text-[15px] font-semibold text-faint">
              :
            </span>
            <Column label="Min" options={minuteOptions} selected={m} onSelect={(next) => set(h, next)} />
            {twelve && (
              <Column label="AM or PM" hideLabel options={periodOptions} selected={period} onSelect={(next) => set((h % 12) + next * 12, m)} />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line/70 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                set(now.getHours(), now.getMinutes());
                closeSoon();
              }}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary-soft-bg"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => closeNow(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-contrast hover:bg-primary-hover"
            >
              Done
            </button>
          </div>
        </>
      )}
    </PickerField>
  );
}
