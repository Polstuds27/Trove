---
version: 1
slug: "web-src"
primary_target: "web/src"
related_targets: []
---

# Trove — application shell and product screens (web/PWA)

**Mode:** Operate. Visitors come to record and read money; the shell and the task always lead, the world only lends type, palette, density and one signature move.

**Scope:** every authenticated screen plus landing/auth — shell (rail, header, mobile bottom nav), overview, transactions, accounts, budgets/categories, statistics, goals/debts/installments/recurring, settings. Visual redesign only: Dexie/sync/API/auth/financial math untouched.

**Constraints:** system font stack (no webfont), warm cream light theme + warm forest dark theme, glass restricted to floating mobile nav, quick-action sheet and one balance surface; mascot used at welcome, empty states, milestones only.

## Direction contract

**THESIS:** Trove reads money on warm paper, not on a dashboard: the category's teal-on-slate grid of identical cards is replaced by a cream ground where financial hierarchy comes from typography, alignment and whitespace, and brand personality arrives as material (forest actions, sage accents, a botanical mascot at moments of need) rather than as decoration on every surface.

**OWN-WORLD:** cream `#F7F0E5` canvas, `#FFFDFA`/white surfaces, forest `#294737` for primary actions and active navigation with mint-derived sage `#9BA78A` accents, sand `#DFC5AD` for warm highlights and chart fills, warm-gray `#D9D3C9` hairlines, ink `#1B2A22` / muted `#6B7A6E` text; dark theme is a warm night forest (deep `#131C16` canvas, cream ink). System sans, -0.02em display tracking, tabular numerals for every monetary figure, radii 12–20px, soft offset shadows, focus ring in sage. Glass (blur + hairline) only on: mobile bottom nav, quick-add sheet, sidebar balance tile.

**STORY:** the visitor opens Trove and within one viewport knows what they own, what this month did, and where to tap next — then records or inspects a transaction in two actions, trusting every number because it is derived on-device.

**FIRST VIEWPORT:** desktop — 256px brand rail (Trove mark, net-worth tile, grouped nav, user menu) against a cream canvas; page header with title left, contextual action right; overview leads with an un-carded balance block (total balance, month in/out delta), then cash-flow chart, budget progress, and a recent-transaction list composed at desktop scanning width. Mobile — compact header, thumb-reachable floating glass bottom nav with central add button, balance block first, single-column rhythm with 16px gutters.

**FORM:** brief-pinned direction (Trove brand brief, existing product); chosen structure is the rail + contextual header + composition-varied work areas. seed: none (unavailable).

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
