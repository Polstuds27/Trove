/**
 * Motion helpers shared by the design system.
 *
 * `useStagger` and `useHaptics` are adapted from Amicro's `use-stagger` and
 * `use-web-haptics` hooks (MIT, (c) 2026 Syed Subhan Uddin,
 * github.com/Subhan-code/Amicro--Micro-transitions-). Changes: delays are
 * returned in milliseconds and capped so long lists never wait on animation;
 * haptics respect reduced motion and use only the short, quiet patterns.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function readReduced(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCE_QUERY).matches;
}

/** Live `prefers-reduced-motion` flag. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReduced);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(REDUCE_QUERY);
    const handler = () => setReduced(media.matches);
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

/**
 * Per-item entrance delays (ms). Only the first `cap` items are staggered: a
 * transaction list with 200 rows must not take seconds to settle.
 */
export function useStagger(count: number, { step = 28, cap = 8, base = 0 }: { step?: number; cap?: number; base?: number } = {}) {
  return useMemo(
    () => Array.from({ length: count }, (_, index) => base + Math.min(index, cap) * step),
    [count, step, cap, base],
  );
}

export type HapticKind = "light" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  success: [12, 50, 12],
  warning: [24, 60, 24],
};

/** Subtle vibration on supporting phones; a silent no-op everywhere else. */
export function useHaptics() {
  return useCallback((kind: HapticKind = "light") => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function" || readReduced()) return;
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      /* Vibration is best effort. */
    }
  }, []);
}
