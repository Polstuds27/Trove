import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncProvider, useSync } from "./SyncContext";
import type { SyncState } from "./syncEngine";

const mocks = vi.hoisted(() => ({
  runSync: vi.fn(),
  outboxCount: vi.fn(),
  refreshProfile: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}));
vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, email: "user@example.com", refreshProfile: mocks.refreshProfile }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => mocks.queryClient }));
vi.mock("./syncEngine", () => ({ runSync: mocks.runSync }));
vi.mock("../db", () => ({ db: { conflicts: { toArray: async () => [] } } }));
vi.mock("./outbox", () => ({
  outboxCount: mocks.outboxCount,
  getMeta: async () => null,
  setMeta: async () => {},
  releaseWronglyParked: async () => 0,
}));

let sync: ReturnType<typeof useSync>;
function Probe() { sync = useSync(); return null; }

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.runSync.mockResolvedValue("idle");
  mocks.outboxCount.mockResolvedValue(0);
  mocks.refreshProfile.mockResolvedValue(null);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("automatic sync recovery", () => {
  it("runs again when reconnect arrives during an older failing cycle", async () => {
    let finish!: (state: SyncState) => void;
    mocks.runSync.mockReturnValueOnce(new Promise<SyncState>((resolve) => { finish = resolve; }));
    await act(async () => { render(<SyncProvider><Probe /></SyncProvider>); });
    expect(mocks.runSync).toHaveBeenCalledTimes(1);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      finish("api-unavailable");
    });
    expect(mocks.runSync).toHaveBeenCalledTimes(2);
    expect(sync.status).toBe("idle");
  });

  it("continues polling after a local metadata read fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.outboxCount.mockRejectedValueOnce(new Error("Temporary storage failure"));
    await act(async () => { render(<SyncProvider><Probe /></SyncProvider>); });
    expect(sync.status).toBe("error");
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocks.runSync).toHaveBeenCalledTimes(2);
    expect(sync.status).toBe("idle");
  });

  it("resumes on app focus and keeps one retry timer after grouped wake events", async () => {
    await act(async () => { render(<SyncProvider><Probe /></SyncProvider>); });
    const before = mocks.runSync.mock.calls.length;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
      window.dispatchEvent(new Event("online"));
    });
    expect(mocks.runSync.mock.calls.length).toBeGreaterThan(before);
    expect(vi.getTimerCount()).toBe(1);
    const afterWake = mocks.runSync.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocks.runSync).toHaveBeenCalledTimes(afterWake + 1);
  });
});
