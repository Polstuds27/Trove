import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease, fontFamily } from "../theme";

type Props = {
  text: string;
  /** frame (relative to parent sequence) when the first word starts */
  start?: number;
  /** frames between words */
  stagger?: number;
  /** frames each word takes to rise */
  dur?: number;
  /** frame at which the line exits (masked drop), optional */
  exitAt?: number;
  size: number;
  color: string;
  weight?: number;
  tracking?: string;
  lineHeight?: number;
  style?: React.CSSProperties;
  /** Per-word color override, by word index */
  wordColors?: Record<number, string>;
  align?: "left" | "center" | "right";
};

/**
 * Words rise out of a mask with a staggered expo-out — the film's single
 * typographic gesture. Deterministic at any frame.
 */
export const AnimatedText: React.FC<Props> = ({
  text,
  start = 0,
  stagger = 5,
  dur = 34,
  exitAt,
  size,
  color,
  weight = 650,
  tracking = "-0.045em",
  lineHeight = 1.02,
  style,
  wordColors,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const lines = text.split("\n");
  let index = 0;
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: tracking,
        lineHeight,
        color,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "block", whiteSpace: "nowrap" }}>
          {line.split(" ").map((word, wi) => {
            const i = index++;
            const t0 = start + i * stagger;
            const p = interpolate(frame, [t0, t0 + dur], [0, 1], { ...clamp, easing: ease.out });
            const out =
              exitAt === undefined
                ? 0
                : interpolate(frame, [exitAt + i * 2, exitAt + i * 2 + 22], [0, 1], {
                    ...clamp,
                    easing: ease.in,
                  });
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: "0.12em",
                  marginBottom: "-0.12em",
                  marginRight: wi < line.split(" ").length - 1 ? "0.24em" : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    translate: `0 ${(1 - p) * 105 + out * 105}%`,
                    rotate: `${(1 - p) * 4}deg`,
                    transformOrigin: "0% 100%",
                    color: wordColors?.[i] ?? color,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Small uppercase label used for eyebrows / counters. */
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  color: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color, size = 22, style }) => (
  <div
    style={{
      fontFamily,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);
