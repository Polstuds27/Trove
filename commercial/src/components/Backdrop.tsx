import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";

/** Warm paper ground with a soft top-left key light and a very fine static grain. */
export const Paper: React.FC<{ tone?: "cream" | "sand" }> = ({ tone = "cream" }) => {
  const base = tone === "cream" ? C.cream : "#F1E6D6";
  return (
    <AbsoluteFill style={{ background: base }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 18% 8%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 55%), radial-gradient(90% 80% at 100% 110%, rgba(223,197,173,0.45) 0%, rgba(223,197,173,0) 60%)",
        }}
      />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export const Forest: React.FC = () => (
  <AbsoluteFill style={{ background: C.forest }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(90% 80% at 30% 20%, rgba(155,167,138,0.28) 0%, rgba(155,167,138,0) 60%), radial-gradient(80% 70% at 90% 100%, rgba(10,22,15,0.45) 0%, rgba(10,22,15,0) 60%)",
      }}
    />
    <Grain opacity={0.07} />
  </AbsoluteFill>
);

/** Static (frame-independent) SVG noise — no flicker, cheap to render. */
const Grain: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "multiply" }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);
