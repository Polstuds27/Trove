import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueMutation } from "./outbox";
import { runSync } from "./syncEngine";

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  accounts: new Map<string, Row>(), outbox: new Map<string, Row>(),
  meta: new Map<string, Row>(), conflicts: new Map<string, Row>(), apiFetch: vi.fn(),
}));
vi.mock("../api/client", () => ({
  apiFetch: state.apiFetch, getAccessToken: () => "test-token", isOfflineError: () => false,
  ApiError: class extends Error { status = 0; },
}));
vi.mock("../auth/owner", () => ({ signedInOwner: () => "user@example.com" }));
vi.mock("../db/balances", () => ({ recalcBalances: async () => {} }));
vi.mock("../db", () => {
  function table(rows: Map<string, Row>) {
    function collection(predicate: (row: Row) => boolean) {
      const values = () => [...rows.values()].filter(predicate).map((row) => structuredClone(row));
      return {
        filter: (next: (row: Row) => boolean) => collection((row) => predicate(row) && next(row)),
        toArray: async () => values(), count: async () => values().length,
        first: async () => values()[0],
        sortBy: async (key: string) => values().sort((a, b) => String(a[key]).localeCompare(String(b[key]))),
      };
    }
    return {
      get: async (id: string) => rows.has(id) ? structuredClone(rows.get(id)) : undefined,
      put: async (row: Row) => rows.set(String(row.id ?? row.key), structuredClone(row)),
      add: async (row: Row) => rows.set(String(row.id ?? row.key), structuredClone(row)),
      delete: async (id: string) => rows.delete(id),
      update: async (id: string, patch: Row) => { const row = rows.get(id); if (row) rows.set(id, { ...row, ...patch }); },
      where: (key: string) => ({ equals: (value: unknown) => collection((row) => row[key] === value) }),
      filter: (predicate: (row: Row) => boolean) => collection(predicate),
    };
  }
  const accounts = table(state.accounts);
  return { tableFor: () => accounts, db: {
    accounts, outbox: table(state.outbox), meta: table(state.meta), conflicts: table(state.conflicts),
    transaction: async (...args: unknown[]) => (args.at(-1) as () => Promise<unknown>)(),
  } };
});

function account(bank: string | null): Row {
  return { id: "a", name: "My account", type: "bank", currency: "PHP", bank_name: bank,
    opening_balance: 85.3, current_balance: 75.2, version: 1, deleted_at: null,
    sync_status: "pending", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" };
}
function queued(status = "pending"): Row {
  return { id: "old-request", entity: "accounts", entity_id: "a", op: "update", base_version: 1,
    payload: { name: "My account", bank_name: null }, status, attempts: status === "failed" ? 5 : 0,
    last_error: null, server_version: null, owner: "user@example.com", created_at: "2026-10-01T00:00:00Z" };
}
beforeEach(() => {
  state.accounts.clear(); state.outbox.clear(); state.meta.clear(); state.conflicts.clear();
  state.apiFetch.mockReset();
  state.meta.set("client_id", { key: "client_id", value: "test-client" });
  state.accounts.set("a", account(null));
});

describe("saving a bank selection", () => {
  it("gives a corrected rejected edit a fresh id instead of replaying the old rejection", async () => {
    state.outbox.set("old-request", queued("failed"));
    await enqueueMutation("accounts", "a", "update", { bank_name: "BDO Unibank" }, 1);
    const entries = [...state.outbox.values()];
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ status: "pending", attempts: 0, payload: { bank_name: "BDO Unibank" } });
    expect(entries[0].id).not.toBe("old-request");
  });

  it("does not replace an unsynced bank with null from historical server data", async () => {
    state.accounts.set("a", account("BDO Unibank"));
    state.outbox.set("old-request", queued("failed"));
    state.apiFetch.mockResolvedValue({ server_seq: 1, has_more: false, changes: [
      { entity: "account", entity_id: "a", op: "update", version: 1, payload: account(null) },
    ] });
    expect(await runSync("user@example.com")).toBe("idle");
    expect(state.accounts.get("a")?.bank_name).toBe("BDO Unibank");
  });

  it("uploads an edit made while the previous save is still uploading", async () => {
    state.outbox.set("old-request", queued());
    let pushes = 0;
    state.apiFetch.mockImplementation(async (path: string, init: RequestInit) => {
      if (path === "/sync/pull/") return { server_seq: 1, has_more: false, changes: [
        { entity: "account", entity_id: "a", op: "update", version: 1, payload: account(null) },
      ] };
      const mutation = JSON.parse(String(init.body)).mutations[0];
      pushes += 1;
      if (pushes === 1) {
        state.accounts.set("a", account("BDO Unibank"));
        await enqueueMutation("accounts", "a", "update", { bank_name: "BDO Unibank" }, 1);
      } else {
        expect(mutation.base_version).toBe(2);
        expect(mutation.payload.bank_name).toBe("BDO Unibank");
        expect(mutation.client_mutation_id).not.toBe("old-request");
      }
      return { results: [{ client_mutation_id: mutation.client_mutation_id, status: "accepted", server_version: pushes + 1 }] };
    });
    expect(await runSync("user@example.com")).toBe("idle");
    expect(pushes).toBe(2);
    expect(state.outbox.size).toBe(0);
    expect(state.accounts.get("a")).toMatchObject({ bank_name: "BDO Unibank", version: 3 });
  });
});
