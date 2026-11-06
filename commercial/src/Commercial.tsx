import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Soundtrack } from "./components/Soundtrack";
import { S1Question } from "./scenes/S1Question";
import { S2Meet } from "./scenes/S2Meet";
import { S3Features } from "./scenes/S3Features";
import { S4Wins } from "./scenes/S4Wins";
import { S5Logo } from "./scenes/S5Logo";
import { C, T } from "./theme";

/**
 * DOM order sets stacking: S2's forest panel lifts away to reveal S3, so S2 sits
 * above S3; S4 pushes in over S3; S5 fades in over S4.
 */
export const Commercial: React.FC = () => (
  <AbsoluteFill style={{ background: C.cream }}>
    <Sequence name="1 · Where did my money go?" from={T.question.from} durationInFrames={T.question.dur}>
      <S1Question />
    </Sequence>
    <Sequence name="3 · Track. Plan. Grow." from={T.features.from} durationInFrames={T.features.dur}>
      <S3Features />
    </Sequence>
    <Sequence name="2 · Meet Trove" from={T.meet.from} durationInFrames={T.meet.dur}>
      <S2Meet />
    </Sequence>
    <Sequence name="4 · Every little win" from={T.wins.from} durationInFrames={T.wins.dur}>
      <S4Wins />
    </Sequence>
    <Sequence name="5 · Logo" from={T.logo.from} durationInFrames={T.logo.dur}>
      <S5Logo />
    </Sequence>
    <Soundtrack />
  </AbsoluteFill>
);
