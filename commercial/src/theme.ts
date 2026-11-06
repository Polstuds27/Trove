import { Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

/** Brand palette — docs/theme.md */
export const C = {
  forest: "#294737",
  forestDeep: "#1E3529",
  sage: "#9BA78A",
  warmGray: "#D9D3C9",
  cream: "#F7F0E5",
  creamHi: "#FBF7F0",
  sand: "#DFC5AD",
  ink: "#1F2A24",
  muted: "#6B7268",
  expense: "#B4552F",
} as const;

export const FPS = 60;
export const DURATION = 30 * FPS;

/** One motion language for the whole film. */
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
  in: Easing.bezier(0.7, 0, 0.84, 0), // exits
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera moves, wipes
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Scene boundaries in frames (60 fps). */
export const T = {
  question: { from: 0, dur: 320 },
  meet: { from: 300, dur: 320 },
  features: { from: 600, dur: 500 },
  wins: { from: 1080, dur: 440 },
  logo: { from: 1500, dur: 300 },
} as const;

/** Shared depth: light from upper-left, shadows fall down-right. */
export const shadow = {
  card: "0 2px 6px rgba(30,53,41,0.06), 0 24px 60px -12px rgba(30,53,41,0.22)",
  device: "0 4px 10px rgba(20,35,27,0.10), 0 50px 100px -20px rgba(20,35,27,0.38)",
};
