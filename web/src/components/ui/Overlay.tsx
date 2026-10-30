import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePresence } from "../../lib/usePresence";
import { IconButton } from "./Button";
import { acquireDialog, isTopDialog } from "./dialogLayer";

type OverlaySize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<OverlaySize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

const TITLES: Record<OverlaySize, string> = {
  sm: "w-full max-w-md",
  md: "w-full max-w-xl",
  lg: "w-full max-w-3xl",
  xl: "w-full max-w-5xl",
};

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: OverlaySize;
  /** `sheet` slides up on mobile, `drawer` slides in from the right, `center` is a plain modal. */
  variant?: "center" | "sheet" | "drawer";
  /** Disables backdrop/Escape dismissal while a destructive action runs. */
  busy?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "center",
  busy,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogId = useRef(Symbol("dialog"));
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  // Dismissal keeps the panel mounted for one short exit animation.
  const { mounted, closing } = usePresence(open, 200);
  // Callbacks arrive as fresh closures from most call sites (inline
  // `onClose={() => ...}`); reading them through refs keeps the lifecycle
  // effect independent of their identity. Before this, EVERY parent render
  // tore the effect down and rebuilt it — and the teardown re-focused the
  // opener while the setup timer focused the panel, so typing a single
  // character into any sheet input dismissed the mobile keyboard.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const visual = window.visualViewport;
    if (!open || !visual) return;
    // Mobile keyboards resize the visual viewport, often without changing
    // CSS vh/dvh. Keep the sheet and its scroll area above the keyboard.
    const resize = () => setViewport({ height: visual.height, top: visual.offsetTop });
    resize();
    visual.addEventListener("resize", resize);
    visual.addEventListener("scroll", resize);
    return () => {
      visual.removeEventListener("resize", resize);
      visual.removeEventListener("scroll", resize);
    };
  }, [open]);
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isTopDialog(dialogId.current)) return;
    if (event.key === "Escape" && !busyRef.current) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      onCloseRef.current();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    // Keep focus inside the dialog: money entry must not wander into the page behind.
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => node.offsetParent !== null,
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = dialogId.current;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const release = acquireDialog(id);
    document.addEventListener("keydown", handleKeyDown, true);

    const timer = window.setTimeout(() => {
      // Focus an explicit target only; falling back to the panel div steals
      // focus from whatever the user is typing into.
      if (isTopDialog(id)) panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 20);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const wasTop = isTopDialog(id);
      release();
      window.clearTimeout(timer);
      if (wasTop && restoreFocus.current?.isConnected) restoreFocus.current.focus({ preventScroll: true });
    };
  }, [open, handleKeyDown]);

  if (!mounted) return null;

  const backdropAnim = closing ? "animate-fade-out" : "animate-fade-in";

  const shell =
    variant === "sheet"
      ? "items-end justify-center sm:items-stretch sm:justify-end"
      : variant === "drawer"
        ? "items-stretch justify-end"
        : "items-end justify-center sm:items-center sm:p-6";

  const panel = variant === "center" ? SIZES[size] : TITLES[size];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${shell} ${closing ? "pointer-events-none" : ""}`}
      style={viewport ? { height: viewport.height, top: viewport.top, bottom: "auto" } : undefined}
      aria-hidden={closing || undefined}
    >
      <div
        className={`absolute inset-0 bg-overlay/20 ${backdropAnim}`}
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={`relative flex min-h-0 w-full max-h-[92%] flex-col overflow-hidden border border-line bg-surface shadow-lg outline-none ${
          variant === "sheet"
            ? `rounded-t-2xl sm:h-full sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none ${closing ? "animate-slide-down sm:animate-slide-right" : "animate-slide-up sm:animate-slide-left"}`
            : variant === "drawer"
              ? `h-full max-h-full rounded-l-2xl ${closing ? "animate-slide-right" : "animate-slide-left"}`
              : `rounded-2xl sm:rounded-2xl ${closing ? "animate-panel-out" : "animate-panel-in"}`
        } ${panel}`}
      >
        {variant === "sheet" && (
          <div aria-hidden="true" className="flex justify-center pt-2 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
        )}

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-title text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} disabled={busy} className="-mr-1.5 -mt-1">
            <X className="h-5 w-5" />
          </IconButton>
        </header>

        <div className="scroll-area min-h-0 flex-1 overflow-x-hidden px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-4">{children}</div>

        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmOverlay({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  busy,
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  tone?: "danger" | "primary";
}) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      variant="center"
      busy={busy}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            data-autofocus
            className={tone === "danger" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
    </Overlay>
  );
}
