import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

/** Deterministic pseudo-random (rendering must be frame-stable). */
export const rand = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse 90% 75% at 50% 42%, transparent 55%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

export const Particles: React.FC<{ count?: number; tint?: string }> = ({ count = 90, tint = "#2DD4BF" }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const dots = React.useMemo(() => {
    const r = rand(42);
    return Array.from({ length: count }, (_, i) => ({
      x: r() * width,
      y: r() * height,
      s: 1 + r() * 2.6,
      o: 0.12 + r() * 0.4,
      v: 0.25 + r() * 0.8,
      tw: r() * Math.PI * 2,
    }));
  }, [count, width, height]);
  void fps;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {dots.map((d, i) => {
        const y = (d.y - frame * d.v * 2.2 + height * 2) % (height + 80) - 40;
        const twinkle = 0.6 + 0.4 * Math.sin(frame * 0.08 + d.tw + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: y,
              width: d.s,
              height: d.s,
              borderRadius: "50%",
              background: tint,
              opacity: d.o * twinkle,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};

export const Kicker: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 8,
        color: C.mint,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const Headline: React.FC<{ lines: string[]; size?: number; delay?: number; gap?: number }> = ({
  lines,
  size = 118,
  delay = 0,
  gap = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ fontFamily: FONT, fontWeight: 800, lineHeight: 1.02 }}>
      {lines.map((line, li) => (
        <div key={li} style={{ overflow: "hidden", paddingBottom: gap }}>
          {line.split(" ").map((word, wi) => {
            const d = delay + li * 7 + wi * 3;
            const p = spring({ frame: frame - d, fps, config: { damping: 200 } });
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  fontSize: size,
                  color: C.ink,
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [90, 0])}px)`,
                  marginRight: size * 0.28,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const GlowOrb: React.FC<{ size?: number; left?: number; top?: number; opacity?: number }> = ({
  size = 900,
  left = 960,
  top = 480,
  opacity = 0.5,
}) => (
  <div
    style={{
      position: "absolute",
      left: left - size / 2,
      top: top - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(45,212,191,0.28) 0%, rgba(15,118,110,0.16) 42%, transparent 68%)`,
      opacity,
      filter: "blur(10px)",
    }}
  />
);

/**
 * Subtle impact shake: ±px over a few frames starting at `at` (local frame).
 * Reserved for major cuts only.
 */
export const Shake: React.FC<{ at: number; dur?: number; mag?: number; children: React.ReactNode }> = ({
  at,
  dur = 5,
  mag = 7,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const dx = t >= 0 && t < dur ? Math.sin(t * 4.2) * mag * (1 - t / dur) : 0;
  const dy = t >= 0 && t < dur ? Math.cos(t * 3.1) * mag * 0.6 * (1 - t / dur) : 0;
  // Absolute + inset: a transformed element becomes the containing block for
  // absolutely-positioned descendants, so the wrapper must carry the full
  // frame geometry itself — otherwise inset:0 children collapse to zero height
  // and the scene goes black.
  return <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px)` }}>{children}</div>;
};

/** One-shot full-screen dip for hard transitions (connection lost, etc). */
export const FlashFrame: React.FC<{ at: number; dur?: number; color?: string; peak?: number }> = ({
  at,
  dur = 6,
  color = "255,255,255",
  peak = 0.22,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t >= dur) return null;
  const o = Math.sin((Math.PI * t) / dur) * peak;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(${color},${o})`, pointerEvents: "none" }} />;
};

/** Horizontal speed streaks, opacity follows whip velocity 0..1. */
export const SpeedStreaks: React.FC<{ v: number; count?: number }> = ({ v, count = 14 }) => {
  const r = React.useMemo(() => {
    const g = rand(7);
    return Array.from({ length: count }, () => ({ y: g() * 1080, w: 120 + g() * 420, o: 0.05 + g() * 0.12 }));
  }, [count]);
  if (v <= 0.01) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {r.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.y,
            left: -200,
            width: 2300,
            height: s.w * 0.06,
            background: `linear-gradient(90deg, transparent, rgba(45,212,191,${s.o * v}), transparent)`,
          }}
        />
      ))}
    </div>
  );
};

/** Rapid financial fragments flashing behind the hook headline (real data). */
export const MoneyFragments: React.FC<{ items: string[]; dur?: number }> = ({ items, dur = 60 }) => {
  const frame = useCurrentFrame();
  const r = React.useMemo(() => {
    const g = rand(13);
    return items.map((text) => ({
      text,
      x: 120 + g() * 1500,
      y: 140 + g() * 760,
      size: 30 + g() * 46,
      born: Math.floor(g() * dur * 0.7),
      life: 10 + Math.floor(g() * 14),
      tone: g() > 0.45 ? "#2DD4BF" : "#F2F7FA",
    }));
  }, [items, dur]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {r.map((f, i) => {
        const t = frame - f.born;
        if (t < 0 || t > f.life) return null;
        const o = Math.sin((Math.PI * t) / f.life) * 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: f.x,
              top: f.y,
              fontFamily: FONT,
              fontSize: f.size,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: f.tone,
              opacity: o,
            }}
          >
            {f.text}
          </div>
        );
      })}
    </div>
  );
};
