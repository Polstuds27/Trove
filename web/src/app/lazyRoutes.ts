/**
 * Route-level code splitting.
 *
 * Each secondary screen is its own chunk so the first paint only pays for the
 * shell, the overview and the sign-in screens. Offline-first still holds: once
 * the app is idle and online, `prefetchRoutes()` pulls every chunk through the
 * service worker, which caches them (cache-first for `/assets/`). A user who
 * opens the app once and then loses signal can still reach every screen.
 */
import { lazy, type ComponentType } from "react";

type Loader = () => Promise<Record<string, unknown>>;

const loaders: Loader[] = [];

/** `React.lazy` for named exports, registered for idle prefetching. */
function named<T extends ComponentType<object>>(load: () => Promise<Record<string, unknown>>, name: string) {
  loaders.push(load);
  return lazy(async () => ({ default: (await load())[name] as T }));
}

/* Public */
export const RegisterPage = named(() => import("../features/auth/RegisterPage"), "RegisterPage");
export const ForgotPasswordPage = named(() => import("../features/auth/ForgotPasswordPage"), "ForgotPasswordPage");
export const ResetPasswordPage = named(() => import("../features/auth/ResetPasswordPage"), "ResetPasswordPage");
export const VerifyEmailPage = named(() => import("../features/auth/VerifyEmailPage"), "VerifyEmailPage");
export const MfaPage = named(() => import("../features/auth/MfaPage"), "MfaPage");

/* Primary */
export const AccountsPage = named(() => import("../features/accounts/AccountsPage"), "AccountsPage");
export const AccountDetailPage = named(() => import("../features/accounts/AccountDetailPage"), "AccountDetailPage");
export const AccountEditor = named(() => import("../features/accounts/AccountEditor"), "AccountEditor");
export const TransactionsPage = named(() => import("../features/transactions/TransactionsPage"), "TransactionsPage");
export const TransactionDetailPage = named(() => import("../features/transactions/TransactionDetailPage"), "TransactionDetailPage");
export const TransactionEditor = named(() => import("../features/transactions/TransactionEditor"), "TransactionEditor");
export const CategoriesPage = named(() => import("../features/categories/CategoriesPage"), "CategoriesPage");
export const CategoryEditor = named(() => import("../features/categories/CategoryEditor"), "CategoryEditor");
export const BudgetsPage = named(() => import("../features/budgets/BudgetsPage"), "BudgetsPage");
export const BudgetDetailPage = named(() => import("../features/budgets/BudgetDetailPage"), "BudgetDetailPage");
export const BudgetEditor = named(() => import("../features/budgets/BudgetEditor"), "BudgetEditor");
export const StatisticsPage = named(() => import("../features/statistics/StatisticsPage"), "StatisticsPage");
export const CalendarPage = named(() => import("../features/calendar/CalendarPage"), "CalendarPage");

/* Planning */
export const GoalsPage = named(() => import("../features/goals/GoalsPage"), "GoalsPage");
export const GoalDetailPage = named(() => import("../features/goals/GoalDetailPage"), "GoalDetailPage");
export const GoalEditor = named(() => import("../features/goals/GoalEditor"), "GoalEditor");
export const DebtsPage = named(() => import("../features/debts/DebtsPage"), "DebtsPage");
export const DebtDetailPage = named(() => import("../features/debts/DebtDetailPage"), "DebtDetailPage");
export const DebtEditor = named(() => import("../features/debts/DebtEditor"), "DebtEditor");
export const CreditCardsPage = named(() => import("../features/creditCards/CreditCardsPage"), "CreditCardsPage");
export const RecurringPage = named(() => import("../features/recurring/RecurringPage"), "RecurringPage");
export const RecurringDetailPage = named(() => import("../features/recurring/RecurringDetailPage"), "RecurringDetailPage");
export const RecurringEditor = named(() => import("../features/recurring/RecurringEditor"), "RecurringEditor");
export const InstallmentsPage = named(() => import("../features/installments/InstallmentsPage"), "InstallmentsPage");
export const InstallmentDetailPage = named(() => import("../features/installments/InstallmentDetailPage"), "InstallmentDetailPage");
export const InstallmentEditor = named(() => import("../features/installments/InstallmentEditor"), "InstallmentEditor");

/* Organise */
export const SearchPage = named(() => import("../features/search/SearchPage"), "SearchPage");
export const BookmarksPage = named(() => import("../features/bookmarks/BookmarksPage"), "BookmarksPage");
export const NotificationsPage = named(() => import("../features/notifications/NotificationsPage"), "NotificationsPage");
export const ConflictsPage = named(() => import("../features/conflicts/ConflictsPage"), "ConflictsPage");

/* Settings */
export const SettingsPage = named(() => import("../features/settings/SettingsPage"), "SettingsPage");
export const OverviewSection = named(() => import("../features/settings/OverviewSection"), "OverviewSection");
export const ProfileSection = named(() => import("../features/settings/ProfileSection"), "ProfileSection");
export const SecuritySection = named(() => import("../features/settings/SecuritySection"), "SecuritySection");
export const AppearanceSection = named(() => import("../features/settings/AppearanceSection"), "AppearanceSection");
export const NotificationsSection = named(() => import("../features/settings/NotificationsSection"), "NotificationsSection");
export const CurrencySection = named(() => import("../features/settings/CurrencySection"), "CurrencySection");
export const FinancialSection = named(() => import("../features/settings/FinancialSection"), "FinancialSection");
export const SyncSection = named(() => import("../features/settings/SyncSection"), "SyncSection");
export const DataSection = named(() => import("../features/settings/DataSection"), "DataSection");
export const DevicesSection = named(() => import("../features/settings/DevicesSection"), "DevicesSection");
export const AboutSection = named(() => import("../features/settings/AboutSection"), "AboutSection");

let prefetched = false;

/**
 * Warm every route chunk once the browser is idle, so the service worker has
 * the whole app cached before the user goes offline. Sequential and idle-paced
 * to stay out of the way of first interaction on slower phones.
 */
export function prefetchRoutes() {
  if (prefetched || typeof window === "undefined") return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  prefetched = true;
  const idle: (cb: () => void) => void =
    "requestIdleCallback" in window
      ? (cb) => (window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback(cb, { timeout: 4000 })
      : (cb) => window.setTimeout(cb, 1200);
  const queue = [...loaders];
  const next = () => {
    const load = queue.shift();
    if (!load) return;
    load().catch(() => undefined).finally(() => idle(next));
  };
  idle(next);
}
