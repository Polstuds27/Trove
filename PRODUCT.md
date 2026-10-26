# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

> Interview note: the structured interview probe was interrupted by a server restart and no question tool remained available, so the facts below are **inferred from repository evidence** (README, landing page copy, routes, docs) unless marked _(confirmed in repo)_ or _(open)_. Nothing here was verbally approved by the user.

## Users

_(inferred)_ Individuals managing their own money across phone, tablet and laptop: cash, bank, e-wallet, savings, card, loan and investment accounts in one ledger. Primary situation is everyday personal finance — logging transactions as they happen, keeping budgets, and checking where money goes. _(open)_ Whether privacy-/self-hosting-minded users are a co-equal audience or a secondary draw is unconfirmed.

## Product Purpose

_(inferred)_ An offline-first personal finance management PWA that keeps working with no network at all: all recording, budgets, and reports are computed on-device from local data, and changes reconcile to the Django backend when connectivity returns. Success looks like a user who can fully run their personal finances — and trust the numbers — on any device, online or not.

## Positioning

_(inferred, grounded in landing copy)_ The mechanism neighboring budgeting apps can't truthfully copy wholesale: **local-first data with self-healing sync** — UUID ids, idempotency keys, versioning and deterministic conflict detection (`/sync/conflicts` UI), plus on-device analytics. The accompanying claim: "No bank logins, no data selling" — privacy by design, multi-currency, full feature breadth (budgets, goals, debts, installments, recurring, statistics, calendar) with no bank-linking dependency.

## Operating Context

_(inferred)_ Use is mobile-first and often offline (commutes, spotty coverage); the product installs as a PWA (service worker + manifest + install prompt UI). Development workflow is documented in `README.md` and `AGENTS.md`: Vite/React frontend (`web/`), Django + DRF backend (`api/`), local Postgres via docker-compose, production on Vercel + Render + Neon. Repo-level dev rules (e.g. migrations are generated but never run automatically) live in `AGENTS.md`, not here.

## Capabilities and Constraints

_(confirmed in repo)_

- Feature surface: overview, accounts (+ credit cards), transactions, categories, budgets, statistics, calendar, goals, debts, installments, recurring, search, bookmarks, notifications, settings (profile / security / appearance / notifications), landing + auth routes (login, register, forgot/reset password, verify email, MFA), sync conflict resolution.
- Offline-first is architectural: Dexie/IndexedDB local store in `web/`, background sync to the Django API; conflict UI at `/sync/conflicts`.
- PWA: installable, service worker, web manifest, icons.
- Multi-currency; balances derived from a transaction ledger.
- Quality gates: `npm run lint && npm run typecheck && npm run test && npm run build` (web); `ruff && mypy && pytest` (api).

_(open)_ Decisions not yet confirmed with the user: target market/region, monetization (no pricing exists anywhere in the repo — do not invent any), self-hosting story beyond the docker-compose dev setup, and whether a public launch/SEO goal exists.

## Brand Commitments

- Name: **FinTrack** _(confirmed in repo)_; descriptor "Personal Money Manager — offline-first PWA".
- Voice _(inferred from landing copy)_: plain, confident, concrete — feature claims stated as mechanics ("Sync that heals itself", "Budgets that warn early"), no hype.
- Visual identity: `docs/theme.md` defines the palette (Deep Emerald primary `#0F766E`, Mint accent `#2DD4BF`, Slate neutrals) as a directive for frontend work; treat it as the committed source of truth if/when design work touches these tokens.
- No logo asset beyond an in-code brand mark (Wallet icon in a rounded square).

## Evidence on Hand

- Real marketing copy and UI flows in `web/src/features/landing/` and `commercial/shots/` (screenshots: hero, login, overview, accounts, transactions, statistics, net worth).
- A finished 20s commercial: `commercial/output/fintrack-commercial-20s.mp4`.
- Palette + migration notes: `docs/theme.md`.
- **Absences future work must not fabricate:** no testimonials, customer lists, press, benchmarks, pricing, or launch claims exist anywhere in the repo.

## Product Principles

1. Local-first first: every feature must work fully offline; sync is opportunistic and eventually consistent, never a precondition.
2. One trustworthy ledger: balances and reports derive from transactions on-device, so numbers are instant and consistent everywhere.
3. Heal, don't block: conflicts are detected, versioned, and surfaced (`/sync/conflicts`), not dropped silently.
4. Privacy by construction: no bank logins, no data selling; the user's data is theirs on their device.
5. Finish over flourish: breadth is only claimed where it's real — the landing page's "Not a demo" line is the standard.
