import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, clamp, ease, fontFamily } from "../theme";

/**
 * Vector redraw of the Trove sprout mark (web/public/icons/icon-512.png),
 * split into stem / leaf / leaf so it can grow. 512-unit artboard.
 */
const STEM = "M228 285 C 250 290 262 298 262 322 L 262 360 L 276 360 L 276 322 C 276 302 274 292 278 282 Z";
const LEAF_DARK =
  "M125 151 C 205 150 262 178 268 262 L 270 300 C 258 290 244 288 228 285 C 162 272 128 225 125 151 Z";
const RIB_DARK = "M176 196 C 224 206 260 238 274 278 C 250 246 220 218 176 196 Z";
const LEAF_SAGE = "M387 187 C 328 186 280 214 272 296 C 292 288 340 284 364 252 C 380 232 386 210 387 187 Z";
const RIB_SAGE = "M346 213 C 312 228 290 250 276 280 C 296 254 316 234 346 213 Z";

export const SproutMark: React.FC<{
  size: number;
  /** frame the growth starts; omit for a static mark */
  start?: number;
  bg?: string;
  dark?: string;
  light?: string;
}> = ({ size, start, bg = C.cream, dark = C.forest, light = C.sage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = start ?? -1000;
  const stem = interpolate(frame, [s, s + 22], [0, 1], { ...clamp, easing: ease.out });
  const l1 = spring({ frame: frame - s - 12, fps, config: { damping: 13, stiffness: 120 } });
  const l2 = spring({ frame: frame - s - 20, fps, config: { damping: 13, stiffness: 120 } });
  const rib = interpolate(frame, [s + 30, s + 46], [0, 1], clamp);
  return (
    <svg width={size} height={size} viewBox="110 130 292 245" style={{ overflow: "visible" }}>
      <g style={{ transformOrigin: "269px 360px", scale: `1 ${stem}` }}>
        <path d={STEM} fill={dark} />
      </g>
      <g style={{ transformOrigin: "268px 292px", scale: `${l1}`, rotate: `${(1 - l1) * 24}deg` }}>
        <path d={LEAF_DARK} fill={dark} />
        <path d={RIB_DARK} fill={bg} opacity={rib} />
      </g>
      <g style={{ transformOrigin: "274px 292px", scale: `${l2}`, rotate: `${(1 - l2) * -24}deg` }}>
        <path d={LEAF_SAGE} fill={light} />
        <path d={RIB_SAGE} fill={bg} opacity={rib} />
      </g>
    </svg>
  );
};

/** Mark + wordmark lockup, matching the app's sidebar brand (Inter 600, -0.03em). */
export const Lockup: React.FC<{ start: number; size: number; color?: string; bg?: string }> = ({
  start,
  size,
  color = C.forest,
  bg = C.cream,
}) => {
  const frame = useCurrentFrame();
  const word = interpolate(frame, [start + 26, start + 70], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.08 }}>
      <SproutMark size={size} start={start} bg={bg} />
      <div style={{ overflow: "hidden", paddingRight: size * 0.06 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: size * 0.82,
            lineHeight: 1,
            letterSpacing: `${interpolate(word, [0, 1], [0.04, -0.035])}em`,
            color,
            translate: `${(1 - word) * -40}% 0`,
            opacity: word,
            paddingBottom: size * 0.06,
          }}
        >
          Trove
        </div>
      </div>
    </div>
  );
};
