import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText, Eyebrow } from "../components/AnimatedText";
import { Paper } from "../components/Backdrop";
import { BrowserCard, Phone } from "../components/Devices";
import { C, clamp, ease, fontFamily } from "../theme";

/** Beats; captions are the landing page's own lines (web/src/features/landing). */
const BEATS = [
  { at: 0, word: "Track.", label: "Transactions", caption: "Log it as it happens.", route: "transactions" },
  { at: 150, word: "Plan.", label: "Budget", caption: "Budgets that warn early.", route: "budgets" },
  { at: 300, word: "Grow.", label: "Accounts", caption: "Every account in one place.", route: "accounts" },
];
const UNITE = 430; // all three words light up together

export const S3Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width;
  const active = BEATS.reduce((a, b, i) => (frame >= b.at ? i : a), 0);

  const phoneIn = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 70 } });
  const cardIn = spring({ frame: frame - 34, fps, config: { damping: 20, stiffness: 60 } });
  const push = interpolate(frame, [0, 500], [1, 1.035]);
  const unite = interpolate(frame, [UNITE, UNITE + 20], [0, 1], { ...clamp, easing: ease.out });
  // When S4 pushes in, this scene drifts left and dims.
  const leave = interpolate(frame, [470, 510], [0, 1], { ...clamp, easing: ease.inOut });

  const wordSize = portrait ? 132 : 168;
  const phoneH = portrait ? 1020 : 800;
  const cardW = portrait ? 900 : 940;

  const phoneScreens = BEATS.map((b) => ({ src: `ui/mobile-${b.route}.png`, at: b.at }));
  const cardScreens = BEATS.map((b) => ({ src: `ui/desktop-${b.route}.png`, at: b.at + 10 }));

  return (
    <AbsoluteFill style={{ translate: `${-leave * width * 0.25}px 0`, filter: `brightness(${1 - leave * 0.15})` }}>
      <Paper />
      <AbsoluteFill style={{ scale: `${push}`, transformOrigin: portrait ? "50% 70%" : "70% 50%" }}>
        {/* Product: desktop window behind, phone in front */}
        <BrowserCard
          screens={cardScreens}
          width={cardW}
          style={{
            left: portrait ? width - cardW * 0.62 : 880,
            top: portrait ? 900 : 230,
            translate: `${(1 - cardIn) * 220}px 0`,
            opacity: cardIn,
            rotate: portrait ? "0deg" : "0deg",
          }}
        />
        <Phone
          screens={phoneScreens}
          height={phoneH}
          style={{
            left: portrait ? 110 : 690,
            top: portrait ? 820 : 140,
            translate: `0 ${(1 - phoneIn) * (height * 0.7)}px`,
            rotate: `${(1 - phoneIn) * 6}deg`,
          }}
        />
      </AbsoluteFill>

      {/* Copy column */}
      <div style={{ position: "absolute", left: portrait ? 90 : 150, top: portrait ? 150 : 250 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "baseline", marginBottom: 34, height: 30, overflow: "hidden" }}>
          <Eyebrow color={C.forest} style={{ opacity: interpolate(frame, [10, 30], [0, 1], clamp) }}>
            0{active + 1} / 03
          </Eyebrow>
          <div style={{ position: "relative", width: 300, height: 30 }}>
            {BEATS.map((b, i) => {
              const inP = interpolate(frame, [b.at + 6, b.at + 26], [0, 1], { ...clamp, easing: ease.out });
              const next = BEATS[i + 1];
              const outP = next ? interpolate(frame, [next.at, next.at + 16], [0, 1], { ...clamp, easing: ease.in }) : 0;
              return (
                <Eyebrow
                  key={b.label}
                  color={C.muted}
                  style={{ position: "absolute", left: 0, top: 0, translate: `0 ${(1 - inP) * 100 - outP * 100}%`, opacity: inP * (1 - outP) }}
                >
                  {b.label}
                </Eyebrow>
              );
            })}
          </div>
        </div>
        {BEATS.map((b, i) => {
          const on =
            Math.max(
              interpolate(frame, [b.at, b.at + 14], [0, 1], clamp) *
                (BEATS[i + 1] ? interpolate(frame, [BEATS[i + 1].at, BEATS[i + 1].at + 14], [1, 0], clamp) : 1),
              unite,
            );
          return (
            <div key={b.word} style={{ opacity: 0.18 + 0.82 * on, height: wordSize * 1.04 }}>
              <AnimatedText
                text={b.word}
                start={8 + i * 8}
                size={wordSize}
                color={C.forest}
              />
            </div>
          );
        })}
        <div style={{ position: "relative", marginTop: 38, height: 60, width: portrait ? 900 : 640 }}>
          {BEATS.map((b, i) => {
            const inP = interpolate(frame, [b.at + 14, b.at + 40], [0, 1], { ...clamp, easing: ease.out });
            const next = BEATS[i + 1];
            const outP = next ? interpolate(frame, [next.at, next.at + 14], [0, 1], { ...clamp, easing: ease.in }) : 0;
            return (
              <div
                key={b.caption}
                style={{
                  position: "absolute",
                  fontFamily,
                  fontSize: portrait ? 40 : 38,
                  fontWeight: 500,
                  letterSpacing: "-0.015em",
                  color: C.muted,
                  opacity: inP * (1 - outP),
                  translate: `0 ${(1 - inP) * 24 - outP * 16}px`,
                  whiteSpace: "nowrap",
                }}
              >
                {b.caption}
              </div>
            );
          })}
        </div>
        {/* active indicator: a forest rule that grows with each beat */}
        <div style={{ marginTop: 26, width: 220, height: 4, borderRadius: 4, background: "rgba(41,71,55,0.12)" }}>
          <div
            style={{
              width: `${interpolate(frame, [0, 150, 300, 430], [0, 33.3, 66.6, 100], clamp)}%`,
              height: "100%",
              borderRadius: 4,
              background: C.forest,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
