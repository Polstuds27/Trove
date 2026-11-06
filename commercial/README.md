# Trove — 30 s commercial (Remotion)

A standalone Remotion + React + TypeScript project. It reads assets from the Trove app but never modifies the app's files.

| Composition | Size | FPS | Frames |
|---|---|---|---|
| `Trove` | 1920×1080 | 60 | 1800 (30.0 s) |
| `TroveVertical` | 1080×1920 | 60 | 1800 (30.0 s) |

```bash
npm install
npm run studio            # preview in Remotion Studio
npm run render            # out/trove-30s-1920x1080.mp4
npm run render:vertical   # out/trove-30s-1080x1920.mp4
npm run typecheck
```

## Storyboard

| Time | Scene | Picture | Motion | Type |
|---|---|---|---|---|
| 0–5 s | **1 · Question** | Cream paper. Sage ₱ glyphs on three depth planes. Real expenses from the demo ledger stack up as chips (Puregold −₱1,245.50, Condo rent −₱14,000.00…) | Slow drift and sway. At 4.5 s everything is pulled into the centre | "Where did my **money go?**" |
| 5–10 s | **2 · Meet** | A forest-green circle opens from the centre. Atlas drops in | Drop, squash on landing, Worried pose → small hop → Idle (two blinks) → Waving with a body rock | "Meet **Trove.**" + sprout · "Offline-first personal finance." |
| 10–18 s | **3 · Track. Plan. Grow.** | The forest panel lifts away. A phone with real mobile screens sits in front of a desktop window with the matching real desktop screens | Each beat pushes in a new screen (Transactions → Budget → Accounts). The active word lights up, then all three light up together | Captions come from the landing page: "Log it as it happens." / "Budgets that warn early." / "Every account in one place." |
| 18–25 s | **4 · Wins** | Sand paper slides in. A goal card shows the real "Japan trip" data next to the real Goals screen. Atlas holds the piggy bank | Three ₱5,500 contributions count up to ₱16,500 (37%). Atlas hops on each one. On the third, Atlas switches to Celebrating and confetti bursts in brand colours | "Every little win **matters.**" |
| 25–30 s | **5 · Logo** | Cream. A vector sprout mark plus the "Trove" wordmark | Stem grows, leaves spring open, wordmark tracking tightens, rule draws | "Your money, **understood.**" · OFFLINE-FIRST PERSONAL FINANCE |

The film uses one motion language throughout: expo-out entrances, expo-in exits, ease-in-out camera moves and wipes. Words rise out of a mask. Light comes from the upper left, so shadows fall down and to the right.

## Asset manifest

| Asset | Source | Notes |
|---|---|---|
| `public/mascot/*.png` (15 poses) | `web/public/mascot/ultra-refined/` | Built by `tools/prep_mascot.py`: cropped, the faint background haze removed, normalised to 1100 px tall. `src/mascot-meta.json` stores the feet anchor and Idle eye positions |
| `public/ui/mobile-*.png`, `desktop-*.png` | Captured from the real app by `tools/capture_ui.py` | 390×844 @3x and 1440×900 @2x. Routes: overview, transactions, budgets, accounts, goals, statistics |
| Sprout mark (`src/components/Logo.tsx`) | Vector redraw of `web/public/icons/icon-512.png` | Stem and leaves are separate so the mark can grow |
| `public/audio/soundtrack.wav` | `tools/make_soundtrack.py` | Original score synthesised from code, with no samples and no third-party audio. Cues line up with the scene timings |
| Font | Inter (`@remotion/google-fonts`, latin + latin-ext for ₱) | Same typeface as the app |

All numbers on screen come from the seeded demo ledger, so the motion-graphic goal card matches the captured Goals screen exactly.

### Recapturing the UI
```bash
python commercial/tools/demo_api.py                                       # repo root; SQLite-only API on :8000
cd web && VITE_API_URL=http://localhost:8000/api/v1 npx vite --port 5174  # second terminal
python commercial/tools/capture_ui.py all                                 # needs Python Playwright + Chrome
```
`demo_api.py` keeps its SQLite database in `tools/.demo-db/` and asserts that it is SQLite before doing anything, so the configured Postgres is never touched. It turns off email, seeds one verified local user (credentials are in the file's docstring) and pushes PHP data through the app's own `/sync/push/` protocol.

## Mascot rigging: what is and isn't possible
The Atlas artwork is **flat, single-layer PNG renders**, with no SVG and no separate limbs. So:
- **Done:** whole-character transforms only. That covers idle breathing, drop-in with squash and stretch, hops with anticipation, a celebration jump, a body rock during the wave, and a contact shadow that follows the jump height. Poses change with a short cross-dissolve and a scale pop (Worried → Idle → Waving, Bank-Happy → Celebrating).
- **Blinks:** feathered skin-tone lids are painted over the Idle pose's measured eye positions. Other poses don't blink, because their eyes are closed, stylised, or couldn't be measured reliably.
- **Not done:** independent head, arm or leg rigging. The wave is the artwork's own Waving pose, not an animated arm. Real limb animation would need layered artwork (one SVG or PNG layer per part).

## Audio
`Soundtrack.tsx` plays `public/audio/soundtrack.wav` only if the file exists (it checks with `getStaticFiles()`). To use a licensed track, put it at that path. If you delete the file, the film renders silent.
