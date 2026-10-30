import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { ownerKey } from "../auth/owner";
import { db } from "../db";
import type { ConflictEntry } from "../db/types";
import { outboxCount, getMeta, setMeta, releaseWronglyParked } from "./outbox";
import { runSync, type SyncState } from "./syncEngine";

const BASE_SYNC_INTERVAL_MS = 30_000;
const MAX_SYNC_INTERVAL_MS = 300_000;

/** Persisted so "last synced" survives reloads — React state alone forgets. */
const LAST_SYNC_KEY = "last_sync_at";

interface SyncContextValue {
  status: SyncState;
  pendingCount: number;
  conflicts: ConflictEntry[];
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, email, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SyncState>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const activeCycle = useRef<Promise<SyncState> | null>(null);
  const rerunRequested = useRef(false);

  // Checkpoints are keyed per account: the same canonical form the owner stamp
  // uses, so a case difference can't silently restart (or mislabel) a cursor.
  const accountKey = email ? ownerKey(email) : "anonymous";

  const runCycle = useCallback(async (): Promise<SyncState> => {
    try {
      if (!isAuthenticated) {
        setStatus("signed-out");
        // Signed out is still a state the Sync screen reports on: refresh the
        // numbers so it shows this device's held queue, not a stale snapshot.
        setPendingCount(await outboxCount());
        setConflicts(await db.conflicts.toArray());
        return "signed-out";
      }
      // The indicator's "Syncing…" state never appeared before: no code path
      // ever set it. Emit it here so the UI reflects an in-flight cycle.
      setStatus((current) => (current === "syncing" ? current : "syncing"));
      const next = await runSync(accountKey);
      setStatus(next);
      // Counts refresh on EVERY outcome, not just success: after an offline or
      // failed cycle the queued changes are exactly what the user must see, and
      // a partial push still changed local rows that queries should refetch.
      setPendingCount(await outboxCount());
      setConflicts(await db.conflicts.toArray());
      if (next === "idle") {
        // Profile settings aren't ledger change-log rows. Refresh them on the
        // same cycle so manual sync, reconnect and other-device edits converge.
        await refreshProfile();
        const now = new Date();
        setLastSyncedAt(now);
        // Stored UTC ISO; display localises to Asia/Manila in `formatDateTime`.
        await setMeta(LAST_SYNC_KEY, now.toISOString());
        void queryClient.invalidateQueries();
      } else if (next === "error") {
        void queryClient.invalidateQueries();
      }
      return next;
    } catch (error) {
      // A local storage/read failure must not reject out of the timer loop
      // and permanently stop automatic syncing for this app session.
      console.warn("Trove: sync cycle failed; automatic retry remains active", error);
      setStatus("error");
      return "error";
    }
  }, [accountKey, isAuthenticated, queryClient, refreshProfile]);

  const requestCycle = useCallback(async (): Promise<SyncState> => {
    if (activeCycle.current) {
      // Reconnect can arrive while a request from the dead connection is
      // still timing out. Preserve the wake-up instead of sharing its failure.
      rerunRequested.current = true;
      return activeCycle.current;
    }
    const work = (async () => {
      let outcome: SyncState;
      do {
        rerunRequested.current = false;
        outcome = await runCycle();
      } while (rerunRequested.current);
      return outcome;
    })();
    activeCycle.current = work;
    try {
      return await work;
    } finally {
      activeCycle.current = null;
    }
  }, [runCycle]);

  const syncNow = useCallback(async () => {
    await requestCycle();
  }, [requestCycle]);

  // Restored timestamp first: React state forgets across reloads, the meta
  // table doesn't. The amnesty runs alongside it so wrongly-parked entries
  // rejoin the push batch before the first cycle of this launch.
  useEffect(() => {
    void getMeta(LAST_SYNC_KEY)
      .then((value) => {
        if (value) {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) setLastSyncedAt(parsed);
        }
      })
      .catch((error) => console.warn("Trove: couldn't restore sync timestamp", error));
    void releaseWronglyParked()
      .then((released) => {
        if (released > 0) void syncNow();
      })
      .catch((error) => console.warn("Trove: couldn't restore held sync entries", error));
  }, [syncNow]);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("signed-out");
      return;
    }
    void syncNow();
  }, [isAuthenticated, syncNow]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let timer = 0;
    let failures = 0;
    let scheduleVersion = 0;
    const loop = async () => {
      if (cancelled) return;
      const version = ++scheduleVersion;
      window.clearTimeout(timer);
      const outcome = await requestCycle();
      // Focus, pageshow and online can fire together. Only the newest wake
      // schedules the next timer, so retries never multiply.
      if (cancelled || version !== scheduleVersion) return;
      failures = outcome === "idle" ? 0 : failures + 1;
      const delay = Math.min(BASE_SYNC_INTERVAL_MS * 2 ** failures, MAX_SYNC_INTERVAL_MS);
      timer = window.setTimeout(loop, delay);
    };
    const wake = () => {
      failures = 0;
      void loop();
    };
    const onOnline = wake;
    // `offline` fires reliably even when `navigator.onLine` is stale, so the
    // indicator flips immediately instead of waiting for the next attempt.
    const onOffline = () => {
      setStatus("offline");
      void outboxCount()
        .then(setPendingCount)
        .catch(() => {});
    };
    // Returning to the tab (or the installed PWA) resumes sync without
    // requiring a reload — the interval alone could leave a returning user
    // staring at stale state.
    const onVisible = () => {
      if (document.visibilityState === "visible") wake();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", wake);
    window.addEventListener("pageshow", wake);
    document.addEventListener("visibilitychange", onVisible);
    // Backoff, not a hammer: consecutive failures double the delay
    // (30s → 60s → 120s → … capped at 5min) and any success resets it. While
    // offline the early return costs nothing; while the API is down this
    // stops the client from pointlessly knocking every 30 seconds.
    timer = window.setTimeout(loop, BASE_SYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pageshow", wake);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, requestCycle]);

  const value = useMemo(
    () => ({ status, pendingCount, conflicts, lastSyncedAt, syncNow }),
    [status, pendingCount, conflicts, lastSyncedAt, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used inside SyncProvider");
  return ctx;
}
