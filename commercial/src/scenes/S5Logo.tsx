import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText, Eyebrow } from "../components/AnimatedText";
import { Paper } from "../components/Backdrop";
import { Lockup } from "../components/Logo";
import { C, clamp, ease } from "../theme";

export const S5Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  const portrait = height > width;
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: ease.soft });
  const settle = interpolate(frame, [20, 300], [1.04, 1], { ...clamp, easing: ease.out });
  const rule = interpolate(frame, [96, 140], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Paper />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", scale: `${settle}` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", translate: "0 -20px" }}>
          <Lockup start={22} size={portrait ? 190 : 200} />
          <div
            style={{
              width: 120 * rule,
              height: 3,
              borderRadius: 3,
              background: C.sage,
              margin: "46px 0 40px",
            }}
          />
          <AnimatedText
            text="Your money, understood."
            start={104}
            stagger={6}
            size={portrait ? 66 : 64}
            weight={500}
            tracking="-0.025em"
            color={C.forest}
            align="center"
            wordColors={{ 2: C.sage }}
          />
        </div>
      </AbsoluteFill>
      <Eyebrow
        color={C.muted}
        size={portrait ? 22 : 20}
        style={{
          position: "absolute",
          bottom: portrait ? 140 : 80,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [150, 180], [0, 0.85], clamp),
        }}
      >
        Offline-first personal finance
      </Eyebrow>
    </AbsoluteFill>
  );
};
