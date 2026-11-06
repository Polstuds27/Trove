import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { Paper } from "../components/Backdrop";
import { C, clamp, ease, fontFamily, shadow } from "../theme";

/** Real expenses from the demo ledger the UI screens were captured from. */
const CHIPS = [
  { label: "Puregold", amt: "−₱1,245.50", at: 70 },
  { label: "Running shoes", amt: "−₱1,899.00", at: 92 },
  { label: "Ramen", amt: "−₱540.00", at: 112 },
  { label: "Spotify", amt: "−₱549.00", at: 128 },
  { label: "Grab ride", amt: "−₱180.00", at: 142 },
  { label: "Condo rent", amt: "−₱14,000.00", at: 156 },
];

const CHIP_POS_L = [
  [0.14, 0.2], [0.72, 0.16], [0.83, 0.62], [0.1, 0.7], [0.62, 0.82], [0.34, 0.86],
];
const CHIP_POS_P = [
  [0.08, 0.14], [0.52, 0.22], [0.56, 0.7], [0.06, 0.62], [0.18, 0.84], [0.5, 0.88],
];

const GLYPHS = 16;
const EXIT = 270;

export const S1Question: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  // Everything converges toward the centre as the forest circle opens.
  const pull = interpolate(frame, [EXIT, EXIT + 44], [0, 1], { ...clamp, easing: ease.in });

  return (
    <AbsoluteFill>
      <Paper />
      {/* Peso glyphs: three depth planes, slow drift, gentle unease */}
      {new Array(GLYPHS).fill(0).map((_, i) => {
        const r = (k: string) => random(`peso-${i}-${k}`);
        const depth = r("d"); // 0 far … 1 near
        const size = 70 + depth * 240;
        const x0 = r("x") * width;
        const y0 = r("y") * height;
        const drift = frame * (0.15 + depth * 0.5);
        const sway = Math.sin(frame / 60 + r("p") * 6) * (10 + depth * 18);
        const appear = interpolate(frame, [r("t") * 70, r("t") * 70 + 40], [0, 1], { ...clamp, easing: ease.out });
        const x = x0 + sway + (width / 2 - x0) * pull;
        const y = y0 - drift + (height / 2 - y0) * pull;
        // Keep the title zone readable: glyphs that wander into it go faint.
        const dx = Math.abs(x - width / 2) / (width * (portrait ? 0.45 : 0.32));
        const dy = Math.abs(y - height / 2) / (height * (portrait ? 0.14 : 0.2));
        const nearTitle = Math.min(1, Math.max(dx, dy));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              fontFamily,
              fontWeight: 600,
              fontSize: size,
              lineHeight: 1,
              color: depth > 0.6 ? C.sage : C.warmGray,
              opacity: appear * (0.25 + depth * 0.55) * (0.25 + 0.75 * nearTitle) * (1 - pull),
              filter: depth < 0.35 ? `blur(${(0.35 - depth) * 14}px)` : undefined,
              rotate: `${(r("r") - 0.5) * 30 + Math.sin(frame / 80 + i) * 6}deg`,
              scale: `${1 - pull * 0.6}`,
            }}
          >
            ₱
          </div>
        );
      })}

      {/* Expense chips: real transactions, piling up */}
      {CHIPS.map((c, i) => {
        const [px, py] = (portrait ? CHIP_POS_P : CHIP_POS_L)[i];
        const p = interpolate(frame, [c.at, c.at + 26], [0, 1], { ...clamp, easing: ease.out });
        const x = px * width + (width / 2 - px * width) * pull;
        const y = py * height - frame * 0.25 + (height / 2 - py * height) * pull;
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: portrait ? "16px 24px" : "14px 22px",
              borderRadius: 999,
              background: C.creamHi,
              boxShadow: shadow.card,
              fontFamily,
              fontSize: portrait ? 30 : 26,
              fontWeight: 500,
              color: C.ink,
              opacity: p * (1 - pull),
              scale: `${(0.85 + 0.15 * p) * (1 - pull * 0.5)}`,
              translate: `0 ${(1 - p) * 30}px`,
              rotate: `${(random(`chip-${i}`) - 0.5) * 6}deg`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 99, background: C.sand }} />
            {c.label}
            <span style={{ color: C.expense, fontWeight: 600 }}>{c.amt}</span>
          </div>
        );
      })}

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ scale: `${1 - pull * 0.08}`, opacity: 1 - pull }}>
          <AnimatedText
            text={portrait ? "Where did\nmy money\ngo?" : "Where did my\nmoney go?"}
            start={24}
            stagger={7}
            size={portrait ? 150 : 168}
            color={C.forest}
            align="center"
            wordColors={portrait ? { 3: C.sage, 4: C.sage } : { 3: C.sage, 4: C.sage }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
