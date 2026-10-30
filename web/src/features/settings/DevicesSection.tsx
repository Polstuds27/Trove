/**
 * `/settings/devices` — sessions issued to your account.
 *
 * Each row is an outstanding refresh token, which is what a "device" really is
 * here. Removing one prevents its refresh token from renewing access.
 */
import { useCallback, useEffect, useState } from "react";
import { LogOut, MonitorSmartphone, RefreshCw } from "lucide-react";
import { ApiError, apiFetch, getRefreshToken } from "../../api/client";
import { Alert, Badge, Button, Card, ConfirmOverlay, EmptyState, useToast } from "../../components/ui";
import { formatDateTime } from "../../design/format";
import { useSync } from "../../sync/SyncContext";
import { Panel } from "./Panel";

interface Session {
  /** simplejwt's `OutstandingToken.id` is a `BigAutoField`, i.e. a number. */
  id: string | number;
  created_at: string;
  expires_at: string;
  jti: string;
  device_name?: string;
  signed_in_at?: string;
}

/** Match this browser's refresh token to its session row for display. */
function currentSessionId(): string | null {
  // Display matching only; the server still verifies and owns every session.
  try {
    const payload = getRefreshToken()?.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { jti?: string };
    return claims.jti ?? null;
  } catch {
    return null;
  }
}

export function DevicesSection() {
  const toast = useToast();
  const { lastSyncedAt } = useSync();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<Session[] | Record<string, unknown>>("/auth/sessions/");
      setSessions(Array.isArray(data) ? data.filter((row) => row != null) : []);
      setCurrentId(currentSessionId());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load sessions.");
      setSessions((current) => current ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, lastSyncedAt]);

  async function revoke(id: Session["id"]) {
    setBusy(true);
    try {
      await apiFetch("/auth/sessions/", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setSessions((current) => (current ?? []).filter((row) => row.id !== id));
      setSelected(null);
      toast.push({ tone: "success", title: "Device access removed", description: "This session can no longer renew its access." });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Couldn't revoke session",
        description: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Your devices"
        description="Review active sign-ins and remove access for a device you no longer use."
        footer={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />}
            loading={loading}
            disabled={busy || loading}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        }
      >
        {error && (
          <Alert tone="warning" title="Couldn't load sessions">
            {error}
          </Alert>
        )}

        {sessions === null ? (
          <p className="text-sm text-muted">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <EmptyState
            compact
            icon={<MonitorSmartphone className="h-6 w-6" />}
            title={error ? "Devices unavailable" : "No active sessions"}
            description={
              error
                ? "Your saved data is still available here. Reconnect or restore your session to view devices."
                : "Active sign-ins will appear here."
            }
            action={
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                Try again
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <MonitorSmartphone aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate">{session.device_name || "Browser session"}</span>
                  </p>
                  <p className="tabular mt-0.5 text-xs text-muted">
                    Signed in {formatDateTime(session.signed_in_at ?? session.created_at)} · renews until{" "}
                    {formatDateTime(session.expires_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {currentId === session.jti && (
                    <Badge tone="primary">This device</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<LogOut className="h-3.5 w-3.5" />}
                    disabled={busy || loading || currentId === session.jti}
                    onClick={() => setSelected(session)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Card className="p-4">
        <p className="text-sm text-muted">
          Removing a device stops this session from renewing. Its existing access can remain valid
          for up to 60 minutes. Use Profile → Sign out to end the session on this device.
        </p>
      </Card>
      <ConfirmOverlay
        open={selected !== null} onClose={() => setSelected(null)} busy={busy}
        title="Remove this device?" confirmLabel="Remove device"
        message={`Remove access for ${selected?.device_name || "this browser session"}? It will need to sign in again when its current access expires. Your other devices and their saved data are unaffected.`}
        onConfirm={() => { if (selected) void revoke(selected.id); }}
      />
    </div>
  );
}
