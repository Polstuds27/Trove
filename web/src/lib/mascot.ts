/**
 * Semantic mascot registry.
 *
 * Components ask for a mascot by meaning, never by filename. The sprite files
 * live in `public/mascot/ultra-refined/` and are never recoloured or cropped.
 * The pose names come from docs/redesign-spec.md §6. Filename-only guesses are
 * marked `verified: false` and listed in docs/redesign-progress.md for review.
 */
export interface MascotSprite {
  name: string;
  src: string;
  verified: boolean;
  note?: string;
}

export const MASCOTS = {
  waving: {
    name: "Waving",
    src: "/mascot/ultra-refined/Waving.png",
    verified: true,
  },
  piggy: {
    name: "Holding a piggy bank",
    src: "/mascot/ultra-refined/Bank-Happy.png",
    verified: false,
    note: "Assigned from file order; confirm it shows a piggy bank",
  },
  tablet: {
    name: "Holding a tablet",
    src: "/mascot/ultra-refined/Working.png",
    verified: true,
    note: "Working.png shows the mascot holding a dark tablet",
  },
  card: {
    name: "Holding a card",
    src: "/mascot/ultra-refined/Board.png",
    verified: true,
    note: "Board.png shows a blank card held in both hands",
  },
  cheering: {
    name: "Arms up, cheering",
    src: "/mascot/ultra-refined/Happy-Rejoicing.png",
    verified: false,
    note: "Filename suggests celebration; confirm arms-up pose",
  },
  surprised: {
    name: "Hands on cheeks, surprised",
    src: "/mascot/ultra-refined/Curios.png",
    verified: false,
    note: "Assigned from file order; confirm hands-on-cheeks pose",
  },
  sleeping: {
    name: "Sleeping",
    src: "/mascot/ultra-refined/Sleeping.png",
    verified: true,
  },
  leaf: {
    name: "Hugging a leaf",
    src: "/mascot/ultra-refined/Leaf-Hello.png",
    verified: true,
  },
  coin: {
    name: "Holding a coin",
    src: "/mascot/ultra-refined/Coin.png",
    verified: true,
  },
  shield: {
    name: "Holding a shield",
    src: "/mascot/ultra-refined/Guard-Shield.png",
    verified: true,
  },
  sad: {
    name: "Sad or concerned",
    src: "/mascot/ultra-refined/Sad.png",
    verified: true,
  },
  phone: {
    name: "Holding a phone or tablet",
    src: "/mascot/ultra-refined/Working.png",
    verified: true,
    note: "Working.png is the closest available pose: the mascot holds a tablet",
  },
  celebration: {
    name: "Celebrating",
    src: "/mascot/ultra-refined/Celebrating.png",
    verified: true,
  },
  happy: {
    name: "Happy",
    src: "/mascot/ultra-refined/Happy.png",
    verified: true,
  },
  idle: {
    name: "Idle",
    src: "/mascot/ultra-refined/Idle.png",
    verified: true,
  },
  sitting: {
    name: "Sitting idle",
    src: "/mascot/ultra-refined/Sitting-Idle.png",
    verified: true,
  },
  relaxed: {
    name: "Relaxed, lounging",
    src: "/mascot/ultra-refined/Relaxed.png",
    verified: true,
  },
  worried: {
    name: "Worried",
    src: "/mascot/ultra-refined/Worried.png",
    verified: true,
  },
  sadder: {
    name: "Very sad",
    src: "/mascot/ultra-refined/Sadder.png",
    verified: true,
  },
  search: {
    name: "Search",
    src: "/mascot/ultra-refined/Search.png",
    verified: true,
  },
} as const satisfies Record<string, MascotSprite>;

export type MascotName = keyof typeof MASCOTS;

/** Every state the UI can request. */
export const MASCOT_STATES = {
  greeting: "waving",
  hero: "waving",
  signIn: "waving",
  landingHero: "phone",
  landingInstall: "waving",
  accounts: "waving",
  accountsEmpty: "piggy",
  piggyBank: "piggy",
  savings: "piggy",
  budgetOnTrack: "leaf",
  budgetWarning: "worried",
  budgetOver: "sadder",
  overviewInsight: "surprised",
  transactions: "surprised",
  transactionsEmpty: "tablet",
  searchEmpty: "search",
  search: "search",
  statistics: "tablet",
  installments: "tablet",
  bookmarks: "card",
  recurring: "sleeping",
  offline: "sleeping",
  createAccount: "cheering",
  calendar: "cheering",
  celebration: "celebration",
  success: "happy",
  happy: "happy",
  creditDue: "coin",
  settingsSecurity: "shield",
  signInError: "sad",
  loading: "tablet",
  error: "sadder",
  idle: "idle",
  working: "phone",
  conflicts: "sitting",
  landingRelaxed: "relaxed",
  notFound: "sitting",
} as const satisfies Record<string, MascotName>;

export type MascotState = keyof typeof MASCOT_STATES;

/** Backwards-compatible pose aliases used by older call sites. */
export const LEGACY_POSES: Record<string, MascotName> = {
  idle: "idle",
  phone: "phone",
  worried: "worried",
  sad: "sad",
  celebrating: "celebration",
  celebrate: "celebration",
  cheer: "cheering",
  delight: "happy",
  sleep: "sleeping",
  read: "tablet",
  talk: "waving",
  rest: "relaxed",
  ledger: "tablet",
  coin: "coin",
  shy: "surprised",
  note: "tablet",
  save: "piggy",
  guard: "shield",
  shield: "shield",
  peek: "leaf",
  bankHappy: "piggy",
  board: "tablet",
  curios: "surprised",
  guardShield: "shield",
  happy: "happy",
  happyRejoicing: "cheering",
  leafHello: "leaf",
  relaxed: "relaxed",
  sadder: "sadder",
  sittingIdle: "sitting",
  sleeping: "sleeping",
  waving: "waving",
  working: "phone",
};

/** Resolve a semantic state, a semantic sprite name or a legacy alias. */
export function mascotSrc(state: MascotState | MascotName | string): string {
  const semantic = (MASCOT_STATES as Record<string, MascotName>)[state];
  if (semantic) return MASCOTS[semantic].src;
  if ((MASCOTS as Record<string, MascotSprite>)[state]) return (MASCOTS as Record<string, MascotSprite>)[state].src;
  const legacy = LEGACY_POSES[state];
  if (legacy) return MASCOTS[legacy].src;
  return MASCOTS.idle.src;
}
