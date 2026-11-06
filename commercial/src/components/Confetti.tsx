import React from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

const COLORS = [C.forest, C.sage, C.sand, "#C9B08F", C.creamHi];

/**
 * Deterministic confetti: seeded pieces, closed-form ballistic motion with drag,
 * paper flutter via rotateX. No state, so any frame renders identically.
 */
export const Confetti: React.FC<{
  at: number;
  x: number;
  y: number;
  count?: number;
  spread?: number;
  power?: number;
  seed?: string;
}> = ({ at, x, y, count = 64, spread = 1, power = 1, seed = "c" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - at) / fps;
  if (t < 0 || t > 3.2) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const ang = (-90 + (r("a") - 0.5) * 120 * spread) * (Math.PI / 180);
        const v = (900 + r("v") * 900) * power;
        const k = 2.2; // drag
        const vx = Math.cos(ang) * v;
        const vy = Math.sin(ang) * v;
        const decay = (1 - Math.exp(-k * t)) / k;
        const g = 900;
        const px = vx * decay + Math.sin(t * (3 + r("w") * 4) + r("p") * 6) * 24 * t;
        const py = vy * decay + (g / k) * (t - decay);
        const leaf = r("s") > 0.7;
        const w = leaf ? 14 + r("w2") * 8 : 9 + r("w2") * 9;
        const h = leaf ? w * 0.55 : w * (0.4 + r("h") * 0.5);
        const fade = Math.min(1, Math.max(0, (3.2 - t) / 0.8));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: w,
              height: h,
              borderRadius: leaf ? "0 100% 0 100%" : 2,
              background: COLORS[Math.floor(r("c") * COLORS.length)],
              opacity: fade,
              rotate: `${r("r") * 360 + t * (180 + r("rs") * 360)}deg`,
              transform: `rotateX(${t * (400 + r("rx") * 500)}deg)`,
              boxShadow: "0 1px 1px rgba(30,53,41,0.12)",
            }}
          />
        );
      })}
    </div>
  );
};
