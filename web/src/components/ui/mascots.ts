/**
 * Mascot state mapping.
 *
 * Single source of truth for which approved sprite represents each UI state.
 * One entry per state; every sprite in public/mascot/ultra-refined/ is used at
 * least once so the full approved set ships in the product.
 *
 * Adjust the choice here to repoint a state without touching components.
 */
import type { MascotPose } from "./Mascot";

/** Canonical state -> pose. Keep sizes consistent with the mockups. */
export const MASCOT_BY_STATE: Record<string, MascotPose> = {
  // Greeting / dashboard hero
  greeting: "waving",
  // Saving goals
  goalReached: "celebrate",
  goalOnTrack: "leafHello",
  goalBehind: "relaxed",
  // Budget
  budgetOnTrack: "happy",
  budgetWarning: "curios",
  budgetOverBudget: "worried",
  // Empty states
  empty: "idle",
  emptyTransactions: "idle",
  emptyAccounts: "idle",
  emptyGoals: "idle",
  emptyBudgets: "idle",
  emptySearch: "curios",
  emptyBookmarks: "curios",
  // Loading / offline / error
  loading: "working",
  offline: "sad",
  error: "sadder",
  syncConflict: "sittingIdle",
  // Onboarding / auth
  onboarding: "leafHello",
  landing: "relaxed",
  // Celebration
  celebration: "celebrating",
  success: "happyRejoicing",
  // Guard / protection
  guard: "guardShield",
  // Misc moments of need
  peek: "peek",
  bankHappy: "bankHappy",
  board: "board",
  coin: "coin",
  note: "note",
  save: "save",
  talk: "talk",
  rest: "rest",
  sleep: "sleep",
};

/** Sprite file list (all 18, for coverage verification). */
export const ALL_SPRITES: string[] = [
  "Bank-Happy.png",
  "Board.png",
  "Celebrating.png",
  "Coin.png",
  "Curios.png",
  "Guard-Shield.png",
  "Happy-Rejoicing.png",
  "Happy.png",
  "Idle.png",
  "Leaf-Hello.png",
  "Relaxed.png",
  "Sad.png",
  "Sadder.png",
  "Sitting-Idle.png",
  "Sleeping.png",
  "Waving.png",
  "Working.png",
  "Worried.png",
];
