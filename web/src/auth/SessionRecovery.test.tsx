import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionRecoveryProvider, useSessionRecovery } from "./SessionRecovery";

const mocks = vi.hoisted(() => ({ reauthenticate: vi.fn(), syncNow: vi.fn(), push: vi.fn() }));
vi.mock("./AuthContext", () => ({ useAuth: () => ({
  email: "user@example.com", isAuthenticated: true, reauthenticate: mocks.reauthenticate,
}) }));
vi.mock("../sync/SyncContext", () => ({ useSync: () => ({ syncNow: mocks.syncNow }) }));
vi.mock("../components/ui", async () => ({
  ...await vi.importActual("../components/ui"), useToast: () => ({ push: mocks.push }),
}));

function Page() {
  const recover = useSessionRecovery();
  const location = useLocation();
  const [draft, setDraft] = useState("Unfinished transaction");
  return <>
    <p>{location.pathname + location.search}</p>
    <input aria-label="Draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
    <button onClick={recover}>Resume sync</button>
  </>;
}
function setup() {
  render(<MemoryRouter initialEntries={["/transactions?account=bank"]}>
    <SessionRecoveryProvider><Page /></SessionRecoveryProvider>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Resume sync" }));
  fireEvent.change(screen.getByLabelText(/Password/), { target: { value: "password" } });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.reauthenticate.mockResolvedValue({ mfaRequired: false });
  mocks.syncNow.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("session recovery", () => {
  it("restores sync without navigating or discarding the current draft", async () => {
    setup();
    expect(screen.getByLabelText("Account")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Sign in and resume sync" }));
    await waitFor(() => expect(mocks.syncNow).toHaveBeenCalledOnce());
    expect(screen.getByText("/transactions?account=bank")).toBeTruthy();
    expect(screen.getByLabelText("Draft")).toHaveValue("Unfinished transaction");
  });

  it("completes the MFA challenge before starting sync", async () => {
    mocks.reauthenticate.mockResolvedValueOnce({ mfaRequired: true });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Sign in and resume sync" }));
    const code = await screen.findByLabelText(/Two-factor code/);
    expect(mocks.syncNow).not.toHaveBeenCalled();
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and resume sync" }));
    await waitFor(() => expect(mocks.syncNow).toHaveBeenCalledOnce());
    expect(mocks.reauthenticate).toHaveBeenLastCalledWith("password", "123456");
  });

  it("keeps the page available and clears password on dismissal after a failed attempt", async () => {
    mocks.reauthenticate.mockRejectedValueOnce(new Error("Offline"));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Sign in and resume sync" }));
    await screen.findByRole("alert");
    expect(mocks.syncNow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    fireEvent.click(screen.getByRole("button", { name: "Resume sync" }));
    expect(screen.getByLabelText(/Password/)).toHaveValue("");
    expect(screen.getByLabelText("Draft")).toHaveValue("Unfinished transaction");
  });
});
