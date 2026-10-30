/**
 * Persistent connection + update banner.
 *
 * Fixed to the bottom of the viewport (above the mobile bottom nav) so it is
 * visible on every screen without pushing content around. Being offline is not
 * an error — it is a supported state — so the copy says what happens to the
 * work rather than apologising for the connection.
 */
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useSessionRecovery } from "../../auth/SessionRecovery";
import { CloudUpload, RefreshCw, WifiOff, X, CircleAlert } from "lucide-react";
import { subscribeToUpdate, type UpdateHandle } from "../../app/pwa";
import { useSync } from "../../sync/SyncContext";

export function NetworkBanner() {
  const { isAuthenticated } = useAuth();
  const requestRecovery = useSessionRecovery();
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [update, setUpdate] = useState<UpdateHandle | null>(null);
  /** Per-drop dismissal: the notice comes back the next time the connection drops. */
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const { status, pendingCount, conflicts, syncNow } = useSync();
  const [recovering, setRecovering] = useState(false);
  // `navigator.onLine` lies when the backend alone is unreachable, so the
  // engine's verdict (any request failing below the HTTP layer) counts too.
  const offline = !online || status === "offline";

  useEffect(() => {
    const on = () => {
      setOnline(true);
      setOfflineDismissed(false);
    };
    const off = () => { setOnline(false); setOfflineDismissed(false); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => subscribeToUpdate(setUpdate), []);

  useEffect(() => {
    if (offline || status === "api-unavailable") {
      setRecovering(true);
      return;
    }
    if (!recovering || status !== "idle" || pendingCount > 0 || conflicts.length > 0) return;
    const timer = window.setTimeout(() => setRecovering(false), 3000);
    return () => window.clearTimeout(timer);
  }, [offline, status, recovering, pendingCount, conflicts.length]);

  if (update) {
    return (
      <div
        role="status"
        className="fixed inset-x-3 bottom-[calc(174px+env(safe-area-inset-bottom,0px))] z-[45] flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-surface px-3 py-2.5 shadow-lg backdrop-blur animate-rise sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm lg:bottom-4"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
          <CloudUpload aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">A new version of Trove is ready.</span>
        </span>
        <button
          type="button"
          onClick={update.apply}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
        >
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          Update
        </button>
      </div>
    );
  }

  if (offline && !offlineDismissed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-3 bottom-[calc(174px+env(safe-area-inset-bottom,0px))] z-[45] flex items-start gap-2.5 rounded-xl border border-warning/50 bg-warning-soft px-3 py-2.5 shadow-lg animate-rise sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm lg:bottom-4"
      >
        <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            Saved on this device. Sync will resume when you're connected.
          </p>
          {pendingCount > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              {pendingCount} change{pendingCount === 1 ? "" : "s"} waiting to be sent.
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss offline notice"
          onClick={() => setOfflineDismissed(true)}
          className="-mr-1.5 -mt-1.5 shrink-0 rounded p-2 text-warning/70 transition-colors hover:bg-warning/10 hover:text-warning"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (online && status === "signed-out" && isAuthenticated) {
    return (
      <div
        role="alert"
        className="fixed inset-x-3 bottom-[calc(174px+env(safe-area-inset-bottom,0px))] z-[45] flex items-center justify-between gap-3 rounded-xl border border-warning/50 bg-surface px-3 py-2.5 shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm lg:bottom-4"
      >
        <span className="text-sm text-ink">
          Sign in to resume syncing. Your changes are saved on this device.
        </span>
        <button
          type="button"
          onClick={requestRecovery}
          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-contrast hover:bg-primary-hover"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (online && recovering && (status === "syncing" ||
    (status === "idle" && pendingCount === 0 && conflicts.length === 0))) {
    return (
      <div role="status" aria-live="polite" className="fixed inset-x-3 bottom-[calc(174px+env(safe-area-inset-bottom,0px))] z-[45] flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 lg:bottom-4">
        <CloudUpload aria-hidden="true" className={`h-4 w-4 text-primary ${status === "syncing" ? "animate-pulse" : ""}`} />
        {status === "syncing" ? "Syncing saved changes…" : "All changes synced."}
      </div>
    );
  }

  // Reachable device, unreachable backend (or a rejected batch): surfaced with
  // a retry instead of silence — the queue itself is untouched.
  if (online && (status === "error" || status === "api-unavailable")) {
    const serverDown = status === "api-unavailable";
    if (serverDown && offlineDismissed) return null;
    return (
      <div
        role={serverDown ? "status" : "alert"}
        className={`fixed inset-x-3 bottom-[calc(174px+env(safe-area-inset-bottom,0px))] z-[45] flex items-center justify-between gap-3 rounded-xl border ${serverDown ? "border-line" : "border-expense/40"} bg-surface px-3 py-2.5 shadow-lg backdrop-blur animate-rise sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm lg:bottom-4`}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
          {serverDown ? <CloudUpload aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" /> : <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-expense" />}
          <span className="min-w-0">
            {serverDown
              ? "Saved on this device. Waiting to reconnect — sync will retry automatically."
              : "Sync failed — your changes are safe on this device."}
            {pendingCount > 0 && ` ${pendingCount} waiting.`}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void syncNow()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
        >
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          Retry
        </button>
        {serverDown && <button type="button" aria-label="Dismiss connection notice" onClick={() => setOfflineDismissed(true)} className="shrink-0 rounded p-1 text-muted hover:bg-surface-sunken"><X className="h-4 w-4" /></button>}
      </div>
    );
  }

  return null;
}
