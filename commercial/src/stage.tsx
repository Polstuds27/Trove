import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "./theme";
import { GlowOrb, Particles, Vignette } from "./fx";

const FONT = "'Segoe UI', Arial, sans-serif";

interface StageProps {
  src: string;
  kicker: string;
  title: string[];
  sub?: string;
  children?: React.ReactNode;
}

/** Side-panel real UI with a slow push-in and a text gradient. */
export const ScreenStage: React.FC<StageProps> = ({ src, kicker, title, sub, children }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 200], [1.06, 1.16]);
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 660,
          top: -80,
          width: 1400,
          height: 1240,
          overflow: "hidden",
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 60px 140px rgba(0,0,0,0.65), 0 0 90px rgba(45,212,191,0.16)",
          transform: `scale(${zoom})`,
          transformOrigin: "70% 40%",
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left top", display: "block" }} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, rgba(5,13,18,0.97) 0%, rgba(5,13,18,0.92) 30%, rgba(5,13,18,0.25) 58%, transparent 75%)",
        }}
      />
      <div style={{ position: "absolute", left: 130, top: 300, width: 640, opacity: enter }}>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, letterSpacing: 9, color: C.mint }}>
          {kicker}
        </div>
        <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1.04, color: C.ink }}>
          {title.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        {sub && <div style={{ marginTop: 24, fontFamily: FONT, fontSize: 29, color: C.muted }}>{sub}</div>}
      </div>
      {children}
      <GlowOrb left={300} top={540} size={800} opacity={0.5} />
      <Particles count={40} />
      <Vignette />
    </div>
  );
};

/**
 * Edge-to-edge real screenshot (cover) with a cinematic push-in, a left
 * gradient for type, and overlay children positioned in canvas coordinates.
 */
export const ScreenFull: React.FC<StageProps> = ({ src, kicker, title, sub, children }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 220], [1, 1.1]);
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -140, transform: `scale(${zoom})`, transformOrigin: "62% 42%" }}>
        <Img src={staticFile(src)} style={{ width: 2200, height: 1360, objectFit: "cover", display: "block" }} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, rgba(5,13,18,0.96) 0%, rgba(5,13,18,0.88) 32%, rgba(5,13,18,0.20) 60%, transparent 76%)",
        }}
      />
      <div style={{ position: "absolute", left: 130, top: 330, width: 620, opacity: enter }}>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, letterSpacing: 9, color: C.mint }}>
          {kicker}
        </div>
        <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1.04, color: C.ink }}>
          {title.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        {sub && <div style={{ marginTop: 24, fontFamily: FONT, fontSize: 29, color: C.muted }}>{sub}</div>}
      </div>
      {children}
      <Vignette />
    </div>
  );
};
