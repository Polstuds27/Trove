import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText, Eyebrow } from "../components/AnimatedText";
import { Paper } from "../components/Backdrop";
import { Confetti } from "../components/Confetti";
import { Phone } from "../components/Devices";
import { Mascot } from "../components/Mascot";
import { C, clamp, ease, fontFamily, shadow } from "../theme";

/**
 * Real figures from the demo ledger: "Japan trip" goal, ₱45,000 target,
 * three ₱5,500 contributions → ₱16,500 (37%), exactly as the Goals screen shows.
 */
const TARGET = 45000;
const WINS = [
  { at: 96, date: "Sep 2", total: 5500 },
  { at: 172, date: "Oct 2", total: 11000 },
  { at: 248, date: "Nov 1", total: 16500 },
];
const CELEBRATE = WINS[2].at + 8;

const peso = (n: number) =>
  "₱" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const S4Wins: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width;

  const enter = interpolate(frame, [0, 40], [0, 1], { ...clamp, easing: ease.inOut });
  const exit = interpolate(frame, [400, 440], [0, 1], { ...clamp, easing: ease.in });

  // Saved amount steps up with each win (30-frame count, expo-out).
  let saved = 0;
  for (const w of WINS) {
    const prev = saved;
    saved = interpolate(frame, [w.at, w.at + 30], [prev, w.total], { ...clamp, easing: ease.out });
    if (frame < w.at) {
      saved = prev;
      break;
    }
  }
  const pct = saved / TARGET;

  const cardIn = spring({ frame: frame - 34, fps, config: { damping: 20, stiffness: 80 } });
  const phoneIn = spring({ frame: frame - 50, fps, config: { damping: 20, stiffness: 70 } });

  const cardW = portrait ? 900 : 740;
  const cardX = portrait ? 90 : 150;
  const cardY = portrait ? 560 : 430;

  const ax = portrait ? 300 : 1125;
  const ay = portrait ? 1760 : 960;
  const ah = portrait ? 620 : 520;

  return (
    <AbsoluteFill
      style={{
        translate: `${(1 - enter) * width}px 0`,
        boxShadow: "-40px 0 80px rgba(30,53,41,0.18)",
        scale: `${1 - exit * 0.06}`,
        opacity: 1 - exit,
      }}
    >
      <Paper tone="sand" />

      <div style={{ position: "absolute", left: cardX, top: portrait ? 170 : 130 }}>
        <AnimatedText
          text={"Every little win\nmatters."}
          start={26}
          stagger={6}
          size={portrait ? 118 : 112}
          color={C.forest}
          wordColors={{ 3: C.sage }}
        />
      </div>

      {/* Goal card: motion-graphic version of the app's goal card, same data */}
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          padding: "44px 48px 40px",
          borderRadius: 40,
          background: C.creamHi,
          boxShadow: shadow.card,
          fontFamily,
          opacity: cardIn,
          translate: `0 ${(1 - cardIn) * 60}px`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 40, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>Japan trip</div>
          <div style={{ fontSize: 26, color: C.muted }}>
            Target <b style={{ color: C.ink, fontWeight: 600 }}>Apr 2027</b>
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: portrait ? 112 : 104,
            fontWeight: 650,
            letterSpacing: "-0.045em",
            color: C.forest,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {peso(Math.round(saved))}
        </div>
        <div style={{ marginTop: 14, fontSize: 28, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
          of {peso(TARGET)} · <b style={{ color: C.ink, fontWeight: 600 }}>{Math.round(pct * 100)}%</b>
        </div>
        <div style={{ marginTop: 30, height: 20, borderRadius: 20, background: "#ECE4D7", overflow: "hidden" }}>
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              borderRadius: 20,
              background: `linear-gradient(90deg, ${C.forest}, #33573F)`,
            }}
          />
        </div>
        <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {WINS.map((w, i) => {
            const p = spring({ frame: frame - w.at, fps, config: { damping: 12, stiffness: 160 } });
            return (
              <div
                key={w.date}
                style={{
                  padding: "12px 0",
                  borderRadius: 999,
                  background: i === 2 && frame >= CELEBRATE ? C.forest : "#EEF0E8",
                  color: i === 2 && frame >= CELEBRATE ? C.cream : C.forest,
                  fontSize: portrait ? 24 : 21,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  opacity: Math.min(1, p * 1.5),
                  scale: `${0.6 + 0.4 * Math.min(p, 1.04)}`,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  boxSizing: "border-box",
                  minWidth: 0,
                }}
              >
                +₱5,500 <span style={{ fontWeight: 500, opacity: 0.7 }}>· {w.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof: the real Goals screen */}
      <Phone
        screens={[{ src: "ui/mobile-goals.png", at: 0 }]}
        height={portrait ? 820 : 780}
        style={{
          left: portrait ? 560 : 1360,
          top: portrait ? 1090 : 150,
          translate: `0 ${(1 - phoneIn) * height * 0.6}px`,
          rotate: `${3 - (1 - phoneIn) * 4}deg`,
        }}
      />

      <Mascot
        x={ax}
        y={ay}
        height={ah}
        poses={[
          { at: 0, pose: "Bank-Happy" },
          { at: CELEBRATE, pose: "Celebrating" },
        ]}
        hops={[
          ...WINS.slice(0, 2).map((w) => ({ at: w.at + 2, height: ah * 0.07, dur: 22 })),
          { at: CELEBRATE + 2, height: ah * 0.3, dur: 40 },
          { at: CELEBRATE + 60, height: ah * 0.12, dur: 26 },
        ]}
        rock={{ from: CELEBRATE + 90, to: 400, deg: 2.5 }}
        opacity={interpolate(frame, [40, 60], [0, 1], clamp)}
      />
      <Confetti at={CELEBRATE + 4} x={ax} y={ay - ah * 0.6} count={portrait ? 70 : 80} power={portrait ? 1.1 : 1} />
      {portrait ? null : (
        <Eyebrow color={C.muted} size={18} style={{ position: "absolute", left: 150, bottom: 70, opacity: cardIn * 0.8 }}>
          Savings goals · Little by little
        </Eyebrow>
      )}
    </AbsoluteFill>
  );
};
