import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider, usePreferences } from "./preferences";

const mocks = vi.hoisted(() => ({
  profile: null as { preferred_currency: string } | null,
  cached: null as { email: string; preferred_currency: string } | null,
  getMeta: vi.fn(),
  setMeta: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ profile: mocks.profile, email: "user@example.com", updateProfile: mocks.updateProfile }),
}));
vi.mock("dexie-react-hooks", () => ({ useLiveQuery: () => mocks.cached }));
vi.mock("../../db", () => ({ db: {} }));
vi.mock("../../db/profile", () => ({ PROFILE_KEY: "me" }));
vi.mock("../../sync/outbox", () => ({ getMeta: mocks.getMeta, setMeta: mocks.setMeta }));

let settings: ReturnType<typeof usePreferences>;
function Probe() {
  settings = usePreferences();
  return <span>{settings.preferences.baseCurrency}</span>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  mocks.profile = null;
  mocks.cached = null;
  mocks.getMeta.mockResolvedValue(JSON.stringify({ baseCurrency: "USD", theme: "light" }));
  mocks.setMeta.mockResolvedValue(undefined);
  mocks.updateProfile.mockResolvedValue({ preferred_currency: "PHP" });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("account currency", () => {
  it("uses PHP from the profile without visiting profile settings, even after hydration", async () => {
    mocks.profile = { preferred_currency: "PHP" };
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    await waitFor(() => expect(settings.ready).toBe(true));
    expect(screen.getByText("PHP")).toBeTruthy();
    await act(() => settings.update({ showCents: false }));
    expect(settings.preferences.baseCurrency).toBe("PHP");
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("restores cached PHP offline instead of the legacy USD preference", async () => {
    mocks.cached = { email: "user@example.com", preferred_currency: "PHP" };
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    await waitFor(() => expect(settings.ready).toBe(true));
    expect(settings.preferences.baseCurrency).toBe("PHP");
  });

  it("saves report currency through the profile API", async () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    await act(() => settings.update({ baseCurrency: "PHP" }));
    expect(mocks.updateProfile).toHaveBeenCalledWith({ preferred_currency: "PHP" });
    expect(settings.preferences.baseCurrency).toBe("PHP");
  });

  it("does not change the device currency when the server rejects a save", async () => {
    mocks.updateProfile.mockRejectedValueOnce(new Error("Offline"));
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    await waitFor(() => expect(settings.ready).toBe(true));
    await act(async () => {
      await expect(settings.update({ baseCurrency: "PHP" })).rejects.toThrow("Offline");
    });
    expect(settings.preferences.baseCurrency).toBe("USD");
    expect(mocks.setMeta).not.toHaveBeenCalled();
  });
});
