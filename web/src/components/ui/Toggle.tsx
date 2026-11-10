/**
 * Toggle: an on/off switch whose knob is a liquid blob.
 *
 * Adapted from EasyUI's `LiquidToggle` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: the blob path builder (12 anchors,
 * midpoint-smoothed quadratic curves), the stretch along the travel axis with
 * a slight squash and wobble that only appears while moving, the springy
 * ~350ms travel with a little overshoot, the OFF / ON hints inside the track,
 * and Space/Enter/Arrow keys. Trove changes:
 * - No Framer Motion: a tiny requestAnimationFrame spring writes the path
 *   straight to the SVG (no React re-render per frame) and stops when settled.
 *   Reduced motion jumps straight to the end state.
 * - State is readable without motion or colour vision: the track tints and
 *   the blob changes colour when on, the hint text swaps, and it is a
 *   `role="switch"` with `aria-checked`.
 * - Theme tokens; an `onDark` tone for use on dark/gradient surfaces.
 * - Same props as Trove's previous Toggle (`checked`, `onChange`, `label`,
 *   `disabled`, `id`), so every existing switch keeps working.
 */
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../lib/motion";

const BLOB_POINTS = 12;

/** EasyUI's blob: `t` 0→1 is left→right, `stretch` 0→1 is how hard it moves. */
function buildBlobPath(width: number, height: number, t: number, stretch: number): string {
  const padding = 4;
  const leftX = padding + (height - padding * 2) / 2;
  const rightX = width - padding - (height - padding * 2) / 2;
  const cy = height / 2;
  const baseRadius = (height - padding * 2) / 2;
  const radiusX = baseRadius * (1 + stretch * 0.35);
  const radiusY = baseRadius * (1 - stretch * 0.12);
  const cx = leftX + (rightX - leftX) * t;

  const points: [number, number][] = [];
  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (Math.PI * 2 * i) / BLOB_POINTS - Math.PI / 2;
    const wobble = 1 + stretch * 0.18 * Math.sin(angle * 3 + t * Math.PI * 2);
    points.push([cx + Math.cos(angle) * radiusX * wobble, cy + Math.sin(angle) * radiusY * wobble]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(points[points.length - 1], points[0]);
  let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
  for (let i = 0; i < BLOB_POINTS; i++) {
    const ctrl = points[i];
    const end = mid(ctrl, points[(i + 1) % BLOB_POINTS]);
    d += ` Q ${ctrl[0].toFixed(2)} ${ctrl[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

const TONES = {
  default: {
    trackOff: "bg-surface-sunken border-line",
    trackOn: "bg-primary-soft-bg border-primary/30",
    blobOff: "rgb(var(--color-faint))",
    blobOn: "rgb(var(--color-primary))",
    textOff: "text-muted",
    textOn: "text-primary",
  },
  onDark: {
    trackOff: "bg-white/10 border-white/15",
    trackOn: "bg-white/25 border-white/30",
    blobOff: "rgba(255,255,255,0.7)",
    blobOn: "#ffffff",
    textOff: "text-white/55",
    textOn: "text-white/80",
  },
} as const;

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  tone = "default",
  showLabels = true,
  width = 64,
  height = 32,
  className = "",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name. */
  label: string;
  disabled?: boolean;
  id?: string;
  tone?: keyof typeof TONES;
  /** OFF / ON hints inside the track. */
  showLabels?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const pathRef = useRef<SVGPathElement>(null);
  const state = useRef({ t: checked ? 1 : 0, v: 0, stretch: 0, frame: 0 });
  const colors = TONES[tone];

  // Spring the blob toward its target and stretch it while it moves.
  useEffect(() => {
    const s = state.current;
    const target = checked ? 1 : 0;
    const draw = () => pathRef.current?.setAttribute("d", buildBlobPath(width, height, s.t, s.stretch));
    cancelAnimationFrame(s.frame);
    if (reduced) {
      s.t = target;
      s.v = 0;
      s.stretch = 0;
      draw();
      return;
    }
    // Spring constants from the original (stiffness 280, damping 24, mass 0.55).
    const k = 280;
    const c = 24;
    const m = 0.55;
    let last = performance.now();
    const step = (now: number) => {
      // Simulate the real elapsed time in small sub-steps, so a slow or
      // throttled device lands in the right place on time instead of lagging.
      let elapsed = Math.min(0.25, (now - last) / 1000);
      last = now;
      while (elapsed > 0) {
        const dt = Math.min(0.008, elapsed);
        elapsed -= dt;
        const force = -k * (s.t - target) - c * s.v;
        s.v += (force / m) * dt;
        s.t += s.v * dt;
        // Stretch follows speed and relaxes with time (≈ the original's 0.85 per 32ms).
        s.stretch = Math.max(Math.min(1, Math.abs(s.v) * 0.12), s.stretch * Math.pow(0.85, dt / 0.032));
      }
      draw();
      if (Math.abs(s.t - target) > 0.001 || Math.abs(s.v) > 0.01 || s.stretch > 0.01) {
        s.frame = requestAnimationFrame(step);
      } else {
        s.t = target;
        s.v = 0;
        s.stretch = 0;
        draw();
      }
    };
    s.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(s.frame);
  }, [checked, reduced, width, height]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if ((event.key === "ArrowRight" || event.key === "ArrowDown") && !checked) {
      event.preventDefault();
      onChange(true);
    } else if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && checked) {
      event.preventDefault();
      onChange(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onKeyDown={onKeyDown}
      className={`relative inline-flex shrink-0 cursor-pointer select-none items-center rounded-full border transition-colors duration-base disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? colors.trackOn : colors.trackOff
      } ${className}`}
      style={{ width, height }}
    >
      {showLabels && (
        // Each hint is centred in the free space beside the blob (blob is
        // `height - 8` wide plus 4px padding), so OFF never crowds the knob.
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 text-[9px] font-bold leading-none tracking-[0.02em]">
          <span
            className={`absolute inset-y-0 flex items-center justify-center transition-opacity duration-slow ${checked ? "opacity-0" : "opacity-75"} ${colors.textOff}`}
            style={{ left: height + 1, right: 4 }}
          >
            OFF
          </span>
          <span
            className={`absolute inset-y-0 flex items-center justify-center transition-opacity duration-slow ${checked ? "opacity-85" : "opacity-0"} ${colors.textOn}`}
            style={{ left: 1, right: height - 4 }}
          >
            ON
          </span>
        </span>
      )}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id={gradientId} cx="0.35" cy="0.35" r="0.85">
            <stop offset="0%" stopColor={checked ? colors.blobOn : colors.blobOff} stopOpacity="1" />
            <stop offset="100%" stopColor={checked ? colors.blobOn : colors.blobOff} stopOpacity="0.8" />
          </radialGradient>
        </defs>
        <path
          ref={pathRef}
          d={buildBlobPath(width, height, state.current.t, 0)}
          fill={`url(#${gradientId})`}
          style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.18))" }}
        />
      </svg>
    </button>
  );
}
