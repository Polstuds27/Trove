import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, refreshAccessToken, storeTokens } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch transport failures", () => {
  it("normalises a dropped connection to ApiError(0) — unconfirmed, never rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const failure = await apiFetch("/sync/push/", { method: "POST", body: "{}" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).status).toBe(0);
  });

  it("surfaces server rejections with their HTTP status intact", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { amount: ["Nope."] })));
    const failure = await apiFetch("/sync/push/", { method: "POST", body: "{}" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).status).toBe(400);
    expect((failure as ApiError).message).toBe("Nope.");
  });

  it("retries once after a successful rotation, then stops", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { access: "new-access", refresh: "new-refresh" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("fintrack_access", "old-access");
    localStorage.setItem("fintrack_refresh", "old-refresh");

    const body = await apiFetch<{ ok: boolean }>("/sync/pull/", { method: "POST", body: "{}" });
    expect(body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("fintrack_access")).toBe("new-access");
    expect(localStorage.getItem("fintrack_refresh")).toBe("new-refresh");
  });

  it("does not retry when rotation itself fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "blacklisted" }));
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("fintrack_access", "old-access");
    localStorage.setItem("fintrack_refresh", "old-refresh");

    const failure = await apiFetch("/sync/pull/", { method: "POST", body: "{}" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps credentials and retries later if connectivity drops during refresh", async () => {
    storeTokens("expired-access", "valid-refresh");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
      .mockRejectedValueOnce(new TypeError("Network dropped"))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { access: "renewed", refresh: "rotated" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiFetch("/sync/pull/")).rejects.toMatchObject({ status: 0 });
    expect(localStorage.getItem("fintrack_refresh")).toBe("valid-refresh");
    await expect(apiFetch("/sync/pull/")).resolves.toEqual({ ok: true });
  });

  it("reports refresh server outages as retryable instead of expired credentials", async () => {
    storeTokens("expired-access", "valid-refresh");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(503, {})));
    await expect(apiFetch("/sync/pull/")).rejects.toMatchObject({ status: 503 });
    expect(localStorage.getItem("fintrack_refresh")).toBe("valid-refresh");
  });

  it("reuses a token another tab rotated while waiting for the refresh lock", async () => {
    storeTokens("old-access", "old-refresh");
    const fetchMock = vi.fn();
    const request = vi.fn(async (_name: string, rotate: () => Promise<boolean>) => {
      storeTokens("other-tab-access", "other-tab-refresh");
      return rotate();
    });
    vi.stubGlobal("navigator", { locks: { request } });
    vi.stubGlobal("fetch", fetchMock);
    await expect(refreshAccessToken()).resolves.toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not rotate again for a delayed 401 sent with the old access token", async () => {
    storeTokens("old-access", "old-refresh");
    let release!: (response: Response) => void;
    const delayed = new Promise<Response>((resolve) => { release = resolve; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(delayed)
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { access: "new-access", refresh: "new-refresh" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const first = apiFetch("/first/");
    await apiFetch("/second/");
    release(jsonResponse(401, {}));
    await expect(first).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh/"))).toHaveLength(1);
  });
});
