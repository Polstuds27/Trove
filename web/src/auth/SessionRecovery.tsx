import { createContext, useCallback, useContext, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { Button, Input, Overlay, Select, useToast } from "../components/ui";
import { isRecoveryCode, normalizeRecoveryCode } from "../features/auth/recovery";
import { useSync } from "../sync/SyncContext";
import { useAuth } from "./AuthContext";

const RecoveryContext = createContext<(() => void) | null>(null);

/** Keep the app and its unfinished forms mounted throughout account recovery. */
export function SessionRecoveryProvider({ children }: { children: ReactNode }) {
  const { email, isAuthenticated } = useAuth();
  const { syncNow } = useSync();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const requestRecovery = useCallback(() => {
    if (!isAuthenticated || !email) {
      navigate("/login");
      return;
    }
    setOpen(true);
  }, [email, isAuthenticated, navigate]);
  const value = useMemo(() => requestRecovery, [requestRecovery]);

  return (
    <RecoveryContext.Provider value={value}>
      {children}
      <Overlay
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        title="Sign in to resume syncing"
        description="Your changes are saved on this device. Sign in to continue syncing without leaving this page."
        size="sm"
        busy={busy}
      >
        {open && email && (
          <RecoveryForm
            email={email}
            busy={busy}
            setBusy={setBusy}
            onCancel={() => setOpen(false)}
            onRecovered={() => {
              setOpen(false);
              toast.push({ tone: "success", title: "Signed in", description: "Sync is resuming. You can carry on where you left off." });
              void syncNow();
            }}
          />
        )}
      </Overlay>
    </RecoveryContext.Provider>
  );
}

export function useSessionRecovery(): () => void {
  const requestRecovery = useContext(RecoveryContext);
  if (!requestRecovery) throw new Error("useSessionRecovery requires SessionRecoveryProvider");
  return requestRecovery;
}

function RecoveryForm({ email, busy, setBusy, onCancel, onRecovered }: {
  email: string;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onCancel: () => void;
  onRecovered: () => void;
}) {
  const { reauthenticate } = useAuth();
  // Credentials stay in this mounted form only and disappear on dismissal.
  const [password, setPassword] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mode, setMode] = useState("totp");
  const [code, setCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validCode = mode === "recovery" ? isRecoveryCode(code) :
    mode === "email" ? emailSent && /^\d{8}$/.test(code) : /^\d{6}$/.test(code);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !password || (needsMfa && !validCode)) return;
    setBusy(true);
    setError(null);
    try {
      const result = await reauthenticate(password, needsMfa
        ? mode === "recovery" ? normalizeRecoveryCode(code) : code : undefined);
      if (result.mfaRequired) {
        setNeedsMfa(true);
        return;
      }
      onRecovered();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in. Your changes are still saved here; try again when connected.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/mfa/email/request/", { method: "POST", body: JSON.stringify({ email }) }, false);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send a code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-expense-soft p-3 text-sm text-expense">{error}</p>}
      <Input label="Account" type="email" autoComplete="username" value={email} readOnly hint="Sign in to the same account to resume its saved changes." />
      <Input
        label="Password" type="password" autoComplete="current-password" data-autofocus
        value={password} disabled={busy} required
        onChange={(event) => { setPassword(event.target.value); setNeedsMfa(false); setCode(""); }}
      />
      {needsMfa && (
        <>
          <Select label="Verify with" value={mode} disabled={busy} onChange={(event) => {
            setMode(event.target.value); setCode(""); setError(null);
          }}>
            <option value="totp">Authenticator app</option>
            <option value="recovery">Recovery code</option>
            <option value="email">Email code</option>
          </Select>
          {mode === "email" && (
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void sendEmailCode()}>
              {emailSent ? "Send another code" : "Email me a code"}
            </Button>
          )}
          <Input
            label={mode === "recovery" ? "Recovery code" : mode === "email" ? "Emailed code" : "Two-factor code"}
            value={code} disabled={busy} required inputMode={mode === "recovery" ? "text" : "numeric"}
            autoComplete={mode === "recovery" ? "off" : "one-time-code"}
            maxLength={mode === "recovery" ? 11 : mode === "email" ? 8 : 6}
            onChange={(event) => setCode(mode === "recovery" ? event.target.value : event.target.value.replace(/\D/g, ""))}
          />
        </>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Not now</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!password || (needsMfa && !validCode)}>
          {needsMfa ? "Verify and resume sync" : "Sign in and resume sync"}
        </Button>
      </div>
    </form>
  );
}
