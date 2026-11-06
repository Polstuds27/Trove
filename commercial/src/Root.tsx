import React from "react";
import { Composition, Folder } from "remotion";
import { Commercial } from "./Commercial";
import { DURATION, FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Folder name="Trove">
    <Composition id="Trove" component={Commercial} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition
      id="TroveVertical"
      component={Commercial}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </Folder>
);
