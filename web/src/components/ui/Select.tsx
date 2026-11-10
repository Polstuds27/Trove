/**
 * Select: a styled dropdown with the same API as a native <select>.
 *
 * Adapted from EasyUI's `SpringSelect` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: the trigger with a chevron that
 * rotates a hair past 180° before settling, the menu that slides down with a
 * slight overshoot, a check on the selected row, hover/active highlighting,
 * disabled rows, Arrow/Enter keyboard use and Escape returning focus.
 * Trove changes:
 * - Drop-in for the old native Select: same props (`label`, `hint`, `error`,
 *   `value`, `onChange`, `<option>` children). Options are read from the
 *   children and `onChange` receives `{ target: { value } }`, so every form
 *   keeps its handler and state untouched.
 * - Framer Motion springs became CSS (overshoot easing on the chevron and
 *   panel); reduced motion collapses them.
 * - Menu uses the shared PickerField shell: portalled so editor sheets never
 *   clip it, flips above when needed, Escape closes only the menu.
 * - Roving focus over option buttons, Home/End, PageUp/PageDown, and
 *   type-ahead (type letters to jump), which long lists such as currencies
 *   and categories need. A hidden native <select> keeps `name`/`required`
 *   and the forwarded ref meaningful.
 */
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { PickerField } from "./PickerField";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  addon?: ReactNode;
  fieldClassName?: string;
}

interface Option {
  value: string;
  label: string;
  disabled: boolean;
}

/** Flatten option children like `{a.name} · {a.currency}` into plain text. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function collectOptions(children: ReactNode, out: Option[] = []): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
    if (element.type === "option") {
      const label = textOf(element.props.children);
      out.push({
        value: element.props.value !== undefined ? String(element.props.value) : label,
        label,
        disabled: Boolean(element.props.disabled),
      });
    } else {
      // Fragments and wrappers.
      collectOptions(element.props.children, out);
    }
  });
  return out;
}

function OptionList({
  options,
  value,
  onPick,
}: {
  options: Option[];
  value: string;
  onPick: (option: Option) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const selectedIndex = options.findIndex((option) => option.value === value);

  useEffect(() => {
    // Open centred on the current choice.
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && row) list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
  }, []);

  const focusAt = (index: number) => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    if (!rows || rows.length === 0) return;
    const clamped = Math.max(0, Math.min(rows.length - 1, index));
    rows[clamped].focus();
    rows[clamped].scrollIntoView({ block: "nearest" });
  };
  const current = () => Number((document.activeElement as HTMLElement | null)?.dataset.index ?? selectedIndex);

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
    if (event.key in step) {
      event.preventDefault();
      focusAt(current() + step[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(options.length - 1);
    } else if (event.key.length === 1 && /\S/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Type-ahead: letters typed within 600ms build a prefix.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + event.key.toLowerCase(), at: now };
      const prefix = typed.current.text;
      const start = current() + (prefix.length === 1 ? 1 : 0);
      for (let i = 0; i < options.length; i++) {
        const index = (start + i) % options.length;
        if (options[index].label.replace(/^\W+/, "").toLowerCase().startsWith(prefix)) {
          focusAt(index);
          break;
        }
      }
    }
  };

  return (
    <div ref={listRef} role="listbox" onKeyDown={onKeyDown} className="scroll-area max-h-64 overflow-y-auto p-1">
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={`${option.value}-${index}`}
            type="button"
            role="option"
            data-index={index}
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
            onClick={() => !option.disabled && onPick(option)}
            onMouseEnter={(event) => event.currentTarget.focus({ preventScroll: true })}
            className={`flex min-h-[38px] w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-[14px] outline-none focus:bg-surface-sunken ${
              selected ? "font-semibold text-ink" : "text-ink-soft"
            } ${option.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          >
            <span className="min-w-0 truncate">{option.label}</span>
            {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 animate-cal-pill text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, addon, fieldClassName = "", className = "", children, required, value, defaultValue, onChange, disabled, name, ...rest },
  ref,
) {
  const options = useMemo(() => collectOptions(children), [children]);
  const current = value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? "");
  // Like a native select, an unmatched value shows the first option.
  const shown = options.find((option) => option.value === current) ?? options[0];
  const ariaLabel = rest["aria-label"];

  const pick = (option: Option) => {
    onChange?.({ target: { value: option.value }, currentTarget: { value: option.value } } as unknown as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <>
      <PickerField
        label={label}
        hint={hint}
        error={error}
        addon={addon}
        required={required}
        disabled={disabled}
        className={fieldClassName}
        triggerClassName={className}
        text={shown?.label ?? null}
        placeholder=""
        popup="listbox"
        matchWidth
        popoverLabel={typeof label === "string" ? label : (ariaLabel ?? "Options")}
        focusSelector='[role="option"][tabindex="0"]'
        popoverClassName="animate-select-in rounded-[14px] origin-top"
        renderTrailing={(open) => (
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted transition-transform duration-slow"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              // Overshoot past 180° before settling (SpringSelect's flourish).
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        )}
      >
        {({ closeNow }) => (
          <OptionList
            options={options}
            value={current}
            onPick={(option) => {
              pick(option);
              closeNow(true);
            }}
          />
        )}
      </PickerField>
      {/* Native mirror: keeps name/required/ref semantics for any form code. */}
      <select
        ref={ref}
        name={name}
        required={required}
        disabled={disabled}
        value={current}
        onChange={() => undefined}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      >
        {children}
      </select>
    </>
  );
});
