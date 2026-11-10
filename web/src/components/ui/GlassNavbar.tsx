/**
 * Floating glass navbar for marketing pages.
 *
 * Adapted from EasyUI's `GlassNavbar` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: the sticky floating pill bar with a
 * blurred glass surface, brand / links / call-to-action layout, the highlight
 * pill that glides to whichever link you hover and back to the active one,
 * optional per-link badges, and the mobile menu (toggle icon swap, menu that
 * drops open, Escape and link taps close it). Trove changes:
 * - Scroll-spy: the active link follows the section in view, not just the
 *   last click (including the short final section at the page bottom).
 * - Framer Motion `layoutId` pills became one measured element with CSS
 *   transitions; the menu opens with a grid-rows height transition; reduced
 *   motion collapses both.
 * - Trove glass tokens, light and dark; no page scroll lock (the menu is part
 *   of the bar, not a full-screen sheet).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

export interface GlassNavItem {
  label: string;
  /** In-page anchor ("#features") or URL. */
  href: string;
  badge?: ReactNode;
}

export function GlassNavbar({
  brand,
  items,
  cta,
  mobileCta,
}: {
  brand: ReactNode;
  items: GlassNavItem[];
  /** Right-hand actions on desktop. */
  cta?: ReactNode;
  /** Actions at the bottom of the mobile menu (defaults to `cta`). */
  mobileCta?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const linksRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Closed menu: not focusable or announced (React 18 has no `inert` prop).
  useEffect(() => {
    menuRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  // Scroll-spy: the last section whose top has passed ~35% of the viewport
  // is active; at the very bottom of the page the last section wins (short
  // final sections can never scroll that far). rAF-throttled, passive.
  // Keyed on the targets, not the array, so inline `items` don't resubscribe.
  const hrefKey = items.map((item) => item.href).join("|");
  useEffect(() => {
    const ids = hrefKey.split("|").filter((href) => href.startsWith("#")).map((href) => href.slice(1));
    if (ids.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current: string | null = null;
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }
      if (atBottom && document.getElementById(ids[ids.length - 1])) current = ids[ids.length - 1];
      setActive(current ? `#${current}` : null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [hrefKey]);

  // One highlight pill that glides to the hovered link, else the active one.
  const target = hovered ?? active;
  const measure = useCallback(() => {
    const container = linksRef.current;
    const link = target ? container?.querySelector<HTMLElement>(`[data-href="${target}"]`) : null;
    if (!container || !link) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    setPill({ left: link.offsetLeft, width: link.offsetWidth, visible: true });
  }, [target]);
  useLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);
  // Don't animate the very first placement (it would slide in from 0).
  useEffect(() => {
    if (pill.visible) placed.current = true;
  }, [pill.visible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="glass mx-auto max-w-[1080px] rounded-[22px] px-3 py-2 shadow-raised sm:px-4">
        <nav aria-label="Main" className="flex items-center justify-between gap-4">
          <div className="shrink-0">{brand}</div>

          {/* Desktop links with the gliding highlight. */}
          <div ref={linksRef} className="relative hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 rounded-xl border bg-surface-raised/80 ${
                hovered && hovered !== active ? "border-transparent" : "border-line/80 shadow-card"
              }`}
              style={{
                left: pill.left,
                width: pill.width,
                opacity: pill.visible ? 1 : 0,
                transition: placed.current
                  ? "left 260ms var(--ease-out-soft), width 260ms var(--ease-out-soft), opacity 160ms ease"
                  : "opacity 160ms ease",
              }}
            />
            {items.map((item) => {
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  data-href={item.href}
                  aria-current={isActive ? "location" : undefined}
                  onMouseEnter={() => setHovered(item.href)}
                  onFocus={() => setHovered(item.href)}
                  onBlur={() => setHovered(null)}
                  className={`relative z-10 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13.5px] font-medium outline-none transition-colors duration-fast focus-visible:shadow-[0_0_0_2px_rgb(var(--ring-focus)/0.6)] ${
                    isActive || hovered === item.href ? "text-primary" : "text-muted"
                  }`}
                >
                  {item.label}
                  {item.badge}
                </a>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">{cta}</div>

          {/* Mobile toggle. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="glass-nav-menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-raised/70 text-ink-soft hover:text-primary md:hidden"
          >
            <span key={open ? "x" : "menu"} className="animate-cal-pill">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </span>
          </button>
        </nav>

        {/* Mobile menu: grid-rows 0fr → 1fr animates height with no measuring. */}
        <div
          id="glass-nav-menu"
          className="grid transition-[grid-template-rows,opacity] duration-slow ease-out-soft md:hidden"
          style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
          ref={menuRef}
        >
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-col gap-1 border-t border-line/70 pb-1 pt-3">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active === item.href ? "location" : undefined}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium ${
                    active === item.href ? "bg-surface-raised text-primary shadow-card" : "text-ink-soft hover:bg-surface-raised/60"
                  }`}
                >
                  {item.label}
                  {item.badge}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-line/70 pt-3" onClick={() => setOpen(false)}>
                {mobileCta ?? cta}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
