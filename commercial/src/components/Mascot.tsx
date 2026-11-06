import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import meta from "../mascot-meta.json";
import { clamp, ease } from "../theme";

/**
 * Atlas is supplied as flat, single-layer PNG poses (web/public/mascot/ultra-refined).
 * Limbs are NOT independently rigged here: all motion is whole-character transforms
 * (breathing, squash/stretch, bounce, rock) plus cross-dissolved pose changes.
 * Blinks are painted lids over the Idle pose only, whose eye positions were measured.
 */
export type Pose = keyof typeof meta;

export type PoseKey = { at: number; pose: Pose };
export type Hop = { at: number; height?: number; dur?: number };

type Props = {
  /** pose timeline, frames relative to parent sequence, sorted */
  poses: PoseKey[];
  /** standing height in px (leaf tip → feet) */
  height: number;
  /** feet position inside the parent */
  x: number;
  y: number;
  /** entrance: drop from above landing at this frame */
  dropAt?: number;
  hops?: Hop[];
  /** frames at which Idle blinks start */
  blinks?: number[];
  /** gentle rock (deg) used for the wave beat — whole body, not an arm rig */
  rock?: { from: number; to: number; deg?: number };
  flip?: boolean;
  shadowOpacity?: number;
  opacity?: number;
};

const XFADE = 5;

const poseAt = (poses: PoseKey[], f: number) => {
  let cur = 0;
  for (let i = 0; i < poses.length; i++) if (f >= poses[i].at) cur = i;
  return cur;
};

const Lid: React.FC<{
  e: { x: number; y: number; w: number; h: number; skin: string };
  w: number;
  h: number;
  closure: number;
}> = ({ e, w, h, closure }) => {
  if (closure <= 0.01) return null;
  const ew = e.w * w * 1.3;
  const eh = e.h * h * 1.2;
  const cx = e.x * w;
  const top = e.y * h - eh / 2;
  return (
    <g>
      <defs>
        <filter id={`lidSoft${Math.round(cx)}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={w * 0.006} />
        </filter>
      </defs>
      <ellipse
        filter={`url(#lidSoft${Math.round(cx)})`}
        cx={cx}
        cy={top + (eh * closure) / 2}
        rx={ew / 2}
        ry={(eh * closure) / 2 + 2}
        fill={e.skin}
      />
      {closure > 0.75 ? (
        <path
          d={`M ${cx - ew * 0.34} ${top + eh * 0.55} Q ${cx} ${top + eh * 0.8} ${cx + ew * 0.34} ${top + eh * 0.55}`}
          stroke="#3b2e29"
          strokeWidth={Math.max(3, w * 0.012)}
          strokeLinecap="round"
          fill="none"
          opacity={interpolate(closure, [0.75, 1], [0, 1], clamp)}
        />
      ) : null}
    </g>
  );
};

export const Mascot: React.FC<Props> = ({
  poses,
  height,
  x,
  y,
  dropAt,
  hops = [],
  blinks = [],
  rock,
  flip,
  shadowOpacity = 0.22,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ci = poseAt(poses, frame);

  // --- vertical motion: drop-in + hops -------------------------------------------
  let lift = 0;
  let squash = 0; // + = squashed (wide/short), - = stretched
  if (dropAt !== undefined) {
    const fall = interpolate(frame, [dropAt - 26, dropAt], [1, 0], {
      ...clamp,
      easing: ease.in,
    });
    lift += fall * height * 1.35;
    if (frame < dropAt) squash -= fall * 0.08;
    const land = spring({ frame: frame - dropAt, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
    if (frame >= dropAt) squash += (1 - land) * 0.22 * Math.cos((frame - dropAt) / 3.2);
  }
  for (const hop of hops) {
    const d = hop.dur ?? 34;
    const t = (frame - hop.at) / d;
    if (t > -0.25 && t < 0) squash += interpolate(t, [-0.25, 0], [0, 0.1]); // anticipation
    if (t >= 0 && t <= 1) {
      lift += Math.sin(Math.PI * t) * (hop.height ?? height * 0.16);
      squash -= Math.sin(Math.PI * t) * 0.06;
    }
    if (t > 1 && t < 1.5) squash += Math.sin(((t - 1) / 0.5) * Math.PI) * 0.08;
  }

  // --- idle breathing (always on, deterministic) ------------------------------
  const breath = Math.sin((frame / fps) * Math.PI * 0.9) * 0.012;
  const sy = 1 - squash + breath;
  const sx = 1 + squash * 0.85 - breath * 0.5;

  const rot = rock
    ? interpolate(frame, [rock.from, rock.from + 12, rock.to - 12, rock.to], [0, 1, 1, 0], clamp) *
      Math.sin(((frame - rock.from) / fps) * Math.PI * 2.2) *
      (rock.deg ?? 4)
    : 0;

  const shadowScale = interpolate(lift, [0, height], [1, 0.45], clamp);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity }}>
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: -height * 0.22,
          top: -height * 0.018,
          width: height * 0.44,
          height: height * 0.05,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(30,53,41,0.55), rgba(30,53,41,0))",
          opacity: shadowOpacity * (0.4 + 0.6 * shadowScale),
          scale: `${shadowScale}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          translate: `0 ${-lift}px`,
          rotate: `${rot}deg`,
          scale: `${flip ? -sx : sx} ${sy}`,
          transformOrigin: "0 0",
        }}
      >
        {poses.map((p, i) => {
          const m = meta[p.pose];
          // Only render the current pose and the one fading out.
          const isCur = i === ci;
          const isPrev = i === ci - 1 && frame - poses[ci].at < XFADE;
          if (!isCur && !isPrev) return null;
          const a = isCur
            ? i === 0
              ? 1
              : interpolate(frame, [poses[i].at, poses[i].at + XFADE], [0, 1], clamp)
            : 1;
          const pop =
            isCur && i > 0
              ? 1 + 0.035 * Math.sin(interpolate(frame, [p.at, p.at + 14], [0, Math.PI], clamp))
              : 1;
          const scale = height / m.h;
          const w = m.w * scale;
          const left = -m.feetX * w;
          const blink = p.pose === "Idle" && isCur ? blinkClosure(frame, blinks) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left,
                top: -height,
                width: w,
                height,
                opacity: a,
                scale: `${pop}`,
                transformOrigin: `${m.feetX * 100}% 100%`,
              }}
            >
              <Img src={staticFile(`mascot/${p.pose}.png`)} style={{ width: w, height }} />
              {blink > 0 && m.eyes.length ? (
                <svg
                  width={w}
                  height={height}
                  viewBox={`0 0 ${m.w} ${m.h}`}
                  style={{ position: "absolute", left: 0, top: 0 }}
                >
                  {(m.eyes as { x: number; y: number; w: number; h: number; skin: string }[]).map(
                    (e, k) => (
                      <Lid key={k} e={e} w={m.w} h={m.h} closure={blink} />
                    ),
                  )}
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 0 → 1 → 0 over ~9 frames: fast close, slightly slower open. */
function blinkClosure(frame: number, blinks: number[]) {
  for (const b of blinks) {
    if (frame >= b && frame < b + 10) {
      return interpolate(frame, [b, b + 3, b + 5, b + 10], [0, 1, 1, 0], clamp);
    }
  }
  return 0;
}
