import { interpolate, useCurrentFrame } from "remotion";
import { C } from "./theme";
import { ScreenStage as SceneStageInner } from "./stage";
import { GlowOrb, Headline, MoneyFragments, Particles, Vignette } from "./fx";

/** 0.0–2.5s — cinematic hook. */
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [64, 75], [1, 0], { extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, 75], [1, 1.14]);
  const streakX = interpolate(frame, [0, 75], [-600, 2400]);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden", opacity: out, transform: `scale(${zoom})` }}>
      <GlowOrb left={960} top={430} size={1100} opacity={0.7} />
      <MoneyFragments
        items={["₱970.00", "−₱30.00", "+₱200", "₱360", "GoTyme", "Dining", "Oct 4", "−₱35", "+₱50", "₱140", "Baon", "−₱98"]}
        dur={62}
      />
      <Particles count={110} />
      <div
        style={{
          position: "absolute",
          top: -200,
          left: streakX,
          width: 180,
          height: 1500,
          transform: "rotate(18deg)",
          background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.10), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Headline lines={["WHERE DOES YOUR", "MONEY GO?"]} size={132} delay={6} />
        <div
          style={{
            marginTop: 34,
            width: interpolate(frame, [18, 46], [0, 300], { extrapolateRight: "clamp" }),
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${C.emerald}, ${C.mint})`,
          }}
        />
      </div>
      <Vignette />
    </div>
  );
};

/** 2.5–5.5s — real dashboard reveal. */
export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [80, 90], [1, 0], { extrapolateRight: "clamp" });
  // Balance count-up toward the real net worth as the camera pushes in.
  const bal = Math.round(interpolate(frame, [10, 62], [0, 970], { extrapolateRight: "clamp" }));
  const chipP = interpolate(frame, [44, 56], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <SceneStageInner
        src="assets/app-overview.png"
        kicker="MEET FINTRACK"
        title={["Your money,", "clearly."]}
        sub="Offline-first personal finance."
      >
        <div
          style={{
            position: "absolute",
            right: 120,
            bottom: 110,
            opacity: chipP,
            transform: `translateY(${(1 - chipP) * 30}px)`,
            background: "rgba(10,22,29,0.92)",
            border: "1px solid #2DD4BF",
            borderRadius: 20,
            padding: "18px 32px",
            boxShadow: "0 0 50px rgba(45,212,191,0.4)",
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}
        >
          <div style={{ fontSize: 24, color: "#93A8B5" }}>NET WORTH</div>
          <div style={{ fontSize: 58, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#F2F7FA" }}>
            ${bal.toLocaleString("en-US")}.00
          </div>
        </div>
      </SceneStageInner>
    </div>
  );
};
