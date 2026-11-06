import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, clamp, ease, shadow } from "../theme";

/** Mobile captures are 390×844 CSS px @3x (1170×2532). */
const SCREEN_RATIO = 844 / 390;

export type Screen = { src: string; at: number };

/**
 * Screens inside a device swap with a short vertical push — the same
 * direction as the type, so UI and copy move as one system.
 */
const ScreenStack: React.FC<{ screens: Screen[]; w: number; h: number; push?: number }> = ({
  screens,
  w,
  h,
  push = 26,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {screens.map((s, i) => {
        const next = screens[i + 1];
        const enter = i === 0 ? 1 : interpolate(frame, [s.at, s.at + push], [0, 1], { ...clamp, easing: ease.inOut });
        const leave = next ? interpolate(frame, [next.at, next.at + push], [0, 1], { ...clamp, easing: ease.inOut }) : 0;
        if (enter <= 0 || leave >= 1) return null;
        return (
          <Img
            key={s.src}
            src={staticFile(s.src)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: w,
              height: h,
              objectFit: "cover",
              objectPosition: "top",
              translate: `0 ${(1 - enter) * h * 0.35 - leave * h * 0.12}px`,
              opacity: Math.min(1, enter * 1.6) * (1 - leave * 0.4),
              scale: `${1 - leave * 0.04}`,
              filter: leave > 0 ? `brightness(${1 - leave * 0.25})` : undefined,
            }}
          />
        );
      })}
    </>
  );
};

/** A restrained, frame-less phone: body, thin bezel, island. */
export const Phone: React.FC<{
  screens: Screen[];
  height: number;
  style?: React.CSSProperties;
}> = ({ screens, height, style }) => {
  const bezel = height * 0.014;
  const sh = height - bezel * 2;
  const sw = sh / SCREEN_RATIO;
  const w = sw + bezel * 2;
  const r = height * 0.068;
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height,
        borderRadius: r,
        background: `linear-gradient(145deg, #3a4a40, ${C.forestDeep} 40%, #121c16)`,
        boxShadow: `${shadow.device}, inset 0 0 0 1.5px rgba(255,255,255,0.10)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: bezel,
          top: bezel,
          width: sw,
          height: sh,
          borderRadius: r - bezel,
          overflow: "hidden",
          background: C.cream,
        }}
      >
        <ScreenStack screens={screens} w={sw} h={sh} />
        {/* glass sheen, light from upper-left */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: bezel + sh * 0.012,
          left: "50%",
          width: sw * 0.28,
          height: sh * 0.034,
          translate: "-50% 0",
          borderRadius: 999,
          background: "#0d1410",
        }}
      />
    </div>
  );
};

/** Desktop captures are 1440×900 @2x. Minimal window chrome. */
export const BrowserCard: React.FC<{
  screens: Screen[];
  width: number;
  style?: React.CSSProperties;
}> = ({ screens, width, style }) => {
  const bar = width * 0.034;
  const h = (width * 900) / 1440;
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: h + bar,
        borderRadius: width * 0.016,
        overflow: "hidden",
        background: C.creamHi,
        boxShadow: `${shadow.card}, inset 0 0 0 1px rgba(41,71,55,0.08)`,
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: bar * 0.22,
          paddingLeft: bar * 0.5,
          background: "#EFE7DA",
          borderBottom: "1px solid rgba(41,71,55,0.08)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: bar * 0.26, height: bar * 0.26, borderRadius: 99, background: C.warmGray }} />
        ))}
      </div>
      <div style={{ position: "relative", width, height: h, overflow: "hidden" }}>
        <ScreenStack screens={screens} w={width} h={h} />
      </div>
    </div>
  );
};
