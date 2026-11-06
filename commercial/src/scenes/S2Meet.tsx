import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { Forest } from "../components/Backdrop";
import { SproutMark } from "../components/Logo";
import { Mascot } from "../components/Mascot";
import { C, clamp, ease, fontFamily } from "../theme";

const OPEN = 46; // circle reveal length
const LAND = 64; // Atlas touches down
const EXIT = 284; // panel slides up to reveal the product scene

export const S2Meet: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;

  const radius = interpolate(frame, [0, OPEN], [0, Math.hypot(width, height) * 0.6], {
    ...clamp,
    easing: ease.inOut,
  });
  const lift = interpolate(frame, [EXIT, EXIT + 36], [0, 1], { ...clamp, easing: ease.inOut });

  const ax = portrait ? width / 2 : width * 0.27;
  const ay = portrait ? height * 0.74 : height * 0.82;
  const ah = portrait ? 680 : 640;

  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${radius}px at 50% 50%)`,
        translate: `0 ${-lift * height}px`,
      }}
    >
      <Forest />
      <Mascot
        x={ax}
        y={ay}
        height={ah}
        dropAt={LAND}
        poses={[
          { at: 0, pose: "Worried" },
          { at: 118, pose: "Idle" },
          { at: 196, pose: "Waving" },
        ]}
        hops={[{ at: 112, height: ah * 0.12, dur: 26 }]}
        blinks={[142, 176]}
        rock={{ from: 196, to: 290, deg: 3.5 }}
        shadowOpacity={0.5}
      />
      <div
        style={{
          position: "absolute",
          left: portrait ? 0 : width * 0.47,
          right: portrait ? 0 : undefined,
          top: portrait ? height * 0.14 : height * 0.36,
          display: "flex",
          flexDirection: "column",
          alignItems: portrait ? "center" : "flex-start",
        }}
      >
        <AnimatedText
          text="Meet Trove."
          start={126}
          stagger={8}
          size={portrait ? 150 : 168}
          color={C.cream}
          align={portrait ? "center" : "left"}
          wordColors={{ 1: C.sand }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 34,
            opacity: interpolate(frame, [156, 186], [0, 1], clamp),
            translate: `0 ${interpolate(frame, [156, 186], [16, 0], { ...clamp, easing: ease.out })}px`,
          }}
        >
          <SproutMark size={44} bg={C.forest} dark={C.cream} light={C.sage} />
          <span
            style={{
              fontFamily,
              fontSize: portrait ? 36 : 38,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "rgba(247,240,229,0.78)",
            }}
          >
            Offline-first personal finance.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
