# Trove UI Redesign — Progress

Single source of truth: `docs/redesign-spec.md` (38 mockups, no images opened).
Branch: `redesign/spec`. Presentation only: no API, store, sync, auth or calculation changes.

## Phase checklist

### Setup
- [x] Branch `redesign/spec` created
- [x] Route inventory from `web/src/App.tsx`
- [ ] Playwright added and screenshot harness created

### 1. Tokens and shared components
- [x] Light token set (cream canvas, warm-white cards, forest text, sage/sand/clay charts, terracotta warning)
- [x] Dark token set (near-black canvas, #141815 surfaces, deep-forest hero, cream primary, sage fill)
- [ ] Card (solid, 24–28 radius)
- [x] GlassPanel (diagonal gradient, 1px white border, blur 16)
- [x] Button: primary, secondary, destructive
- [x] Input, Select (16 radius, 46 high where appropriate)
- [x] Pill (filter, fully round)
- [x] Badge (Paid, Next, Upcoming, Expense)
- [x] Toggle
- [x] ProgressBar (8px, warning/over-limit states)
- [x] Avatar (38px, pastel tints)
- [x] ListRow
- [x] SectionHeading
- [x] StatCard
- [x] PageHeader
- [x] EmptyState
- [x] Skeleton
- [x] Mascot module (semantic names only, all sprites mapped)

### 2. Shell
- [x] Desktop floating glass sidebar, inset 14, width ~240, radius 32, logo + live balance card + 3 nav groups + active pill
- [x] Desktop header: title/subtitle left, one primary action right
- [x] Mobile page header: subtitle, 28–30 title, 42 avatar
- [x] Mobile floating glass bottom nav (70 high, 5 items, active mapping)
- [x] Mobile More sheet (all routes, three headings)
- [x] Floating add button (52, all in-app screens, opens Add transaction)
- [x] Breakpoint 1024; 1024–1279 sidebar ~220; mobile content max ~640 centered
- [x] Dark shell token swap only

### 3. Overview / Home
- [x] Desktop hero, 3 stat cards, budget + mascot panel, recent transactions
- [x] Mobile header, hero, insight, budget, compact stats, recent
- [x] Loading, empty, error, offline (global banner + boundary; empty/loading on page)

### 4. Transactions, Accounts, Budget, Statistics
- [ ] Transactions desktop master-detail, search, pills, selected detail, mascot
- [ ] Transactions mobile grouped list + detail bottom sheet
- [ ] Accounts desktop two columns, recent activity, mascot
- [ ] Accounts mobile hero + list + detail screen
- [ ] Budget desktop two columns, category blocks, mascot panel
- [ ] Budget mobile one column
- [ ] Statistics desktop donut + paired bars + mascot
- [ ] Statistics mobile range pills + donut + legend + bars + mascot
- [ ] Loading, empty, error, offline for all four

### 5. Savings goals, Debts, Credit cards, Recurring, Installments, Calendar
- [ ] Savings goals desktop hero + 3 cards
- [ ] Savings goals mobile hero + stacked cards
- [ ] Debts desktop two columns + payment history
- [ ] Debts mobile three stacked sections
- [ ] Credit cards desktop card visual + used + payment due + activity
- [ ] Credit cards mobile stacked card + used + due + activity
- [ ] Recurring desktop naked stats + upcoming
- [ ] Recurring mobile glass hero + upcoming
- [ ] Installments desktop two plan cards + schedule + mascot
- [ ] Installments mobile stacked plans + schedule
- [ ] Calendar desktop grid + coming up + mascot
- [ ] Calendar mobile borderless grid + coming up
- [ ] Loading, empty, error, offline for all six

### 6. Categories, Search, Bookmarks, Settings
- [ ] Categories desktop two cards
- [ ] Categories mobile two sections
- [ ] Search desktop large input + results/filters + mascot
- [ ] Search mobile input + pills + results + mascot
- [ ] Bookmarks desktop/mobile empty glass card and populated list
- [ ] Settings desktop two columns (profile, preferences, notifications, sync, security + shield mascot)
- [ ] Settings mobile profile, preferences, notifications, sync, security
- [ ] Loading, empty, error, offline

### 7. Landing, Sign in, Create account
- [ ] Landing desktop nav, hero, features, how it works, install, CTA
- [ ] Landing mobile top bar, hero, four features, three steps, install
- [ ] Sign in desktop 50/50 sage panel + form
- [ ] Sign in mobile single column
- [ ] Sign in error banner, sad mascot, field error styling
- [ ] Create account desktop 50/50 with arms-up mascot
- [ ] Create account mobile single column

### 8. Remaining routes + states
- [ ] Forgot password, reset password, verify email, MFA
- [ ] Account new/detail/edit
- [ ] Transaction new/detail/edit + quick add
- [ ] Category new/edit
- [ ] Budget new/detail/edit
- [ ] Goal new/detail/edit
- [ ] Debt new/detail/edit
- [ ] Credit card new/detail/edit
- [ ] Recurring new/detail/edit
- [ ] Installment new/detail/edit
- [ ] Notifications
- [ ] Sync conflicts
- [ ] Settings nested sections (profile, security, appearance, notifications, currency, financial, sync, data, devices, about)
- [ ] 404 redirects
- [ ] Loading, empty, error, offline states everywhere

## Route inventory (from `web/src/App.tsx`)

### Public (no shell)
| Route | Page file |
| --- | --- |
| `/` | `features/landing/LandingPage.tsx` |
| `/landing` | `features/landing/LandingPage.tsx` |
| `/login` | `features/auth/LoginPage.tsx` |
| `/register` | `features/auth/RegisterPage.tsx` |
| `/forgot-password` | `features/auth/ForgotPasswordPage.tsx` |
| `/reset-password/:token` | `features/auth/ResetPasswordPage.tsx` |
| `/reset-password` | `features/auth/ResetPasswordPage.tsx` |
| `/verify-email` | `features/auth/VerifyEmailPage.tsx` |
| `/mfa` | `features/auth/MfaPage.tsx` |

### Main (shell)
| Route | Page file |
| --- | --- |
| `/overview` | `features/overview/OverviewPage.tsx` |
| `/accounts` | `features/accounts/AccountsPage.tsx` |
| `/accounts/new` | `features/accounts/AccountEditor.tsx` |
| `/accounts/:accountId` | `features/accounts/AccountDetailPage.tsx` |
| `/accounts/:accountId/edit` | `features/accounts/AccountEditor.tsx` |
| `/transactions` | `features/transactions/TransactionsPage.tsx` |
| `/transactions/new` | `features/transactions/TransactionEditor.tsx` |
| `/transactions/:transactionId` | `features/transactions/TransactionDetailPage.tsx` |
| `/transactions/:transactionId/edit` | `features/transactions/TransactionEditor.tsx` |
| `/categories` | `features/categories/CategoriesPage.tsx` |
| `/categories/new` | `features/categories/CategoryEditor.tsx` |
| `/categories/:categoryId/edit` | `features/categories/CategoryEditor.tsx` |
| `/budgets` | `features/budgets/BudgetsPage.tsx` |
| `/budgets/new` | `features/budgets/BudgetEditor.tsx` |
| `/budgets/:budgetId` | `features/budgets/BudgetDetailPage.tsx` |
| `/budgets/:budgetId/edit` | `features/budgets/BudgetEditor.tsx` |
| `/statistics` | `features/statistics/StatisticsPage.tsx` |
| `/calendar` | `features/calendar/CalendarPage.tsx` |
| `/goals` | `features/goals/GoalsPage.tsx` |
| `/goals/new` | `features/goals/GoalEditor.tsx` |
| `/goals/:goalId` | `features/goals/GoalDetailPage.tsx` |
| `/goals/:goalId/edit` | `features/goals/GoalEditor.tsx` |
| `/debts` | `features/debts/DebtsPage.tsx` |
| `/debts/new` | `features/debts/DebtEditor.tsx` |
| `/debts/:debtId` | `features/debts/DebtDetailPage.tsx` |
| `/debts/:debtId/edit` | `features/debts/DebtEditor.tsx` |
| `/credit-cards` | `features/creditCards/CreditCardsPage.tsx` |
| `/credit-cards/new` | `features/accounts/AccountEditor.tsx` |
| `/credit-cards/:cardId` | `features/accounts/AccountDetailPage.tsx` |
| `/credit-cards/:cardId/edit` | `features/accounts/AccountEditor.tsx` |
| `/recurring` | `features/recurring/RecurringPage.tsx` |
| `/recurring/new` | `features/recurring/RecurringEditor.tsx` |
| `/recurring/:recurringId` | `features/recurring/RecurringDetailPage.tsx` |
| `/recurring/:recurringId/edit` | `features/recurring/RecurringEditor.tsx` |
| `/installments` | `features/installments/InstallmentsPage.tsx` |
| `/installments/new` | `features/installments/InstallmentEditor.tsx` |
| `/installments/:installmentId` | `features/installments/InstallmentDetailPage.tsx` |
| `/installments/:installmentId/edit` | `features/installments/InstallmentEditor.tsx` |
| `/search` | `features/search/SearchPage.tsx` |
| `/bookmarks` | `features/bookmarks/BookmarksPage.tsx` |
| `/notifications` | `features/notifications/NotificationsPage.tsx` |
| `/sync/conflicts` | `features/conflicts/ConflictsPage.tsx` |
| `/settings` | `features/settings/SettingsPage.tsx` (index → `OverviewSection.tsx`) |
| `/settings/profile` | `features/settings/ProfileSection.tsx` |
| `/settings/security` | `features/settings/SecuritySection.tsx` |
| `/settings/appearance` | `features/settings/AppearanceSection.tsx` |
| `/settings/notifications` | `features/settings/NotificationsSection.tsx` |
| `/settings/currency` | `features/settings/CurrencySection.tsx` |
| `/settings/financial` | `features/settings/FinancialSection.tsx` |
| `/settings/sync` | `features/settings/SyncSection.tsx` |
| `/settings/data` | `features/settings/DataSection.tsx` |
| `/settings/devices` | `features/settings/DevicesSection.tsx` |
| `/settings/about` | `features/settings/AboutSection.tsx` |

## Mascot mapping

Source directory: `web/public/mascot/ultra-refined/` (18 files). Semantic names per spec §6.
All components must ask for a semantic name via `src/lib/mascot.ts`; no filenames in components.

| Semantic | Sprite | Verified |
| --- | --- | --- |
| waving | Waving.png | filename |
| piggy | Bank-Happy.png | unverified — no piggy filename |
| tablet | Board.png | unverified — no tablet filename |
| cheering | Happy-Rejoicing.png | unverified — filename suggests cheer |
| surprised | Curios.png | unverified |
| sleeping | Sleeping.png | filename |
| leaf | Leaf-Hello.png | filename |
| coin | Coin.png | filename |
| shield | Guard-Shield.png | filename |
| sad | Sad.png | filename |
| phone | Working.png | unverified |
| celebration | Celebrating.png | filename |
| happy | Happy.png | filename |
| idle | Idle.png | filename |
| sitting | Sitting-Idle.png | filename |
| relaxed | Relaxed.png | filename |
| worried | Worried.png | filename |
| sadder | Sadder.png | filename |

## Checks log

| Check | Result |
| --- | --- |
| typecheck | TODO |
| lint | TODO |
| test | TODO |
| build | TODO |
| Playwright routes 1440×900 / 390×844 light+dark | TODO |
| Screenshots to `docs/screenshots/` | TODO |

## Final report

TBD
