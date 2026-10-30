/**
 * Route table.
 *
 * Three tiers: the public auth routes render full-bleed, everything else lives
 * inside the app shell, and `/` never renders anything — it forwards straight to
 * `/overview` so the first screen is always a real one.
 */
import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useSearchParams, type Location } from "react-router-dom";
import { useModalBackground } from "./app/modalRoutes";

import { useAuth } from "./auth/AuthContext";
import { isAuthRoute } from "./app/navigation";
import { AppShell, RouteTransition } from "./components/layout/AppShell";
import { AppLockGate } from "./components/layout/AppLockGate";
import { ErrorBoundary } from "./components/ui";
import { QuickAddSheet } from "./features/transactions/QuickAddSheet";

/* Public ------------------------------------------------------------------ */
import { LoginPage } from "./features/auth/LoginPage";
import { LandingPage } from "./features/landing/LandingPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { MfaPage } from "./features/auth/MfaPage";

/* Primary ----------------------------------------------------------------- */
import { OverviewPage } from "./features/overview/OverviewPage";
import { AccountsPage } from "./features/accounts/AccountsPage";
import { AccountDetailPage } from "./features/accounts/AccountDetailPage";
import { AccountEditor } from "./features/accounts/AccountEditor";
import { TransactionsPage } from "./features/transactions/TransactionsPage";
import { TransactionDetailPage } from "./features/transactions/TransactionDetailPage";
import { TransactionEditor } from "./features/transactions/TransactionEditor";
import { CategoriesPage } from "./features/categories/CategoriesPage";
import { CategoryEditor } from "./features/categories/CategoryEditor";
import { BudgetsPage } from "./features/budgets/BudgetsPage";
import { BudgetDetailPage } from "./features/budgets/BudgetDetailPage";
import { BudgetEditor } from "./features/budgets/BudgetEditor";
import { StatisticsPage } from "./features/statistics/StatisticsPage";
import { CalendarPage } from "./features/calendar/CalendarPage";

/* Planning ---------------------------------------------------------------- */
import { GoalsPage } from "./features/goals/GoalsPage";
import { GoalDetailPage } from "./features/goals/GoalDetailPage";
import { GoalEditor } from "./features/goals/GoalEditor";
import { DebtsPage } from "./features/debts/DebtsPage";
import { DebtDetailPage } from "./features/debts/DebtDetailPage";
import { DebtEditor } from "./features/debts/DebtEditor";
import { CreditCardsPage } from "./features/creditCards/CreditCardsPage";
import { RecurringPage } from "./features/recurring/RecurringPage";
import { RecurringDetailPage } from "./features/recurring/RecurringDetailPage";
import { RecurringEditor } from "./features/recurring/RecurringEditor";
import { InstallmentsPage } from "./features/installments/InstallmentsPage";
import { InstallmentDetailPage } from "./features/installments/InstallmentDetailPage";
import { InstallmentEditor } from "./features/installments/InstallmentEditor";

/* Organise ---------------------------------------------------------------- */
import { SearchPage } from "./features/search/SearchPage";
import { BookmarksPage } from "./features/bookmarks/BookmarksPage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { ConflictsPage } from "./features/conflicts/ConflictsPage";

/* Settings ---------------------------------------------------------------- */
import { SettingsPage } from "./features/settings/SettingsPage";
import { OverviewSection } from "./features/settings/OverviewSection";
import { ProfileSection } from "./features/settings/ProfileSection";
import { SecuritySection } from "./features/settings/SecuritySection";
import { AppearanceSection } from "./features/settings/AppearanceSection";
import { NotificationsSection } from "./features/settings/NotificationsSection";
import { CurrencySection } from "./features/settings/CurrencySection";
import { FinancialSection } from "./features/settings/FinancialSection";
import { SyncSection } from "./features/settings/SyncSection";
import { DataSection } from "./features/settings/DataSection";
import { DevicesSection } from "./features/settings/DevicesSection";
import { AboutSection } from "./features/settings/AboutSection";

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/mfa" element={<MfaPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function MainRoutes({ location }: { location?: Location | string }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={<OverviewPage />} />

      {/* Accounts (credit cards share the same ledger detail/editor) */}
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/:accountId" element={<AccountDetailPage />} />

      {/* Transactions */}
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/transactions/:transactionId" element={<TransactionDetailPage />} />

      {/* Categories */}
      <Route path="/categories" element={<CategoriesPage />} />

      {/* Budgets */}
      <Route path="/budgets" element={<BudgetsPage />} />
      <Route path="/budgets/:budgetId" element={<BudgetDetailPage />} />

      {/* Reporting */}
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />

      {/* Goals */}
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/goals/:goalId" element={<GoalDetailPage />} />

      {/* Debts */}
      <Route path="/debts" element={<DebtsPage />} />
      <Route path="/debts/:debtId" element={<DebtDetailPage />} />

      {/* Credit cards */}
      <Route path="/credit-cards" element={<CreditCardsPage />} />
      <Route path="/credit-cards/:cardId" element={<AccountDetailPage />} />

      {/* Recurring */}
      <Route path="/recurring" element={<RecurringPage />} />
      <Route path="/recurring/:recurringId" element={<RecurringDetailPage />} />

      {/* Installments */}
      <Route path="/installments" element={<InstallmentsPage />} />
      <Route path="/installments/:installmentId" element={<InstallmentDetailPage />} />

      {/* Organise */}
      <Route path="/search" element={<SearchPage />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/sync/conflicts" element={<ConflictsPage />} />

      {/* Settings */}
      <Route path="/settings" element={<SettingsPage />}>
        <Route index element={<OverviewSection />} />
        <Route path="profile" element={<ProfileSection />} />
        <Route path="security" element={<SecuritySection />} />
        <Route path="appearance" element={<AppearanceSection />} />
        <Route path="notifications" element={<NotificationsSection />} />
        <Route path="currency" element={<CurrencySection />} />
        <Route path="financial" element={<FinancialSection />} />
        <Route path="sync" element={<SyncSection />} />
        <Route path="data" element={<DataSection />} />
        <Route path="devices" element={<DevicesSection />} />
        <Route path="about" element={<AboutSection />} />
      </Route>

      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

const EDITORS = [
  { section: "accounts", param: "accountId", Editor: AccountEditor },
  { section: "transactions", param: "transactionId", Editor: TransactionEditor },
  { section: "categories", param: "categoryId", Editor: CategoryEditor },
  { section: "budgets", param: "budgetId", Editor: BudgetEditor },
  { section: "goals", param: "goalId", Editor: GoalEditor },
  { section: "debts", param: "debtId", Editor: DebtEditor },
  { section: "credit-cards", param: "cardId", Editor: AccountEditor },
  { section: "recurring", param: "recurringId", Editor: RecurringEditor },
  { section: "installments", param: "installmentId", Editor: InstallmentEditor },
];

function EditorRoutes() {
  return <Routes>{EDITORS.flatMap(({ section, param, Editor }) => [
    <Route key={`${section}-new`} path={`/${section}/new`} element={<Editor />} />,
    <Route key={`${section}-edit`} path={`/${section}/:${param}/edit`} element={<Editor />} />,
  ])}</Routes>;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const [params] = useSearchParams();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const onAuthScreen = isAuthRoute(pathname);
  const { backgroundLocation, editorOpen } = useModalBackground(isAuthenticated);

  // `/transactions?add=expense` opens the sheet straight into that type.
  const deepLinkAdd = pathname === "/transactions" && params.get("add") !== null;

  if (onAuthScreen) {
    // Already signed in: there is nothing to do on an auth screen.
    if (isAuthenticated && pathname !== "/reset-password" && !pathname.startsWith("/reset-password/")) {
      return <Navigate to="/overview" replace />;
    }
    return (
      <RouteTransition>
        <PublicRoutes />
      </RouteTransition>
    );
  }

  if (!isAuthenticated) {
    // Public: the landing page owns `/` and `/landing`; the catch-all inside
    // `PublicRoutes` still forwards every other path to the sign-in screen.
    return (
      <RouteTransition>
        <PublicRoutes />
      </RouteTransition>
    );
  }

  return (
    <>
      <AppLockGate>
        <AppShell onQuickAdd={() => setQuickAddOpen(true)}>
          {/* One broken route must not unmount the shell — and, without a
              boundary, React unmounts everything and leaves a white page. */}
          <ErrorBoundary>
            <MainRoutes location={backgroundLocation} />
            {editorOpen && <EditorRoutes />}
          </ErrorBoundary>
        </AppShell>
      </AppLockGate>
      <QuickAddSheet
        open={quickAddOpen || deepLinkAdd}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
}
