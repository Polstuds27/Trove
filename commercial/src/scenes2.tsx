import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";
import { ScreenFull } from "./stage";
import { FlashFrame, Shake } from "./fx";

/** 5.5–9.0s — the real ledger; a light band sweeps the live row. */
export const SceneTransactions: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [95, 105], [1, 0], { extrapolateRight: "clamp" });
  const bandY = interpolate(frame, [10, 70], [120, 480], { extrapolateRight: "clamp" });
  const chipP = interpolate(frame, [48, 60], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <Shake at={0} mag={6}>
      <ScreenFull
        src="assets/app-transactions-all.png"
        kicker="TRACK EVERY PESO"
        title={["Every cent,", "accounted for."]}
        sub="Saved on-device first. Synced everywhere."
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: bandY,
            height: 150,
            background: "linear-gradient(180deg, transparent, rgba(45,212,191,0.16) 45%, rgba(45,212,191,0.16) 55%, transparent)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 600,
            opacity: chipP,
            transform: `translateY(${(1 - chipP) * 30}px) scale(${0.9 + chipP * 0.1})`,
            background: "rgba(10,22,29,0.92)",
            border: `1px solid ${C.mint}`,
            borderRadius: 20,
            padding: "20px 34px",
            boxShadow: "0 0 50px rgba(45,212,191,0.4)",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 26, color: C.muted }}>Bumili siomai · Dining</div>
          <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.expense }}>
            −₱30.00
          </div>
        </div>
      </ScreenFull>
      </Shake>
    </div>
  );
};

/** 9.0–12.5s — the real statistics; a sweep crosses the live chart. */
export const SceneInsights: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [95, 105], [1, 0], { extrapolateRight: "clamp" });
  const sweepX = interpolate(frame, [10, 75], [500, 1750], { extrapolateRight: "clamp" });
  const chipP = interpolate(frame, [55, 67], [0, 1], { extrapolateRight: "clamp" });
  // Masked reveal: a dark panel wipes away leftward, drawing the real chart in.
  const maskW = interpolate(frame, [8, 46], [1180, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <Shake at={0} mag={6}>
      <ScreenFull
        src="assets/app-statistics.png"
        kicker="SEE WHERE IT GOES"
        title={["Reports that", "explain", "themselves."]}
        sub="Computed on your device."
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: sweepX,
            width: 130,
            background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.14), transparent)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 640,
            opacity: chipP,
            transform: `translateY(${(1 - chipP) * 30}px)`,
            background: "rgba(10,22,29,0.92)",
            border: `1px solid ${C.mint}`,
            borderRadius: 20,
            padding: "20px 34px",
            boxShadow: "0 0 50px rgba(45,212,191,0.4)",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 26, color: C.muted }}>Top spending category</div>
          <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 800, color: C.ink }}>
            Dining · <span style={{ color: C.mint }}>₱30.00</span>
          </div>
        </div>
        {maskW > 0 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 120,
              bottom: 60,
              width: maskW,
              background: C.bg,
              pointerEvents: "none",
            }}
          />
        )}
      </ScreenFull>
      </Shake>
    </div>
  );
};
