# FinTrack Commercial — 20s product ad (Remotion)

Programmatic 1080p commercial for the FinTrack PWA. Every product shot is the
real application: authenticated captures from the running dev server plus
on-device frames, real account data, the real icon and palette. No stock
footage, no AI people, no fabricated UI.

## Output

`output/fintrack-commercial-20s.mp4` — 1920×1080, 30fps, H.264 + AAC, 20.0s.

## Timeline (600 frames)

| Frames | Time | Scene |
|---|---|---|
| 0–75 | 0.0–2.5 | Hook — "WHERE DOES YOUR MONEY GO?" kinetic type |
| 75–165 | 2.5–5.5 | Reveal — real dashboard, "MEET FINTRACK" |
| 165–270 | 5.5–9.0 | Transactions — real ledger row, "TRACK EVERY PESO" |
| 270–375 | 9.0–12.5 | Insights — real statistics, "SEE WHERE IT GOES" |
| 375–465 | 12.5–15.5 | Montage — dashboard/ledger/insights/sync whips |
| 465–540 | 15.5–18.0 | Offline — "Still working. EVEN OFFLINE" |
| 540–600 | 18.0–20.0 | Brand — icon resolve, "FINTRACK / TAKE CONTROL." |

Audio is 100% synthesized with numpy — no samples, nothing copyrighted:

- `public/audio/music.wav` — 128 BPM upbeat electronic track (`audio/gen_music.py`):
  four-on-the-floor drums, pumping bass, bright pluck arp with echo, pads,
  risers, snare-roll build 16.5–18s, logo stinger at 18s.
- `public/audio/voice.wav` — spoken voiceover, en-US AriaNeural
  (`audio/gen_vo_lines.py` downloads the lines, `audio/mix_vo2.py` places them
  on the timeline). Regenerate any line by re-running those two scripts.
- `public/audio/bed_mix.wav` — music ducked under the voice + accent pings on
  VO onsets. This and `voice.wav` are what the timeline plays.

## Re-render

```sh
cd commercial
npm install                 # once
npm run audio               # regenerate the old ambient bed (optional)
npm run render              # → output/fintrack-commercial-20s.mp4
```

Single still: `npx remotion still src/index.ts FinTrackCommercial stills/x.png --frame=120`.
Typecheck: `npx tsc --noEmit`. Needs the Remotion headless browser once:
`npx remotion browser ensure`.

## Re-capturing product shots

`capture_tmp.py` / `capture_alltime.py` sign into the local dev server and
screenshot real screens into `shots/` (copy what you need to `public/assets/`).
Credentials come from `FT_EMAIL` / `FT_PASSWORD` env vars — never committed.
Capture against a demo account, never production data you don't own.

## Layout

- `src/Root.tsx` — composition (600f @30fps) + timeline
- `src/scenes*.tsx` — the seven scenes
- `src/stage.tsx` — full-bleed screenshot stage + side-panel stage
- `src/fx.tsx` — particles, kinetic type, glows, vignette
- `src/theme.ts` — FinTrack palette (`#0F766E`, `#2DD4BF`, slate ink)
- `public/assets/` — captures, icon, frames (all real product material)
- `public/audio/bed.wav` — generated bed
- `audio/gen_bed.py` — the synthesizer
