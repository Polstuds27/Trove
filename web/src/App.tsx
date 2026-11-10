/**
 * Route table.
 *
 * Three tiers: the public auth routes render full-bleed, everything else lives
 * inside the app shell, and `/` never renders anything — it forwards straight to
 * `/overview` so the first screen is always a real one.
 */
import { Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useSearchParams, type Location } from "react-router-dom";
import { useModalBackground } from "./app/modalRoutes";

import { useAuth } from "./auth/AuthContext";
import { isAuthRoute } from "./app/navigation";
import { AppShell, RouteTransition } from "./components/layout/AppShell";
import { AppLockGate } from "./components/layout/AppLockGate";
import { ErrorBoundary, PageLoader } from "./components/ui";
import { QuickAddSheet } from "./features/transactions/QuickAddSheet";

/* Eager: the first screen a visitor or a signed-in user sees. */
import { LoginPage } from "./features/auth/LoginPage";
import { LandingPage } from "./features/landing/LandingPage";
import { OverviewPage } from "./features/overview/OverviewPage";

/* Everything else is split per route (see app/lazyRoutes.ts). */
import {
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  MfaPage,
  AccountsPage,
  AccountDetailPage,
  AccountEditor,
  TransactionsPage,
  TransactionDetailPage,
  TransactionEditor,
  CategoriesPage,
  CategoryEditor,
  BudgetsPage,
  BudgetDetailPage,
  BudgetEditor,
  StatisticsPage,
  CalendarPage,
  GoalsPage,
  GoalDetailPage,
  GoalEditor,
  DebtsPage,
  DebtDetailPage,
  DebtEditor,
  CreditCardsPage,
  RecurringPage,
  RecurringDetailPage,
  RecurringEditor,
  InstallmentsPage,
  InstallmentDetailPage,
  InstallmentEditor,
  SearchPage,
  BookmarksPage,
  NotificationsPage,
  ConflictsPage,
  SettingsPage,
  OverviewSection,
  ProfileSection,
  SecuritySection,
  AppearanceSection,
  NotificationsSection,
  CurrencySection,
  FinancialSection,
  SyncSection,
  DataSection,
  DevicesSection,
  AboutSection,
  prefetchRoutes,
} from "./app/lazyRoutes";

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

  // Signed in: warm every route chunk while idle so the app works offline.
  useEffect(() => {
    if (isAuthenticated) prefetchRoutes();
  }, [isAuthenticated]);

  if (onAuthScreen) {
    // Already signed in: there is nothing to do on an auth screen.
    if (isAuthenticated && pathname !== "/reset-password" && !pathname.startsWith("/reset-password/")) {
      return <Navigate to="/overview" replace />;
    }
    return (
      <RouteTransition>
        <Suspense fallback={<PageLoader />}>
          <PublicRoutes />
        </Suspense>
      </RouteTransition>
    );
  }

  if (!isAuthenticated) {
    // Public: the landing page owns `/` and `/landing`; the catch-all inside
    // `PublicRoutes` still forwards every other path to the sign-in screen.
    return (
      <RouteTransition>
        <Suspense fallback={<PageLoader />}>
          <PublicRoutes />
        </Suspense>
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
            <Suspense fallback={<PageLoader />}>
              <MainRoutes location={backgroundLocation} />
            </Suspense>
            {/* Separate boundary: opening an editor must never blank the page under it. */}
            <Suspense fallback={null}>{editorOpen && <EditorRoutes />}</Suspense>
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
