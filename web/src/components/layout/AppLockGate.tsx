import { useState, type FormEvent, type ReactNode } from "react";
import { Lock, LogOut, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { Mascot } from "../ui/Mascot";
import { usePreferences } from "../../features/settings/preferences";
import { clearUnlocked, isUnlocked, markUnlocked, verifyPin } from "../../features/settings/appLock";

/**
 * Local app lock.
 *
 * When the device lock is on, the signed-in app is covered by a PIN screen for
 * the first render of each browser session. Nothing renders behind it, so a
 * shared phone never exposes a balance by accident.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { preferences, ready } = usePreferences();
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locked = preferences.appLock && Boolean(preferences.appLockPinHash) && !unlocked;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (await verifyPin(pin, preferences.appLockPinHash)) {
        markUnlocked();
        setPin("");
        setUnlocked(true);
      } else {
        setError("That PIN doesn't match. Try again.");
        setPin("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    clearUnlocked();
    await logout();
    navigate("/login", { replace: true });
  }

  // Wait for the stored preferences before deciding: rendering the app first
  // would flash a balance for a moment on a locked device.
  if (!ready) {
    return <div aria-busy="true" className="min-h-dvh bg-canvas" />;
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 py-8">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-raised text-primary shadow-sm"
        >
          <Sprout className="h-[19px] w-[19px]" />
        </span>
        <span className="text-[22px] font-semibold tracking-[-0.03em] text-primary">Trove</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <Mascot state="settingsSecurity" size={168} className="mx-auto" />
          <h1 className="mt-5 text-[28px] font-semibold leading-9 tracking-[-0.025em] text-primary">
            Trove is locked
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-muted">
            Enter your PIN to open {email ? `${email}'s ledger` : "your ledger"} on this device.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3 text-left">
            <label htmlFor="app-lock-pin" className="label">
              PIN
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                id="app-lock-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="input tabular pl-10 tracking-[0.35em]"
                aria-invalid={error ? true : undefined}
              />
            </div>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={pin.length < 4}>
              Unlock
            </Button>
          </form>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink"
          >
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
