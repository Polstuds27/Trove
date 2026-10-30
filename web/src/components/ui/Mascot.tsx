import type { CSSProperties } from "react";
import { MASCOTS, mascotSrc, type MascotName, type MascotState } from "../../lib/mascot";

export type MascotPose = MascotName | string;

interface MascotProps {
  /** Semantic state (preferred). */
  state?: MascotState;
  /** Semantic sprite name or a legacy pose alias. */
  pose?: MascotPose;
  size?: number;
  className?: string;
  label?: string;
  style?: CSSProperties;
}

export function Mascot({ state, pose = "idle", size = 128, className = "", label, style }: MascotProps) {
  const src = mascotSrc(state ?? pose);
  const semantic = (state ?? pose) as keyof typeof MASCOTS;
  const alt = label ?? (MASCOTS[semantic]?.name ? `Trove mascot: ${MASCOTS[semantic].name}` : undefined);

  // Callers position mascots absolutely inside cards. "relative" is only the
  // default: emitting both made the default win in the cascade and dropped
  // every free-standing mascot into the text flow.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);

  return (
    <figure
      aria-hidden={label === undefined && alt === undefined}
      aria-label={alt}
      className={`${positioned ? "" : "relative"} m-0 shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <img
        /* Keyed by sprite: a changed expression gets a short cross-fade instead
           of snapping, and a first appearance fades in once. */
        key={src}
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className="relative block h-full w-full animate-mascot-in object-contain"
      />
    </figure>
  );
}
