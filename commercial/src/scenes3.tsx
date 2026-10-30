import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";
import { FlashFrame, GlowOrb, Particles, Shake, SpeedStreaks, Vignette } from "./fx";

const CLIPS = [
  { src: "assets/app-overview.png", label: "DASHBOARD", fit: "cover" as const },
  { src: "assets/app-transactions-all.png", label: "LEDGER", fit: "cover" as const },
  { src: "assets/app-statistics.png", label: "INSIGHTS", fit: "cover" as const },
  { src: "assets/app-settings-sync.png", label: "SYNC", fit: "cover" as const },
];

/** 12.5–15.5s — whip montage of real screens, ~0.75s each. */
export const SceneMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [82, 90], [1, 0], { extrapolateRight: "clamp" });
  const per = 90 / CLIPS.length;
  const idx = Math.min(CLIPS.length - 1, Math.floor(frame / per));
  const local = frame - idx * per;
  const clip = CLIPS[idx];
  // whip: incoming slides hard from the right while scaling down to rest
  const x = interpolate(local, [0, 9], [900, 0], { extrapolateRight: "clamp" });
  const scale = interpolate(local, [0, 9], [1.12, 1], { extrapolateRight: "clamp" });
  const labelP = interpolate(local, [6, 12], [0, 1], { extrapolateRight: "clamp" });
  // Streaks live only while the whip is moving (first ~9 frames of each clip).
  const whipV = interpolate(local, [0, 9], [1, 0.12], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden", opacity: out }}>
      <SpeedStreaks v={whipV} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 96,
          width: 1920,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 10,
          color: C.mint,
          zIndex: 5,
        }}
      >
        ALL YOUR FINANCES
      </div>
      <div
        key={idx}
        style={{
          position: "absolute",
          left: 360,
          top: 190,
          width: 1200,
          height: 760,
          borderRadius: 30,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 70px rgba(45,212,191,0.18)",
          transform: `translateX(${x}px) scale(${scale})`,
          background: "#0B1620",
        }}
      >
        <Img
          src={staticFile(clip.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: clip.fit,
            objectPosition: clip.fit === "cover" ? "center top" : "center",
            background: "#0B1620",
            display: "block",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 360,
          bottom: 62,
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: 6,
          color: C.ink,
          background: "rgba(15,118,110,0.85)",
          padding: "10px 26px",
          borderRadius: 14,
          opacity: labelP,
          transform: `translateY(${(1 - labelP) * 20}px)`,
        }}
      >
        {clip.label}
      </div>
      <GlowOrb left={960} top={540} size={1200} opacity={0.35} />
      <Particles count={40} />
      <Vignette />
    </div>
  );
};

/** 15.5–18.0s — offline differentiator with the real category screen. */
export const SceneOffline: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [66, 75], [1, 0], { extrapolateRight: "clamp" });
  // signal bars die over the first half, then the local pulse takes over
  const alive = frame < 34 ? 4 - Math.floor(frame / 9) : 1;
  const pulse = frame >= 34 ? (frame - 34) % 30 : -1;
  const pulseR = pulse >= 0 ? interpolate(pulse, [0, 30], [40, 220]) : 0;
  const pulseO = pulse >= 0 ? interpolate(pulse, [0, 30], [0.5, 0]) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden", opacity: out }}>
      <FlashFrame at={0} dur={7} color="248,113,113" peak={0.10} />
      <GlowOrb left={520} top={540} size={900} opacity={0.6} />
      <Particles count={45} />
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 130,
          width: 400,
          transform: "rotate(-4deg)",
          filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6))",
        }}
      >
        <Img src={staticFile("assets/phone-category.png")} style={{ width: "100%", borderRadius: 34, display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: 800, top: 250, width: 900 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120 }}>
          {[0.45, 0.65, 0.85, 1].map((h, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 110 * h,
                borderRadius: 12,
                background: i < alive ? C.mint : "rgba(255,255,255,0.14)",
                boxShadow: i < alive ? "0 0 26px rgba(45,212,191,0.55)" : "none",
                transition: "none",
              }}
            />
          ))}
          <div style={{ marginLeft: 18, fontFamily: FONT, fontSize: 40, fontWeight: 800, letterSpacing: 4, color: frame < 34 ? C.muted : C.expense }}>
            {frame < 34 ? "ONLINE" : "OFFLINE"}
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 44 }}>
          {pulse >= 0 && (
            <div
              style={{
                position: "absolute",
                left: -10,
                top: -70,
                width: pulseR * 2,
                height: pulseR * 2,
                borderRadius: "50%",
                border: `3px solid rgba(45,212,191,${pulseO})`,
              }}
            />
          )}
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, lineHeight: 1.02, color: C.ink }}>
            Still
            <br />
            working.
          </div>
        </div>
        <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 30, color: C.muted }}>
          Saved on-device. Synced when you&apos;re back.
        </div>
        <div style={{ marginTop: 22, fontFamily: FONT, fontSize: 28, fontWeight: 700, letterSpacing: 9, color: C.mint }}>
          EVEN OFFLINE
        </div>
      </div>
      <Vignette />
    </div>
  );
};

/** 18.0–20.0s — brand resolve. */
export const SceneBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const iconIn = interpolate(frame, [4, 22], [0, 1], { extrapolateRight: "clamp" });
  const ring = interpolate(frame, [10, 50], [0, 1]);
  const wordP = interpolate(frame, [16, 32], [0, 1], { extrapolateRight: "clamp" });
  const tagP = interpolate(frame, [30, 44], [0, 1], { extrapolateRight: "clamp" });
  // Slow resolve drift under the logo.
  const drift = interpolate(frame, [0, 60], [1, 1.035]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#03090D",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${drift})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 960 - 260 * ring - 130,
          top: 440 - 260 * ring - 130,
          width: 260 + 520 * ring,
          height: 260 + 520 * ring,
          borderRadius: "50%",
          border: "2px solid rgba(45,212,191,0.5)",
          opacity: 1 - ring,
        }}
      />
      <div
        style={{
          opacity: iconIn,
          transform: `scale(${interpolate(iconIn, [0, 1], [0.6, 1])})`,
          filter: "drop-shadow(0 0 70px rgba(45,212,191,0.45))",
        }}
      >
        <Img src={staticFile("assets/icon-512.png")} style={{ width: 250, height: 250, display: "block" }} />
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: FONT,
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: 30,
          color: C.ink,
          opacity: wordP,
          paddingLeft: 30,
        }}
      >
        FINTRACK
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: 6,
          color: C.mint,
          opacity: tagP,
        }}
      >
        TAKE CONTROL.
      </div>
      <Vignette />
    </div>
  );
};
