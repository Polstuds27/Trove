import { useEffect, useState } from "react";

/**
 * Keeps a dismissed surface mounted for its exit animation, then unmounts it.
 *
 * `open` drives visibility. When it flips to false, `closing` is true for
 * `duration` ms so the caller can swap in an exit animation; `mounted` stays
 * true for that window and becomes false afterwards. Opening again mid-exit
 * cancels the timer and re-enters immediately.
 *
 * The caller is responsible for the animation itself — this only owns timing.
 */
export function usePresence(open: boolean, duration = 180) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;

    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, duration, mounted]);

  return { mounted, closing };
}
