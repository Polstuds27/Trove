/**
 * `/settings` — profile and preferences.
 *
 * The page people actually land on: who is signed in, how the ledger is
 * formatted, which alerts show up, how sync is doing, and the device lock.
 * Everything that needs a longer form lives one tap away on its own section.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  CloudSync,
  Database,
  Info,
  LogOut,
  KeyRound,
  Lock,
  RotateCw,
  Smartphone,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  GlassPanel,
  Mascot,
  Overlay,
  PageHeader,
  SurfaceCard,
  Toggle,
} from "../../components/ui";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { PROFILE_KEY } from "../../db/profile";
import { useAuth } from "../../auth/AuthContext";
import { useSync } from "../../sync/SyncContext";
import { usePreferences } from "./preferences";
import { hashPin, isValidPin, markUnlocked, verifyPin } from "./appLock";

const THEME_LABEL = { light: "Light", dark: "Dark", system: "System" } as const;

const SYNC_COPY: Record<string, { label: string; tone: "income" | "neutral" | "warning" | "expense" }> = {
  idle: { label: "Up to date", tone: "income" },
  syncing: { label: "Syncing…", tone: "neutral" },
  offline: { label: "Offline", tone: "warning" },
  "api-unavailable": { label: "Server unavailable", tone: "warning" },
  "signed-out": { label: "Signed out", tone: "neutral" },
  error: { label: "Sync error", tone: "expense" },
};

export function OverviewSection() {
  const { profile, email, isAuthenticated, logout } = useAuth();
  const { preferences, update } = usePreferences();
  const { status, pendingCount, conflicts, lastSyncedAt } = useSync();
  const navigate = useNavigate();
  const cached = useLiveQuery(() => db.profile.get(PROFILE_KEY), []);

  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const liveName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
  const cachedName = cached ? `${cached.first_name} ${cached.last_name}`.trim() : "";
  const displayName = liveName || cachedName || email || "You";
  const displayEmail = profile?.email ?? cached?.email ?? email;
  const initialsName = displayName;

  const lockOn = preferences.appLock && Boolean(preferences.appLockPinHash);

  async function enableLock(event?: FormEvent) {
    event?.preventDefault();
    setPinError(null);
    if (!isValidPin(pin)) {
      setPinError("Choose a 4–6 digit PIN.");
      return;
    }
    if (pin !== confirmPin) {
      setPinError("Those PINs don't match.");
      return;
    }
    setBusy(true);
    try {
      const pinHash = await hashPin(pin);
      await update({ appLock: true, appLockPinHash: pinHash });
      markUnlocked();
      setEnableOpen(false);
      setPin("");
      setConfirmPin("");
    } catch {
      setPinError("Couldn't save the PIN on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function disableLock(event?: FormEvent) {
    event?.preventDefault();
    setPinError(null);
    setBusy(true);
    try {
      if (await verifyPin(currentPin, preferences.appLockPinHash)) {
        await update({ appLock: false, appLockPinHash: null });
        setDisableOpen(false);
        setCurrentPin("");
      } else {
        setPinError("That PIN doesn't match.");
      }
    } finally {
      setBusy(false);
    }
  }

  function toggleLock(next: boolean) {
    setPinError(null);
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    if (next) setEnableOpen(true);
    else setDisableOpen(true);
  }

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader title="Settings" subtitle="Profile and preferences" />

      <div className="grid gap-[17px] lg:grid-cols-2 lg:items-start">
        {/* ---------------------------------------------------------- left */}
        <div className="space-y-[17px]">
          <SurfaceCard className="overflow-hidden">
            <div className="flex flex-col items-center px-6 py-7 text-center">
              <Avatar
                name={initialsName}
                size={72}
                className="bg-sage text-primary shadow-card dark:bg-cream dark:text-primary-contrast"
              />
              <h2 className="mt-3 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-ink">
                {displayName}
              </h2>
              <p className="mt-0.5 max-w-full truncate text-[13px] text-muted">
                {isAuthenticated ? (displayEmail ?? "Signed in") : "Not signed in"}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge tone={profile?.is_verified ? "income" : "neutral"}>
                  {profile?.is_verified ? "Email verified" : "Unverified email"}
                </Badge>
                <Badge tone={profile?.mfa_enabled ? "income" : "neutral"}>
                  {profile?.mfa_enabled ? "2FA on" : "2FA off"}
                </Badge>
              </div>
              <Link
                to="/settings/profile"
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
              >
                Edit profile <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <SectionHead title="Preferences" summary="This device" />
            <div className="px-3 py-1.5 sm:px-4">
              <PreferenceRow label="Currency" value={preferences.baseCurrency} to="/settings/currency" />
              <PreferenceRow
                label="Appearance"
                value={THEME_LABEL[preferences.theme] ?? "System"}
                to="/settings/appearance"
              />
              <PreferenceRow
                label="Week starts on"
                value={preferences.weekStartsOn === 0 ? "Sunday" : "Monday"}
                to="/settings/financial"
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <SectionHead title="All settings" summary={<Link to="/settings" className="text-[12px] font-semibold text-primary hover:underline">Open</Link>} />
            <ul className="grid gap-x-6 px-3 py-1.5 sm:px-4 md:grid-cols-3">
              <ShortcutRow to="/settings/data" icon={<Database className="h-4 w-4" />} label="Data & storage" />
              <ShortcutRow to="/settings/devices" icon={<Smartphone className="h-4 w-4" />} label="Devices" />
              <ShortcutRow to="/settings/about" icon={<Info className="h-4 w-4" />} label="About Trove" />
            </ul>
            <div className="border-t border-line/70 px-3 py-2 sm:px-4">
              <Button variant="danger" size="sm" icon={<LogOut className="h-3.5 w-3.5" />} onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          </SurfaceCard>
        </div>

        {/* --------------------------------------------------------- right */}
        <div className="space-y-[17px]">
          <SurfaceCard className="overflow-hidden">
            <SectionHead
              title="Notifications"
              summary={
                <Link to="/settings/notifications" className="text-[12px] font-semibold text-primary hover:underline">
                  Manage
                </Link>
              }
            />
            <div className="divide-y divide-line/70 px-5 sm:px-6">
              <ToggleSetting
                id="settings-bill-reminders"
                icon={<Bell className="h-4 w-4" />}
                label="Bill reminders"
                description="Recurring bills and debts when they come due."
                checked={preferences.notifyDebts}
                onChange={(next) => void update({ notifyDebts: next })}
              />
              <ToggleSetting
                id="settings-budget-alerts"
                icon={<Bell className="h-4 w-4" />}
                label="Budget alerts"
                description="When a category nears or passes its limit."
                checked={preferences.notifyBudgets}
                onChange={(next) => void update({ notifyBudgets: next })}
              />
              <ToggleSetting
                id="settings-goal-nudges"
                icon={<Bell className="h-4 w-4" />}
                label="Goal nudges"
                description="When a savings goal drifts off its target date."
                checked={preferences.notifyGoals}
                onChange={(next) => void update({ notifyGoals: next })}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <SectionHead
              title="Sync"
              summary={
                <Link to="/settings/sync" className="text-[12px] font-semibold text-primary hover:underline">
                  Settings
                </Link>
              }
            />
            <dl className="px-5 py-1.5 sm:px-6">
              <div className="flex items-center justify-between gap-4 border-b border-line/70 py-3 last:border-b-0">
                <dt className="flex items-center gap-2 text-[13px] text-muted">
                  <CloudSync className="h-4 w-4" aria-hidden="true" />
                  Status
                </dt>
                <dd>
                  <Badge tone={SYNC_COPY[status]?.tone ?? "neutral"}>
                    {SYNC_COPY[status]?.label ?? status}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line/70 py-3 last:border-b-0">
                <dt className="flex items-center gap-2 text-[13px] text-muted">
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Offline changes
                </dt>
                <dd className="tabular text-[13px] font-semibold text-ink">
                  {pendingCount === 0 ? "None waiting" : `${pendingCount} waiting`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[13px] text-muted">Last synced</dt>
                <dd className="text-[13px] font-semibold text-ink">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not yet"}
                </dd>
              </div>
            </dl>
            {conflicts.length > 0 && (
              <div className="border-t border-line/70 px-5 py-3 sm:px-6">
                <Link
                  to="/sync/conflicts"
                  className="flex items-center justify-between gap-2 text-[12.5px] font-semibold text-warning hover:underline"
                >
                  {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"} need a decision
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </SurfaceCard>

          <GlassPanel className="relative overflow-hidden px-5 py-5 sm:px-6">
            <div className="relative z-10 max-w-[68%]">
              <h2 className="text-[16px] font-semibold leading-6 text-ink">Security</h2>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">App lock</p>
                  <p className="mt-0.5 text-[12px] leading-[18px] text-muted">
                    {lockOn
                      ? "A PIN is required when Trove opens on this device."
                      : "Ask for a device PIN when Trove opens."}
                  </p>
                </div>
                <Toggle
                  checked={lockOn}
                  onChange={toggleLock}
                  label="App lock"
                  id="settings-app-lock"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<KeyRound className="h-3.5 w-3.5" />}
                  onClick={() => navigate("/settings/security")}
                >
                  Change password
                </Button>
                <Link
                  to="/settings/security"
                  className="text-[12px] font-semibold text-primary hover:underline"
                >
                  Two-factor
                </Link>
              </div>
            </div>
            <Mascot
              state="settingsSecurity"
              size={140}
              className="pointer-events-none absolute -bottom-2 -right-1 sm:right-2"
            />
          </GlassPanel>
        </div>
      </div>

      <Overlay
        open={enableOpen}
        onClose={() => setEnableOpen(false)}
        title="Set an app lock PIN"
        description="Ask for this PIN the next time Trove opens on this device."
        size="sm"
        busy={busy}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnableOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} onClick={() => void enableLock()}>
              Turn on app lock
            </Button>
          </>
        }
      >
        <form onSubmit={enableLock} className="space-y-3">
          <div>
            <label htmlFor="app-lock-new" className="label">
              New PIN
            </label>
            <input
              id="app-lock-new"
              data-autofocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              placeholder="4–6 digits"
              className="input tabular mt-1.5 tracking-[0.3em]"
            />
          </div>
          <div>
            <label htmlFor="app-lock-confirm" className="label">
              Confirm PIN
            </label>
            <input
              id="app-lock-confirm"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))}
              placeholder="Repeat the PIN"
              className="input tabular mt-1.5 tracking-[0.3em]"
            />
          </div>
          {pinError && (
            <p role="alert" className="field-error">
              {pinError}
            </p>
          )}
          <p className="flex items-start gap-1.5 text-[11.5px] leading-4 text-muted">
            <Lock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            The PIN is stored as a hash on this device only. Forgetting it means signing out and
            back in.
          </p>
        </form>
      </Overlay>

      <Overlay
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Turn off app lock"
        description="Confirm your PIN to remove the lock from this device."
        size="sm"
        busy={busy}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisableOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void disableLock()}>
              Turn off app lock
            </Button>
          </>
        }
      >
        <form onSubmit={disableLock} className="space-y-3">
          <div>
            <label htmlFor="app-lock-current" className="label">
              Current PIN
            </label>
            <input
              id="app-lock-current"
              data-autofocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="input tabular mt-1.5 tracking-[0.3em]"
            />
          </div>
          {pinError && (
            <p role="alert" className="field-error">
              {pinError}
            </p>
          )}
        </form>
      </Overlay>
    </div>
  );
}

function SectionHead({ title, summary }: { title: string; summary?: ReactNode }) {
  return (
    <header className="flex items-baseline justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
      <h2 className="text-[16px] font-semibold leading-6 text-ink">{title}</h2>
      {summary && <span className="text-[12px] text-muted">{summary}</span>}
    </header>
  );
}

function PreferenceRow({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-[12px] border-b border-line/70 px-1 py-3 last:border-b-0"
    >
      <span className="text-[13px] text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-[13px] font-semibold text-ink">{value}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ShortcutRow({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-[12px] border-b border-line/70 px-1 py-3 last:border-b-0 text-[14px] font-medium text-ink hover:text-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-surface-sunken text-primary">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-4 w-4 text-faint" />
      </Link>
    </li>
  );
}

function ToggleSetting({
  id,
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="flex min-w-0 gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface-sunken text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-5 text-ink">{label}</p>
          <p className="mt-0.5 text-[12px] leading-[18px] text-muted">{description}</p>
        </div>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
