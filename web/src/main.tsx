import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import { SessionRecoveryProvider } from "./auth/SessionRecovery";
import { SyncProvider } from "./sync/SyncContext";
import { PreferencesProvider } from "./features/settings/preferences";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ui";
import { NetworkBanner } from "./components/layout/NetworkBanner";
import { registerServiceWorker } from "./app/pwa";
import { db } from "./db";

registerServiceWorker();

// Dev-only handle: lets the visual-QA pass seed synthetic data into IndexedDB
// from the console. `import.meta.env.DEV` is false in production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __trove?: unknown }).__trove = { db };
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <SyncProvider>
              <ToastProvider>
                <SessionRecoveryProvider>
                {/* Last line of defence: a render crash shows this instead of a
                    blank page, and keeps the rest of the shell mounted. */}
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
                <NetworkBanner />
                </SessionRecoveryProvider>
              </ToastProvider>
            </SyncProvider>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
