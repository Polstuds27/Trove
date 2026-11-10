/**
 * Activity indicator.
 *
 * The twelve-spoke form is adapted from Amicro's `ios-spinner` (MIT, (c) 2026
 * Syed Subhan Uddin). Framer Motion opacity keyframes are swapped for one CSS
 * keyframe with staggered delays, and spoke colour follows the theme tokens.
 * With reduced motion the spokes stay still at graded opacity.
 */
const SPOKES = Array.from({ length: 12 }, (_, index) => index);

export function Spinner({ className = "h-4 w-4", label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={`trove-spinner relative inline-block shrink-0 ${className}`}>
      {SPOKES.map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className="absolute inset-0"
          style={{ transform: `rotate(${index * 30}deg)` }}
        >
          <span
            className="trove-spinner-spoke mx-auto block h-[28%] w-[9%] rounded-full bg-current"
            style={{ animationDelay: `${(index - 12) / 12}s`, opacity: 1 - index / 14 }}
          />
        </span>
      ))}
    </span>
  );
}

/** Full-region loader for route transitions that have nothing to show yet. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] animate-fade-in items-center justify-center [animation-delay:120ms]">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner className="h-7 w-7 text-ink-soft" label={label} />
        <p className="text-sm" aria-hidden="true">
          {label}…
        </p>
      </div>
    </div>
  );
}
