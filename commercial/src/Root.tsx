import { Audio, Composition, Sequence, staticFile } from "remotion";
import { FPS, H, W } from "./theme";
import { SceneHook, SceneReveal } from "./scenes1";
import { SceneInsights, SceneTransactions } from "./scenes2";
import { SceneBrand, SceneMontage, SceneOffline } from "./scenes3";

/**
 * FinTrack 20-second commercial. Exactly 600 frames @30fps.
 * Timeline: hook 0–2.5 · reveal 2.5–5.5 · transactions 5.5–9.0 ·
 * insights 9.0–12.5 · montage 12.5–15.5 · offline 15.5–18.0 · brand 18.0–20.0
 */
export const Ad: React.FC = () => (
  <div style={{ position: "relative", width: "100%", height: "100%", background: "#050D12", overflow: "hidden" }}>
    <Audio src={staticFile("audio/bed_mix.wav")} volume={1} />
    <Audio src={staticFile("audio/voice.wav")} volume={1} />
    <Sequence from={0} durationInFrames={75} name="Hook">
      <SceneHook />
    </Sequence>
    <Sequence from={75} durationInFrames={90} name="Reveal">
      <SceneReveal />
    </Sequence>
    <Sequence from={165} durationInFrames={105} name="Transactions">
      <SceneTransactions />
    </Sequence>
    <Sequence from={270} durationInFrames={105} name="Insights">
      <SceneInsights />
    </Sequence>
    <Sequence from={375} durationInFrames={90} name="Montage">
      <SceneMontage />
    </Sequence>
    <Sequence from={465} durationInFrames={75} name="Offline">
      <SceneOffline />
    </Sequence>
    <Sequence from={540} durationInFrames={60} name="Brand">
      <SceneBrand />
    </Sequence>
  </div>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="FinTrackCommercial"
    component={Ad}
    durationInFrames={600}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{}}
  />
);
