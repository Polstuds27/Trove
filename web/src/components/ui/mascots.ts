/**
 * Backwards-compatible state map. New code should import from
 * `src/lib/mascot.ts` and request mascots by semantic state.
 */
import { MASCOTS, type MascotName } from "../../lib/mascot";
import type { MascotPose } from "./Mascot";

export const MASCOT_BY_STATE: Record<string, MascotName> = {
  greeting: "waving",
  goalReached: "celebration",
  goalOnTrack: "piggy",
  goalBehind: "sad",
  budgetOnTrack: "leaf",
  budgetWarning: "worried",
  budgetOverBudget: "sadder",
  empty: "idle",
  emptyTransactions: "tablet",
  emptyAccounts: "piggy",
  emptyGoals: "piggy",
  emptyBudgets: "leaf",
  emptySearch: "tablet",
  emptyBookmarks: "tablet",
  loading: "tablet",
  offline: "sleeping",
  error: "sadder",
  syncConflict: "sitting",
  onboarding: "leaf",
  landing: "relaxed",
  celebration: "celebration",
  success: "happy",
  guard: "shield",
  peek: "leaf",
  bankHappy: "piggy",
  board: "tablet",
  coin: "coin",
  note: "tablet",
  save: "piggy",
  talk: "waving",
  rest: "relaxed",
  sleep: "sleeping",
  idle: "idle",
};

/** Sprite file list (for coverage verification only). */
export const ALL_SPRITES: string[] = Object.values(MASCOTS).map((sprite) => sprite.src.split("/").pop() ?? "");

export type { MascotPose };
