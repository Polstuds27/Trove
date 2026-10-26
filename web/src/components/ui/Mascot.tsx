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
  /** Optional circle behind the figure; sprites are never cropped. */
  circle?: boolean;
  style?: CSSProperties;
}

export function Mascot({ state, pose = "idle", size = 128, className = "", label, circle = false, style }: MascotProps) {
  const src = mascotSrc(state ?? pose);
  const semantic = (state ?? pose) as keyof typeof MASCOTS;
  const alt = label ?? (MASCOTS[semantic]?.name ? `Trove mascot: ${MASCOTS[semantic].name}` : undefined);

  return (
    <figure
      aria-hidden={label === undefined && alt === undefined}
      aria-label={alt}
      className={`relative m-0 shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {circle && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-sage-light/80 shadow-inner"
        />
      )}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className="relative block h-full w-full object-contain"
      />
    </figure>
  );
}
