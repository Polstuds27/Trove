/**
 * Shared trigger + popover shell for DatePicker and TimePicker.
 *
 * The popover behaviour comes from EasyUI's DatePicker shell (MIT, (c) 2026
 * Suraj Maurya): it pops from the trigger edge, flips above when there is no
 * room below, waits a short beat after a choice so the selection lands, then
 * closes and returns focus to the trigger. Trove additions: it is portalled to
 * <body> with fixed positioning so scrolling sheets never clip it, and while
 * open it owns the dialog layer, so Escape closes the popover rather than the
 * editor sheet it sits in.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Field } from "./Input";
import { acquireDialog } from "./dialogLayer";

export interface PickerApi {
  /** Close after a short beat (lets the selection animation land). */
  closeSoon: () => void;
  /** Close immediately, optionally returning focus to the trigger. */
  closeNow: (refocus: boolean) => void;
}

export function PickerField({
  label,
  hint,
  error,
  addon,
  required,
  disabled,
  className = "",
  icon,
  text,
  placeholder,
  popoverLabel,
  focusSelector,
  renderTrailing,
  matchWidth = false,
  popup = "dialog",
  triggerClassName = "",
  popoverClassName = "animate-panel-in rounded-2xl",
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  addon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  /** Trigger text; null shows the placeholder. */
  text: string | null;
  placeholder: string;
  popoverLabel: string;
  /** Element inside the popover to focus on open. */
  focusSelector?: string;
  /** Trailing trigger content (e.g. a chevron), given the open state. */
  renderTrailing?: (open: boolean) => ReactNode;
  /** Make the popover at least as wide as the trigger (menus). */
  matchWidth?: boolean;
  /** What the trigger opens, for aria-haspopup. */
  popup?: "dialog" | "listbox";
  triggerClassName?: string;
  /** Entrance animation + radius for the popover panel. */
  popoverClassName?: string;
  children: (api: PickerApi) => ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [position, setPosition] = useState<CSSProperties>({ visibility: "hidden" });

  const closeNow = useCallback((refocus: boolean) => {
    window.clearTimeout(timer.current);
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const closeSoon = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const active = document.activeElement;
      setOpen(false);
      if (!active || active === document.body || rootRef.current?.contains(active) || popoverRef.current?.contains(active)) {
        triggerRef.current?.focus();
      }
    }, 160);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    // Own the dialog layer: the editor sheet's Escape/Tab handler stands down.
    const release = acquireDialog(Symbol("picker"));
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) closeNow(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeNow(true);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    const frame = requestAnimationFrame(() => {
      if (focusSelector) popoverRef.current?.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      release();
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, closeNow, focusSelector]);

  // Fixed placement under the trigger; flips above, stays inside the viewport.
  useLayoutEffect(() => {
    if (!open) {
      setPosition({ visibility: "hidden" });
      return;
    }
    const place = () => {
      const trigger = triggerRef.current;
      const pop = popoverRef.current;
      if (!trigger || !pop) return;
      const rect = trigger.getBoundingClientRect();
      const width = pop.offsetWidth;
      const height = pop.offsetHeight;
      const gap = 8;
      const margin = 8;
      const below = window.innerHeight - rect.bottom - gap;
      const above = rect.top - gap;
      const flip = below < height && above > below;
      const top = flip ? Math.max(margin, rect.top - gap - height) : Math.min(rect.bottom + gap, window.innerHeight - height - margin);
      const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
      setPosition({
        top,
        left,
        minWidth: matchWidth ? rect.width : undefined,
        transformOrigin: `${flip ? "bottom" : "top"} ${left < rect.left ? "right" : "left"}`,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, matchWidth]);

  return (
    <Field label={label} hint={hint} error={error} addon={addon} htmlFor={id} required={required} className={className}>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup={popup}
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={`input flex items-center gap-2.5 text-left ${open ? "border-primary" : ""} ${error ? "input-error" : ""} ${triggerClassName}`}
        >
          {icon}
          <span className={`min-w-0 flex-1 truncate ${text ? "text-ink" : "text-faint"}`}>{text ?? placeholder}</span>
          {renderTrailing?.(open)}
        </button>

        {open &&
          createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={popoverLabel}
              style={position}
              className={`fixed z-[90] w-max max-w-[calc(100vw-1rem)] border border-line bg-surface-raised shadow-overlay ${popoverClassName}`}
            >
              {children({ closeSoon, closeNow })}
            </div>,
            document.body,
          )}
      </div>
    </Field>
  );
}
