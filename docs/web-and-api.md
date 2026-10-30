# Web Application and API Guide

This guide describes the web client and backend API as implemented in this repository. It is intended as a developer-facing orientation and endpoint reference. The product is an offline-first personal finance PWA: the browser keeps the working ledger locally, while the Django API provides authentication, durable server storage, synchronization, and selected online-only services.

## Contents

- [Architecture at a glance](#architecture-at-a-glance)
- [Web application](#web-application)
- [Local data and offline behavior](#local-data-and-offline-behavior)
- [Synchronization protocol](#synchronization-protocol)
- [API application](#api-application)
- [API endpoint reference](#api-endpoint-reference)
- [Data ownership and security](#data-ownership-and-security)
- [Configuration and deployment](#configuration-and-deployment)
- [Useful source locations](#useful-source-locations)

## Architecture at a glance

| Area | Implementation | Responsibility |
| --- | --- | --- |
| Web client | React 18, TypeScript, Vite, React Router | PWA interface, finance workflows, local calculations and presentation |
| Browser database | Dexie over IndexedDB | Durable local ledger, REST resource caches, mutation outbox, sync checkpoints, and conflicts |
| HTTP client | `web/src/api/client.ts` using browser `fetch` | JWT attachment/rotation, request timeouts, JSON parsing, and normalized errors |
| API | Django, Django REST Framework, SimpleJWT | User identity, online REST endpoints, validation, server persistence and sync processing |
| Relational database | PostgreSQL configuration (local PostgreSQL via Compose; Neon in deployment) | Canonical server-side rows, sync journal/checkpoints, auth and application records |
| File storage | Optional Cloudinary integration | Binary attachment/receipt uploads; binary content is not sent through ledger sync |
| Background work | django-q ORM broker | Scheduled recurring-transaction generation, alerts and maintenance |
| Web hosting | Vercel (configured for `web/`) | Static Vite build and PWA assets |
| API hosting | Render blueprint | Django API and background worker with PostgreSQL |

The normal user workflow is local-first. Finance pages query IndexedDB and update it immediately. The outbox records changes for later delivery. The API accepts those changes idempotently, records versioned events, and returns newer changes for the local database to apply. Some resources (profile, notifications, attachment metadata/uploads, and session management) use ordinary REST requests rather than the ledger sync protocol.

## Web application

### Boot sequence and global providers

`web/src/main.tsx` mounts the app under React Strict Mode, a TanStack Query client, BrowserRouter, and application providers. The providers establish authentication, user preferences, synchronization status, toast notifications, session recovery, and a top-level error boundary. A network banner is mounted alongside the routed application. In production, the PWA service worker is registered from `web/src/app/pwa.ts`; it is not registered in development.

The global providers do not make every feature server-dependent. Finance data is stored locally and should remain readable while offline. Query invalidation is used after successful synchronization and selected error outcomes so feature views can refresh from current local data.

### Route map

`web/src/App.tsx` has public/authenticated route tiers. Authentication screens render without the app shell; signed-in screens are inside the shared shell and lock gate. The root route redirects to `/overview` for signed-in users. Unknown paths redirect to `/overview` in the signed-in application and to `/login` in public routes.

#### Public routes

| Route | Screen |
| --- | --- |
| `/` and `/landing` | Product landing page |
| `/login` | Sign in; includes the MFA challenge flow |
| `/register` | Account registration |
| `/forgot-password` | Request a password-reset email |
| `/reset-password` and `/reset-password/:token` | Complete password reset |
| `/verify-email` | Verify an email address from the email link |
| `/mfa` | Multi-factor authentication challenge/recovery flow |

#### Signed-in routes

| Route | Screen/area |
| --- | --- |
| `/overview` | Dashboard and key financial summary |
| `/accounts`, `/accounts/:accountId` | Account list and account detail |
| `/transactions`, `/transactions/:transactionId` | Ledger list and transaction detail |
| `/categories` | Income/expense categories |
| `/budgets`, `/budgets/:budgetId` | Budgets and budget details |
| `/statistics` | Financial statistics and reporting views |
| `/calendar` | Calendar-oriented finance view |
| `/goals`, `/goals/:goalId` | Savings goals |
| `/debts`, `/debts/:debtId` | Debts and repayment details |
| `/credit-cards`, `/credit-cards/:cardId` | Credit-card views; card detail uses the account detail page |
| `/recurring`, `/recurring/:recurringId` | Recurring transaction rules |
| `/installments`, `/installments/:installmentId` | Installment plans |
| `/search` | Search across local finance data |
| `/bookmarks` | Bookmarked transactions |
| `/notifications` | In-app notification inbox |
| `/sync/conflicts` | Review and resolve synchronization conflicts |
| `/settings` | Settings overview and nested settings sections |

Settings child routes include `/settings/profile`, `/security`, `/appearance`, `/notifications`, `/currency`, `/financial`, `/sync`, `/data`, `/devices`, and `/about` (all prefixed by `/settings`).

Create/edit routes are opened as routed editor overlays for accounts, transactions, budgets, categories, goals, debts, recurring rules, and installments. Their shape is `/<section>/new` or `/<section>/:id/edit`. The modal-route helper preserves the underlying page and its list/filter state where possible. Transactions also support a quick-add sheet, including direct entry via `/transactions?add=expense`.

### Feature organization

`web/src/features/` keeps page-level work grouped by domain. Current feature folders are accounts, analytics, auth, bookmarks, budgets, calendar, categories, conflicts, credit cards, debts, goals, installments, landing, notifications, overview, recurring, search, settings, statistics, and transactions. Shared application shell/layout behavior is in `web/src/components/layout/`; reusable controls, overlays, charts, feedback, and other presentation primitives are in `web/src/components/ui/`.

Feature code generally reads from local repositories or IndexedDB rather than requiring an API round trip to render the ledger. Authentication and selected server-owned resources use the API client directly. TanStack Query is available for remote/query lifecycle integration, while Dexie React hooks provide reactive reads from IndexedDB.

### Authentication state in the browser

`web/src/auth/AuthContext.tsx` owns sign-in state and user profile actions. Access and refresh JWTs are stored in `localStorage` under `fintrack_access` and `fintrack_refresh`; profile display fields are also cached locally for offline display. The API client sends access tokens as `Authorization: Bearer <token>`.

When a user signs in, the client verifies ownership of the local finance cache before associating it with the account. A different account's cache is cleared rather than displayed or uploaded as the new user. Normal logout revokes the refresh token when possible and clears local credentials and user data. The separate credential-flush/session-recovery path is designed to let the user reauthenticate while preserving their queued ledger changes.

### PWA and shell behavior

The PWA uses a web manifest and a production service worker at `/sw.js` with root scope. The UI also includes network and sync indicators, an app-lock gate, responsive navigation, and a shared route shell. `web/src/app/pwa.ts` owns service-worker lifecycle/update signaling and install-related behavior; `web/src/components/layout/NetworkBanner.tsx` and `SyncIndicator.tsx` present connectivity and sync state.

## Local data and offline behavior

### IndexedDB schema

The Dexie database is named `fintrack` and is defined in `web/src/db/index.ts`. Its business tables include:

- `accounts`, `account_groups`
- `transactions`, `categories`, `tags`
- `budgets`, `recurring`, `installments`
- `debts`, `savings_goals`, `exchange_rates`

Additional local-only or REST-cached tables include:

- `attachments` and `notifications`: cached REST resources; not ledger sync entities
- `profile`: non-secret display identity/currency cache
- `outbox`: queued create/update/delete mutations
- `conflicts`: unresolved local/server disagreements
- `meta`: client identity, account-scoped pull checkpoints and sync timestamps

Dexie schema versions migrate the local database as fields and tables evolve. Local finance rows carry version and sync status metadata, timestamps and deletion markers where applicable. UUID identifiers allow offline-created rows to be stable before they reach the server.

### Ledger calculations

The web app derives account balances and analytics from local ledger data. The browser can therefore render current figures immediately and keep most finance workflows usable without a network. The API also recomputes account balances when server-side REST or sync operations affect transactions; this protects consistency for server persistence and other clients.

### Outbox and network errors

Local edits are stored before delivery. The API client applies a 30-second request timeout. A connection failure or timeout is represented as an `ApiError` with status `0`, which means the result is unconfirmed—not that the server rejected the mutation. The client keeps the outbox entry for retry. HTTP errors are handled separately; permanent validation/unknown-entity sync rejections can be parked as failed, while retryable failures remain queued.

Attachment bytes are a special case: an upload requires connectivity and configured file storage. The browser stores attachment metadata/state locally, but the binary upload goes through the attachment REST API rather than being encoded as a sync mutation.

## Synchronization protocol

The shared contract is represented in `web/shared/sync-protocol.ts`; the client implementation is in `web/src/sync/`, and the server implementation is in `api/apps/sync/`.

### Syncable entities

The current sync entities are account groups, accounts, budgets, categories, debts, exchange rates, installments, recurring rules, savings goals, tags, and transactions. Client table names are usually plural, while server event names are singular (for example, `transactions` ↔ `transaction`). Mapping and field-name normalization live in `web/src/sync/mapping.ts` and `api/apps/sync/views.py`.

### Push: `POST /api/v1/sync/push/`

The client sends a batch in this shape:

```json
{
  "client_id": "stable-client-id",
  "mutations": [
    {
      "client_mutation_id": "uuid-idempotency-key",
      "entity": "transactions",
      "entity_id": "uuid-of-row",
      "op": "create",
      "base_version": 0,
      "client_timestamp": "2026-01-15T10:30:00Z",
      "payload": { "amount": 12.5, "currency": "USD" }
    }
  ]
}
```

Operations are `create`, `update`, and `delete`. Each mutation carries an idempotency key, row UUID, base version, client timestamp, and JSON payload. The API stores the outcome per user and mutation key, so replaying a request returns the original result rather than applying it twice. The server validates and filters writable fields, scopes related rows to the authenticated user, versions each accepted row, and appends a change event.

Each result identifies the mutation and returns `accepted`, `conflict`, or `rejected`, optionally with the server version and an error `{code, message}`. Updates/deletes that use a stale `base_version` return a conflict. Deletes are soft deletes and produce tombstone events. Transaction changes trigger server-side balance recomputation for affected accounts.

### Pull: `POST /api/v1/sync/pull/`

The client sends `client_id` and `since_seq`. The response contains an ordered page of events:

```json
{
  "server_seq": 321,
  "has_more": false,
  "changes": [
    {
      "seq": 321,
      "entity": "transaction",
      "entity_id": "uuid-of-row",
      "version": 2,
      "op": "update",
      "payload": { "id": "uuid-of-row", "amount": "12.50" }
    }
  ]
}
```

Pull pages are capped at 500 events. The client applies each change to IndexedDB, then saves the returned sequence as the checkpoint for that account. When `has_more` is true it requests another page. Tombstone events carry delete information; normal events include the serialized entity payload.

### Conflict handling

The client protects queued local changes from being overwritten by an incoming server update. If the server version is newer while the row has queued edits, it records a conflict, marks the relevant outbox entries, and leaves the local row intact. The conflict screen offers two choices:

- **Use server version:** discard queued local mutations and replace the local row with the server version.
- **Keep local version:** rebase the queued mutation on the latest server version and retry it.

A single in-flight sync cycle is shared by concurrent callers. The sync provider triggers an initial cycle after sign-in, periodic cycles, and wake-ups on reconnect, focus, page show, and visibility return. Failures use exponential backoff, capped at five minutes. The UI can report idle, syncing, offline, API unavailable, signed out, or error states.

## API application

### API conventions

- API base path: `/api/v1/`.
- Authentication: SimpleJWT bearer access token for protected views.
- JSON is the default request/response format; multipart/form-data is supported for attachment uploads and transaction CSV import.
- DRF router resources use trailing slashes and standard list/retrieve/create/update/partial-update/delete actions unless a viewset intentionally limits the action mixins.
- Finance CRUD endpoints are scoped to the authenticated user and exclude soft-deleted records. Creates are associated with the authenticated user. Deletes generally write `deleted_at` and increment `version` instead of deleting the row.
- OpenAPI schema and Swagger UI are served from `/api/v1/schema/` and `/api/v1/docs/`.

### API application responsibilities

`api/config/urls.py` mounts the apps. `api/config/settings/` contains shared, development, production and test settings. Key app boundaries are:

- `apps.users`: user model, registration, verification, JWT session lifecycle, profile, password operations and MFA.
- `apps.finance`: account and ledger models, CRUD serializers/viewsets, reports, CSV import/export, balance and planning services.
- `apps.sync`: mutation idempotency records, change journal, per-client pull checkpoints, push/pull processing.
- `apps.notifications`: in-app alerts, inbox queries, read state and alert check actions.
- `apps.attachments`: attachment metadata and Cloudinary upload/delete integration.
- `apps.audit`: security-relevant and account activity audit records.
- `apps.common`: shared base model, email templates and email delivery.

The shared finance base model supplies UUID primary keys, user ownership, integer version, creation/update timestamps, and a nullable soft-delete timestamp. Financial amounts use decimal fields in the database. The core transaction model supports income, expense, and transfer entries, including optional category/tags and references to recurring rules, installment plans, goals, and debts.

## API endpoint reference

All paths below are relative to `/api/v1`, except `/ping/` and Django admin.

### Health, schema and admin

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/ping/` | Public | Returns `{"status":"ok"}` for health checks |
| `GET` | `/schema/` | Public | OpenAPI schema |
| `GET` | `/docs/` | Public | Swagger UI for the schema |
| Various | `/admin/` | Django admin policy | Django administration interface (not under `/api/v1`) |

### Authentication and account management (`/auth/`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register/` | Public, throttled | Create account and send verification email; new users receive seeded finance defaults |
| `POST` | `/auth/verify-email/` | Public, throttled | Verify using `uid` and token |
| `POST` | `/auth/login/` | Public, throttled | Obtain access/refresh tokens; accepts MFA proof when enabled |
| `POST` | `/auth/refresh/` | Refresh token, throttled | Rotate JWT credentials; old refresh token is blacklisted |
| `POST` | `/auth/logout/` | Authenticated | Blacklist the submitted refresh token |
| `POST` | `/auth/password-reset/` | Public, throttled | Request reset email; response does not reveal whether an address exists |
| `POST` | `/auth/password-reset/confirm/` | Public, throttled | Validate reset token and change password |
| `GET` | `/auth/sessions/` | Authenticated | List active refresh-token sessions and device labels |
| `DELETE` | `/auth/sessions/` | Authenticated | Revoke session by body `id` |
| `GET`, `PATCH`, `DELETE` | `/auth/profile/` | Authenticated | Read/update profile; delete user and associated data |
| `POST` | `/auth/change-password/` | Authenticated | Change password |
| `POST` | `/auth/mfa/enable/` | Authenticated, throttled | Begin MFA enrollment and return provisioning material |
| `POST` | `/auth/mfa/confirm/` | Authenticated, throttled | Confirm MFA; recovery codes are returned on enrollment |
| `POST` | `/auth/mfa/disable/` | Authenticated, throttled | Disable MFA after proof validation |
| `POST` | `/auth/mfa/regenerate/` | Authenticated, throttled | Regenerate pending enrollment secret |
| `POST` | `/auth/mfa/recovery-codes/` | Authenticated, throttled | Mint a new recovery-code set; plaintext is returned once |
| `POST` | `/auth/mfa/email/request/` | Public, throttled | Request email MFA code with account-blind response |

Login MFA accepts a time-based one-time password, an unused recovery code, or a valid email challenge code. MFA-required login is represented by the API error detail `mfa_required`; the web app then displays the challenge screen. The API applies an auth throttle scope to authentication/MFA operations.

### Finance resources (`/finance/`)

The resources below use authenticated, owner-scoped viewsets. Unless noted, DRF exposes the standard `GET` list, `POST` create, `GET` detail, `PUT` update, `PATCH` partial update, and `DELETE` soft-delete actions.

| Resource path | Resource | Filters/search or notes |
| --- | --- | --- |
| `/finance/account-groups/` | Account groups | Search by name |
| `/finance/accounts/` | Accounts | Filter by type, archived state and currency; search by name |
| `/finance/categories/` | Categories | Filter by type; search by name |
| `/finance/tags/` | Tags | Search by name |
| `/finance/transactions/` | Transactions | Filter by type, source/destination account, category, bookmark state and tags; search notes; JSON and multipart/form parsers |
| `/finance/budgets/` | Budgets | Filter by period |
| `/finance/recurring/` | Recurring rules | Filter by frequency, transaction type and enabled state |
| `/finance/installments/` | Installment plans | Filter by frequency |
| `/finance/debts/` | Debts | Filter by direction; search counterparty |
| `/finance/goals/` | Savings goals | Search by name |
| `/finance/exchange-rates/` | Exchange rates | Filter by base/quote currencies; order by date/rate |
| `/finance/reports/` | Read-only ledger analytics | Actions listed below; no generic model CRUD |

Additional finance actions:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/finance/accounts/{id}/balance/` | Return account ID and current balance |
| `POST` | `/finance/accounts/{id}/archive/` | Toggle archived state and increment version |
| `POST` | `/finance/transactions/{id}/bookmark/` | Toggle bookmarked state |
| `GET` | `/finance/transactions/export/` | Export filtered transactions as CSV |
| `POST` | `/finance/transactions/import_csv/` | Import CSV from uploaded `file` or `csv` text; optional `dry_run` |
| `GET` | `/finance/budgets/{id}/progress/` | Return calculated budget progress |
| `POST` | `/finance/recurring/run_due/` | Run due recurring rules immediately |
| `POST` | `/finance/recurring/{id}/preview/` | Preview the next three dates |
| `POST` | `/finance/installments/{id}/generate/` | Generate installment transactions; optional `regenerate` body flag |
| `GET` | `/finance/exchange-rates/convert/?amount=…&base=…&quote=…` | Convert using the user's stored rates |
| `POST` | `/finance/exchange-rates/bulk_upsert/` | Create/update rates from `rates: [{base_currency, quote_currency, rate, date, source?}]` |
| `GET` | `/finance/reports/summary/` | Summary as of optional `as_of=YYYY-MM-DD` |
| `GET` | `/finance/reports/monthly/?months=12` | Monthly series; months clamped to 1–60; optional `as_of` |
| `GET` | `/finance/reports/net-worth/?months=12` | Net-worth series; months clamped to 1–60; optional `as_of` |
| `GET` | `/finance/reports/upcoming/?days=14` | Upcoming items; days clamped to 1–180 |
| `GET` | `/finance/reports/year-in-review/` | Year summary selected from `as_of` (or current local date) |

Router action paths use DRF's trailing-slash convention. CSV import accepts `dry_run` values such as `1`, `true`, or `yes`; it returns a client-facing import summary rather than creating a separate import resource.

### Synchronization (`/sync/`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/sync/push/` | Authenticated | Submit batch of versioned, idempotent mutations |
| `POST` | `/sync/pull/` | Authenticated | Fetch ordered server events after `since_seq` for a client |

The request and response shapes are described in [Synchronization protocol](#synchronization-protocol). Pull responses are bounded to 500 events and use the server sequence as the next cursor.

### Notifications (`/notifications/`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/notifications/` | Authenticated | List user's notifications; `?unread=true` limits to unread |
| `GET` | `/notifications/{id}/` | Authenticated | Retrieve one notification |
| `DELETE` | `/notifications/{id}/` | Authenticated | Delete a notification |
| `GET` | `/notifications/summary/` | Authenticated | Return unread count |
| `POST` | `/notifications/read-all/` | Authenticated | Mark all notifications read |
| `POST` | `/notifications/{id}/read/` | Authenticated | Mark one notification read |
| `POST` | `/notifications/checks/` | Authenticated | Run budget, debt-due and goal alert checks on demand |

Notifications are not part of ledger sync. The frontend fetches and caches them through REST for offline reading; read-state mutations are sent to the API.

### Attachments (`/attachments/`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/attachments/` | Authenticated | List the user's non-deleted attachment metadata |
| `POST` | `/attachments/` | Authenticated | Create through the viewset serializer |
| `GET` | `/attachments/{id}/` | Authenticated | Retrieve attachment metadata |
| `DELETE` | `/attachments/{id}/` | Authenticated | Soft-delete metadata and remove the remote object |
| `POST` | `/attachments/upload/` | Authenticated | Upload multipart `file` or supported `data_url`; optional transaction, kind, file name and note |

Upload requires Cloudinary settings. The configured maximum upload size defaults to 8 MiB. The server verifies an optional linked transaction belongs to the requesting user and is not deleted. Upload returns `201 Created` with attachment metadata; storage failures are returned as validation errors.

## Data ownership and security

- Finance rows and REST resources are queried by authenticated user. A UUID alone does not grant access to another user's object.
- Finance CRUD delete is generally soft-delete behavior, allowing the sync log to distribute tombstones and avoiding silent loss to other devices.
- Sync mutation IDs are unique per user, preventing duplicate processing on retries.
- Version checks detect concurrent edits rather than applying stale writes silently.
- JWT refresh tokens rotate and the old token is blacklisted. The browser client coordinates refresh attempts so concurrent requests do not race the rotation.
- Password reset responses and email MFA request responses avoid confirming whether an account exists.
- Attachment content is stored externally when Cloudinary is configured; API database rows retain metadata and remote identifiers.
- Browser local data is associated with an account owner key. The login/cache-claim flow is intended to prevent one account's locally cached ledger from being sent under another account's credentials.

## Configuration and deployment

### Web

The API origin is configured with `VITE_API_URL`; if unset, `web/src/api/client.ts` uses `http://localhost:8000/api/v1`. Vite development runs from `web/` and defaults to its normal Vite development address. Production builds run TypeScript checking before Vite emits `web/dist/`. The repository's Vercel configuration targets `web/`.

Typical commands from `web/`:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

### API

The API reads environment settings from `api/.env` when present. The base configuration includes `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, email and frontend URL settings, CORS origins, and optional Cloudinary settings. Local database default is PostgreSQL at `localhost:5432/fintrack`; production deployment is configured for Neon PostgreSQL. For production Neon, the repository setup notes recommend the pooled `-pooler` connection string.

Email delivery supports configured Django email settings and an EmailJS production route. Verification/reset links are built from `FRONTEND_URL`. CORS defaults to the local Vite origin and must include the deployed frontend origin in deployment.

SimpleJWT configuration uses a 60-minute access-token lifetime and a 7-day rotating refresh-token lifetime with blacklist-after-rotation enabled. Default DRF throttle rates are 60 anonymous requests/minute and 600 authenticated requests/minute; auth views apply the `auth` scope (10/minute).

Background jobs are configured in django-q with the ORM broker. Scheduled jobs include recurring-transaction generation, alert evaluation and nightly maintenance. The deployment therefore needs the API and its background worker processes/configuration, not just the web process. Attachment upload requires Cloudinary credentials; without configured file storage, upload is rejected clearly.

Typical local commands, from repository root:

```bash
# Start local PostgreSQL
docker compose up -d db

# API, in api/
python -m venv .venv
pip install -r requirements/dev.txt
python manage.py runserver
python manage.py qcluster

# Web, in web/
npm install
npm run dev
```

Database schema changes should be handled with Django migrations. Repository development guidance explicitly says not to run `python manage.py migrate` automatically; run migrations only when appropriate for the task/environment and with explicit authorization.

## Useful source locations

| Area | Key files |
| --- | --- |
| Web routes and app composition | `web/src/App.tsx`, `web/src/main.tsx` |
| Shared app shell/navigation | `web/src/components/layout/AppShell.tsx`, `web/src/app/navigation.ts` |
| API client and token lifecycle | `web/src/api/client.ts`, `web/src/auth/AuthContext.tsx` |
| Browser schema and repositories | `web/src/db/index.ts`, `web/src/db/repositories.ts`, `web/src/db/types.ts` |
| Sync lifecycle and merge mapping | `web/src/sync/SyncContext.tsx`, `web/src/sync/syncEngine.ts`, `web/src/sync/mapping.ts`, `web/src/sync/outbox.ts` |
| Shared sync types | `web/shared/sync-protocol.ts` |
| Backend route mounts | `api/config/urls.py` |
| Backend settings | `api/config/settings/base.py`, `dev.py`, `prod.py`, `test.py` |
| Auth routes and views | `api/apps/users/urls.py`, `api/apps/users/views.py` |
| Finance models/routes/views | `api/apps/finance/models.py`, `urls.py`, `views.py` |
| Sync protocol implementation | `api/apps/sync/urls.py`, `views.py`, `serializers.py`, `models.py` |
| Attachment and notification endpoints | `api/apps/attachments/views.py`, `api/apps/notifications/views.py` |
| Repository-level setup/deployment notes | `README.md`, `docker-compose.yml`, `render.yaml`, `web/vercel.json` |
