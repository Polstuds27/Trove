/**
 * `/settings/profile` — name, email, preferred currency.
 *
 * Written straight to `PATCH /auth/profile/`; the local copy in AuthContext is
 * refreshed from the response so the header picks the new name up immediately.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Trash2 } from "lucide-react";
import { ApiError, apiFetch } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useSync } from "../../sync/SyncContext";
import { Button, ConfirmOverlay, Input, Select, useToast } from "../../components/ui";
import { CURRENCIES } from "../../design/format";
import { readProfileCache } from "../../db/profile";
import { usePreferences } from "./preferences";
import { Panel } from "./Panel";

export function ProfileSection() {
  const { profile, updateProfile, logout } = useAuth();
  const { pendingCount } = useSync();
  const { preferences } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currency, setCurrency] = useState(preferences.baseCurrency);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const profileFirstName = profile?.first_name;
  const profileLastName = profile?.last_name;
  const profileCurrency = profile?.preferred_currency;

  useEffect(() => {
    if (profileCurrency === undefined) return;
    setFirstName(profileFirstName ?? "");
    setLastName(profileLastName ?? "");
    setCurrency(profileCurrency);
    setLoaded(true);
  }, [profileFirstName, profileLastName, profileCurrency]);

  // Offline the live profile never arrives: initialise the form from the
  // last-known cached identity so the screen still shows who is signed in.
  useEffect(() => {
    if (profile) return;
    let cancelled = false;
    void readProfileCache().then((cached) => {
      if (cancelled || !cached) return;
      setFirstName((current) => current || cached.first_name);
      setLastName((current) => current || cached.last_name);
      setCurrency(cached.preferred_currency);
      setLoaded(true);
    }).catch(() => setError("Couldn't load your saved profile. Reconnect and try again."));
    return () => {
      cancelled = true;
    };
  }, [profile]);

  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (!loaded || busy) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          preferred_currency: currency,
      });
      toast.push({
        tone: "success",
        title: "Profile updated",
        description: updated.email,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save your profile right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setConfirmLogout(false);
    setBusy(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setBusy(false);
    }
  }
  async function deleteAccount() {
    setBusy(true);
    try {
      await apiFetch("/auth/profile/", { method: "DELETE" });
      await logout();
      navigate("/login", { replace: true });
      toast.push({ tone: "success", title: "Account deleted" });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Couldn't delete account",
        description: err instanceof ApiError ? err.message : undefined,
      });
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Your details"
        description="Shown on this device and on every device you sign in from."
        footer={
          <Button variant="primary" size="sm" icon={<Save className="h-4 w-4" />} disabled={!loaded} loading={busy} onClick={() => void save()}>
            Save
          </Button>
        }
      >
        <form onSubmit={save} className="space-y-3" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              maxLength={60}
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              maxLength={60}
            />
          </div>
          <Input
            label="Email"
            value={profile?.email ?? ""}
            readOnly
            hint="Email changes go through verification — contact support to change it."
          />
          <Select
            label="Preferred currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            disabled={!loaded || busy}
            hint="Used for reports and totals on every device. Reconnect to save changes."
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
          <button type="submit" className="sr-only">
            Save profile
          </button>
        </form>
      </Panel>

      <Panel
        title="Sign out"
        description="Ends this session on this device and clears its local copy of your data. Anything already synced stays safe on the server."
      >
        <Button
          variant="danger"
          size="sm"
          icon={<LogOut className="h-4 w-4" />}
          loading={busy}
          onClick={() => (pendingCount > 0 ? setConfirmLogout(true) : void signOut())}
        >
          Sign out
        </Button>
      </Panel>

      <Panel
        title="Danger zone"
        description="Deleting your account removes every transaction, account and goal from the server."
      >
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => setConfirmDelete(true)}
        >
          Delete account
        </Button>
      </Panel>

      <ConfirmOverlay
        open={confirmLogout}
        busy={busy}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => void signOut()}
        title="Sign out with unsynced changes?"
        confirmLabel="Sign out anyway"
        message={`${pendingCount} change${pendingCount === 1 ? " is" : "s are"} still waiting to sync. Signing out clears this device's local copy, including anything the server hasn't acknowledged yet.`}
      />

      <ConfirmOverlay
        open={confirmDelete}
        busy={busy}
        tone="danger"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void deleteAccount()}
        title="Delete your Trove account?"
        confirmLabel="Delete everything"
        message="This erases all accounts, transactions, budgets and goals on the server. It cannot be undone."
      />
    </div>
  );
}
