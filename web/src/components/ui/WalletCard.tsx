/**
 * Account "wallet" card: dark frame, layered gradient surface, balance.
 *
 * Adapted from EasyUI's `WalletCard` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: the dark outer frame with header and
 * pill action, the inset gradient "card" with a soft glow bloom and diagonal
 * specular sweep, the pointer-following shine, the iOS-style toggle and the
 * light-weight balance type. Trove changes:
 * - Palette: the blue/cyan art is replaced by Forest/Sage/Sand/Clay surfaces
 *   chosen per account type (still decorative; never real card branding).
 * - No "Mastercard ending 3040": the subtitle shows only what Trove stores
 *   (bank name, account type, currency). No card numbers are invented.
 * - The toggle is real: it hides/shows the balance (privacy on a shared
 *   screen), as an accessible switch, remembered per device.
 * - Framer Motion's MotionValue shine is a CSS variable updated on pointer
 *   move (no React re-render per frame); disabled for reduced motion/touch.
 */
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../lib/motion";
import { Toggle } from "./Toggle";

export type WalletTheme = "forest" | "sage" | "sand" | "clay" | "slate";

/** Decorative surface art per theme: base gradient + glow colour (RGB). */
const THEMES: Record<WalletTheme, { surface: string; glow: string }> = {
  forest: {
    surface:
      "radial-gradient(ellipse 34% 68% at 88% 38%, rgba(155,181,135,0.95) 0%, rgba(110,139,90,0.75) 22%, rgba(41,71,55,0.4) 46%, transparent 70%), radial-gradient(ellipse 48% 75% at 63% 72%, rgba(36,74,55,0.95) 0%, rgba(41,71,55,0.6) 45%, transparent 72%), linear-gradient(145deg, #2f553f 0%, #294737 45%, #1f3a2c 100%)",
    glow: "155 181 135",
  },
  sage: {
    surface:
      "radial-gradient(ellipse 34% 68% at 88% 38%, rgba(226,233,220,0.9) 0%, rgba(155,167,138,0.8) 24%, rgba(110,139,90,0.45) 48%, transparent 70%), radial-gradient(ellipse 48% 75% at 63% 72%, rgba(84,110,74,0.95) 0%, rgba(96,122,82,0.6) 45%, transparent 72%), linear-gradient(145deg, #6e8b5a 0%, #5b7a4b 45%, #4a6640 100%)",
    glow: "226 233 220",
  },
  sand: {
    surface:
      "radial-gradient(ellipse 34% 68% at 88% 38%, rgba(248,230,218,0.95) 0%, rgba(223,197,173,0.85) 24%, rgba(201,160,128,0.5) 48%, transparent 70%), radial-gradient(ellipse 48% 75% at 63% 72%, rgba(120,92,66,0.9) 0%, rgba(150,116,86,0.55) 45%, transparent 72%), linear-gradient(145deg, #a07e5f 0%, #8a6a4e 45%, #6f553f 100%)",
    glow: "248 230 218",
  },
  clay: {
    surface:
      "radial-gradient(ellipse 34% 68% at 88% 38%, rgba(242,190,160,0.95) 0%, rgba(201,140,100,0.8) 24%, rgba(181,88,47,0.45) 48%, transparent 70%), radial-gradient(ellipse 48% 75% at 63% 72%, rgba(110,52,30,0.95) 0%, rgba(140,66,36,0.6) 45%, transparent 72%), linear-gradient(145deg, #9c4a29 0%, #833d22 45%, #6a311c 100%)",
    glow: "242 190 160",
  },
  slate: {
    surface:
      "radial-gradient(ellipse 34% 68% at 88% 38%, rgba(190,210,230,0.9) 0%, rgba(133,164,205,0.75) 24%, rgba(69,104,142,0.45) 48%, transparent 70%), radial-gradient(ellipse 48% 75% at 63% 72%, rgba(40,62,88,0.95) 0%, rgba(52,80,112,0.6) 45%, transparent 72%), linear-gradient(145deg, #45688e 0%, #3a5878 45%, #2e4762 100%)",
    glow: "190 210 230",
  },
};

/** Account type → card art. Liabilities read warm (clay) at a glance. */
export function walletThemeFor(type: string): WalletTheme {
  switch (type) {
    case "cash":
      return "sage";
    case "ewallet":
      return "sand";
    case "savings":
    case "deposit":
    case "investment":
      return "slate";
    case "credit":
    case "loan":
      return "clay";
    default:
      return "forest";
  }
}

const HIDE_KEY = "trove_hide_balances";

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function WalletCard({
  title,
  subtitle,
  balance,
  balanceLabel,
  theme = "forest",
  action,
  footer,
  className = "",
}: {
  title: string;
  subtitle?: string;
  /** Pre-formatted balance (formatMoney). */
  balance: string;
  balanceLabel: string;
  theme?: WalletTheme;
  /** Pill action in the header (e.g. Transfer). */
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  /** Small line under the balance label (e.g. opening balance). */
  footer?: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(readHidden);
  const art = THEMES[theme];

  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    try {
      localStorage.setItem(HIDE_KEY, next ? "1" : "0");
    } catch {
      /* Per-device convenience only. */
    }
  };

  // Shine follows the pointer through CSS variables: no per-frame renders.
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const element = surfaceRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
    element.style.setProperty("--shine-o", "1");
  };
  const onLeave = () => surfaceRef.current?.style.setProperty("--shine-o", "0");

  return (
    <article
      className={`relative isolate flex min-h-[236px] w-full flex-col overflow-hidden rounded-[26px] bg-[#0f1712] text-white shadow-[0_24px_42px_rgba(15,23,18,0.32),0_8px_20px_rgba(15,23,18,0.18)] sm:min-h-[260px] ${className}`}
    >
      {/* Header: title, subtitle, action. */}
      <div className="relative z-10 flex items-start justify-between gap-3 px-[22px] pb-4 pt-[20px]">
        <div className="min-w-0">
          <h2 className="truncate text-[20px] font-medium leading-[1.1] tracking-[-0.025em] text-white/90">{title}</h2>
          {subtitle && <p className="mt-[6px] truncate text-[12px] leading-[1.2] text-white/45">{subtitle}</p>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex min-h-[35px] shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f4eedf,#e2e9dc)] px-4 text-[12px] font-semibold text-[#1f2f26] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_3px_9px_rgba(0,0,0,0.25)] hover:-translate-y-px hover:brightness-105 active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>

      {/* Inset gradient "card" surface. */}
      <div
        ref={surfaceRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative mx-1 mb-1 flex-1 overflow-hidden rounded-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_1px_rgba(0,0,0,0.14)]"
        style={{ background: art.surface }}
      >
        {/* Pointer shine. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-base"
          style={{
            opacity: "var(--shine-o, 0)",
            background: `radial-gradient(220px circle at var(--shine-x, -1000px) var(--shine-y, -1000px), rgb(${art.glow} / 0.2), transparent 70%)`,
          }}
        />
        {/* Glow bloom. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[10%] -inset-y-[20%] -z-10 rotate-[-9deg] blur-[18px]"
          style={{ background: `radial-gradient(ellipse 24% 58% at 73% 38%, rgb(${art.glow} / 0.6), transparent 72%)` }}
        />
        {/* Diagonal specular sweep. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(124deg,transparent_0%,rgba(255,255,255,0.025)_36%,rgba(255,255,255,0.07)_47%,transparent_59%)]"
        />

        {/* Privacy switch: the shared liquid toggle, on-dark tone. */}
        <div className="absolute left-[18px] top-[18px]">
          <Toggle checked={!hidden} onChange={toggleHidden} label="Show balance" tone="onDark" showLabels={false} width={47} height={27} />
        </div>

        {/* Balance. */}
        <div className="absolute bottom-[20px] left-[22px] right-[22px] flex flex-col items-start">
          <span className="tabular max-w-full truncate whitespace-nowrap text-[clamp(30px,4.2vw,40px)] font-light leading-[0.95] tracking-[-0.045em] text-white/90">
            {hidden ? <span aria-label="Balance hidden">••••••</span> : balance}
          </span>
          <span className="mt-[8px] text-[12px] leading-none text-white/55">{balanceLabel}</span>
          {footer && <span className="mt-1.5 text-[11px] leading-none text-white/45">{footer}</span>}
        </div>
      </div>
    </article>
  );
}
