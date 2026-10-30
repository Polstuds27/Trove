# Trove — Design System

Living design-system doc for Trove, written at finish (per Impeccable practice, not before build). Every claim below is grounded in the shipped repo (`web/` = Vite + React + Tailwind PWA); no source code was modified to produce this document.

---

## World statement

**Trove** is an iOS-inspired, restrained-glassmorphism finance PWA. The world is warm cream paper ground with forest actions, sage accents, and sand warmth. Type, palette, and density carry the financial hierarchy; brand personality arrives as material rather than decoration on every surface. There is exactly one signature move: glass at exactly three surfaces (floating mobile nav, glass net-worth/balance tile, and the quick-action sheet — shipped opaque). Navigation and controls stay standard web (no custom chrome, no gesture-only affordances). Mode = **Operate**: visitors come to record and read money; the shell and the task always lead, the world only lends type, palette, density, and one signature move.

---

## Palette tokens

All colors live as RGB triplets in `web/src/index.css`, exposed as CSS variables, and consumed by Tailwind via `web/tailwind.config.cjs`. Light is the default; `[data-theme="dark"]` overrides the semantic names only.

### Brand palette
| Token | Hex | RGB | Role |
|-------|-----|-----|------|
| forest | `#294737` | `41 71 55` | Primary actions, active nav |
| sage | `#9BA78A` | `155 167 138` | Brand sage accent |
| sand | `#DFC5AD` | `223 197 173` | Warm highlights, chart fills |
| cream | `#F7F0E5` | `247 240 229` | Canvas / paper ground |
| warm-gray | `#D9D3C9` | `217 211 201` | Hairlines |

### Semantic tokens (light)
| Token | Hex | RGB |
|-------|-----|-----|
| ink | `#1B2A22` | `27 42 34` |
| ink-soft | `#314037` | `49 64 55` |
| muted | `#6B7A6E` | `107 122 110` |
| faint | `#8A968B` | `138 150 139` |
| line | `#D9D3C9` | `217 211 201` |
| line-strong | `#C2BBAC` | `194 187 174` |
| income | `#1F6E42` | `31 110 66` |
| expense | `#B9372D` | `185 55 45` |
| transfer | `#3F608A` | `63 96 138` |
| warning | `#A05F10` | `160 95 16` |
| info | `#3F608A` | `63 96 138` |
| income-soft | `#E0ECE2` | `224 236 226` |
| expense-soft | `#F5E1DC` | `245 225 220` |
| transfer-soft | `#E0E7EF` | `224 231 239` |
| warning-soft | `#F4E7D5` | `244 231 213` |
| info-soft | `#E0E7EF` | `224 231 239` |
| primary-soft-bg | `#E7EADC` | `231 234 220` |
| overlay | `#1B2A22` | `27 42 34` |

### Warm dark (`[data-theme="dark"]`)
Canvas is `#131C16` (warm night forest), not a desaturated light theme.

| Token | Hex | RGB |
|-------|-----|-----|
| canvas | `#131C16` | `19 28 22` |
| surface | `#1A251E` | `26 37 30` |
| surface-raised | `#222F26` | `34 47 38` |
| surface-sunken | `#0F1712` | `15 23 18` |
| ink | `#F0EADF` | `240 234 223` |
| ink-soft | `#D6D0C4` | `214 208 196` |
| muted | `#9CA799` | `156 167 153` |
| faint | `#7C877A` | `124 135 122` |
| line | `#2C3A30` | `44 58 48` |
| line-strong | `#3C4C41` | `60 76 65` |
| income | `#5EBF85` | `94 191 133` |
| expense | `#F07C6E` | `240 124 110` |
| transfer | `#85A4CD` | `133 164 205` |
| warning | `#E7AE4A` | `231 174 74` |
| info | `#85A4CD` | `133 164 205` |
| forest | `#8CA48F` | `140 164 143` |
| sage | `#9BA78A` | `155 167 138` |
| sand | `#B09882` | `176 152 130` |
| income-soft | `#1E3A2A` | `30 58 42` |
| expense-soft | `#4A251F` | `74 37 31` |
| transfer-soft | `#1F2F40` | `31 47 64` |
| warning-soft | `#423318` | `66 51 24` |
| info-soft | `#1F2F40` | `31 47 64` |
| primary-soft-bg | `#202D24` | `32 45 36` |

---

## Typography

- **Font stack:** system first, no webfont — `-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif` (defined in `web/tailwind.config.cjs`).
- **`font-feature-settings`:** `"cv02", "cv03", "cv04", "tnum" 0` on `body` — tabular numerals default **off** (`tnum` 0).
- **Tabular numerals on money:** `.tabular` / `[data-numeric="true"]` → `font-variant-numeric: tabular-nums` (used on every monetary figure so columns line up).
- **Body measure:** 65–75ch.
- **Display caps:** `display-sm` (1.5rem, -0.02em), `display` (2rem, -0.025em), `display-lg` (2.75rem, -0.03em), `title` (1.125rem).
- **Tracking floor:** -0.04em.
- **Radii:** `xl` 12px / `2xl` 16px / `3xl` 20px.

---

## Glass policy

`.glass` (defined in `web/src/index.css`):
- `backdrop-filter: blur(16px) saturate(1.4)` with `background-color: rgb(var(--glass-bg))` (0.72 opacity) and a 1px hairline border.
- **Opaque fallback** via `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` — falls back to solid surface + line border.
- **Used only on:** floating mobile nav (`BottomNav`), glass net-worth/balance tile (`NetWorthCard` in the rail), and the quick-action sheet (shipped opaque — see remaining issues).
- **Never decorative** on cards or tables (cards stay opaque `bg-surface`).
- **Reduced motion:** `prefers-reduced-motion: reduce` is honored via the app-wide CSS hook already in `index.css` (all animations/transitions collapse to 0.01ms).

---

## Browser surfaces

- `::selection` themed `primary@0.22` (forest at 22% opacity), text stays ink.
- Scrollbar track transparent; thumb themed `line-strong@0.8`, rounded 999px, muted on hover.
- `color-scheme: light` on `:root`, overridden to `dark` under `[data-theme="dark"]`.

---

## Components

| Component | Description |
|-----------|-------------|
| **AppShell** | Persistent 256px rail (`w-64`) on desktop: Trove mark = lucide `Sprout`, "Trove / Personal finance" brand, glass net-worth tile, forest active-nav pill, opaque sticky header. Mobile: floating glass bottom nav + central FAB (quick-add). Drawer for secondary links. |
| **EmptyState** | Icon or mascot prop + title + description + action(s); never a bare "no data" message. |
| **Mascot** | Renders one approved pose as an `img` from `public/mascot/refined/`; RGBA, no animation, never behind text. |
| **ProgressBar** | Rounded-full bar, semantic tones (primary/income/expense/warning/info), clamped 0–100 with overflow flag. |
| **Stat** | Small labelled figure; `tone` colours the value, `emphasis` (normal/large/hero) sizes it; value always `tabular`. |
| **Card** | `rounded-xl border bg-surface` with card shadow — never glass. |
| **Button** | `primary` / `secondary` / `ghost` / `danger` / `income` / `expense`; sizes `sm`/`md`/`lg`; `IconButton` for icon-only controls (44px touch target). |

---

## Mascot policy

- Approved sprout artwork reused **as-is** from `web/public/mascot/refined/` (16 RGBA PNGs, provenance in `public/mascot/refined/manifest.json`, generated from the Trove Sprite Atlas).
- Sources `web/public/mascot/revised-mascot/` left **untouched**.
- Poses (16): `idle`, `celebrate`, `cheer`, `delight`, `sleep`, `read`, `talk`, `rest`, `ledger`, `coin`, `shy`, `note`, `save`, `guard`, `shield`, `peek`.
- Used at **moments of need only**: welcome empty states, landing hero (`idle`, size 256).
- **No continuous bouncing** (no bounce-loop animation), **never behind text** (always paired with real copy).

---

## Motion / respect

- **No animation library.** Transitions are plain CSS/Tailwind.
- **Reduced motion:** `prefers-reduced-motion: reduce` honored via the app-wide hook in `index.css` (all `animation-duration`/`transition-duration` collapse to 0.01ms).
- **Transitions:** only `duration-150` on the FAB active state (`active:scale-95`).

---

## PWA

- **Manifest** (`web/public/manifest.webmanifest`): name `"Trove — Personal finance"`, short_name `"Trove"`, `theme_color` `#294737` (light) / `#131C16` (dark), `background_color` `#F7F0E5`, icons present (192, 512, maskable-512, apple-touch 180), display standalone.
- **favicon.ico** added at `web/public/icons/favicon.ico`.
- **Title** `"Trove — Personal finance"` in `web/index.html`.
- Service worker (`web/public/sw.js`) precaches the app shell; API never cached; data freshness handled by the sync engine.

---

## Copy policy

Frontend/marketing rebranded **FinTrack → Trove** (landing, auth, shell, pages, settings, `index.html`, manifest, sw.js comment). The following are **unchanged**: backend, API contracts, package names, and all `fintrack_*` persistence/storage keys.

Preserved keys:
- `fintrack_access` — `web/src/api/client.ts`
- `fintrack_refresh` — `web/src/api/client.ts`
- `fintrack_email` — `web/src/auth/owner.ts`
- `fintrack_local_owner` — `web/src/auth/owner.ts`
- `fintrack_sync_debug` — `web/src/sync/debug.ts`
- `fintrack_mfa_pending` — `web/src/features/auth/MfaPage.tsx`

---

## Screens / components redesigned (key files changed)

Shell & layout:
- `web/src/components/layout/AppShell.tsx` — rail, bottom nav, header, glass net-worth tile
- `web/src/components/layout/NetworkBanner.tsx` — connection/update banner
- `web/src/components/layout/SyncIndicator.tsx` — sync status chip

Design system (`web/src/components/ui/`):
- `Mascot.tsx` (new) — 16 refined poses
- `Button.tsx`, `Controls.tsx`, `Overlay.tsx`, `Primitives.tsx`, `Feedback.tsx`, `Charts.tsx`, `PageHeader.tsx`
- `index.ts` barrel

Screens (`web/src/features/`):
- Landing: `landing/LandingPage.tsx`, `landing/InstallSection.tsx`
- Auth: `auth/LoginPage.tsx`, `auth/MfaPage.tsx`, `auth/AuthLayout.tsx`, `auth/CacheClaimRecovery.tsx`
- Overview: `overview/OverviewPage.tsx`
- Transactions: `transactions/TransactionsPage.tsx`, `transactions/QuickAddSheet.tsx`
- Accounts, Budgets, Credit cards, Debts, Goals, Installments, Recurring, Statistics, Calendar, Search, Bookmarks, Notifications, Conflicts
- Settings: `settings/SettingsPage.tsx` + sections (Profile, Appearance, Currency, Financial, Security, Notifications, Devices, Data, About)

Global:
- `web/src/index.css` — design tokens, glass, browser surfaces, reduced motion
- `web/tailwind.config.cjs` — semantic theme
- `web/index.html` — title, theme-color, favicon
- `web/public/manifest.webmanifest`, `web/public/sw.js`
- `web/public/icons/favicon.ico` (added)

---

## Verification results

- **lint ✓** — `eslint .` clean (no output, exit 0).
- **typecheck ✓** — `tsc --noEmit` clean (exit 0).
- **build ✓** — `vite build` succeeds; only pre-existing `>500 kB` chunk warning (`index-DApYNAKh.js`, 740.61 kB gzips to 203.36 kB).
- **impeccable detect → `[]` clean.**
- **tests: 32 passed / 1 pre-existing unrelated failure** — `format.test.ts` (`formatRelativeDay > agrees with the calendar day of ISO instants`) is date-sensitive: it hard-codes `2026-10-07` against `todayKey()`, so it passes only on Oct 7. Today is Oct 26, 2026, hence the single failure. All other 8 test files (32 tests) pass.

---

## Remaining issues (non-blocking)

1. **docs/theme.md stale** — still documents the old Deep Emerald / Mint / Slate palette; not updated to the forest/sage/cream/sand tokens shipped in `index.css`.
2. **Overview mobile source order** — mobile source order not yet aligned with the desktop visual hierarchy.
3. **Quick-action sheet shipped opaque** — glass contract permits it but the sheet is opaque; true glass blur not applied.
4. **caret-color not explicitly themed** — no explicit caret-color token; falls back to ink.
