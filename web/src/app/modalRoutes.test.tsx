import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { editorBackgroundPath, useModalBackground } from "./modalRoutes";

function ListPage() {
  const [draft, setDraft] = useState("");
  const location = useLocation();
  return <><p>Transactions page {location.search}</p><input aria-label="Page draft" value={draft} onChange={(event) => setDraft(event.target.value)} /><Link to="/transactions/new">Add transaction</Link></>;
}
function Harness() {
  const { backgroundLocation, editorOpen } = useModalBackground(true);
  return <>
    <Routes location={backgroundLocation}><Route path="/transactions" element={<ListPage />} /></Routes>
    {editorOpen && <Routes><Route path="/transactions/new" element={<p>Editor sheet</p>} /></Routes>}
  </>;
}
describe("modal routes", () => {
  it("keeps the original page, filters and state mounted under a routed editor", () => {
    render(<MemoryRouter initialEntries={["/transactions?account=bank"]}><Harness /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Page draft"), { target: { value: "Keep me" } });
    fireEvent.click(screen.getByRole("link", { name: "Add transaction" }));
    expect(screen.getByText("Editor sheet")).toBeTruthy();
    expect(screen.getByText("Transactions page ?account=bank")).toBeTruthy();
    expect(screen.getByLabelText("Page draft")).toHaveValue("Keep me");
  });
  it("renders a fallback background when an editor link opens directly", () => {
    render(<MemoryRouter initialEntries={["/transactions/new"]}><Harness /></MemoryRouter>);
    expect(screen.getByText("Transactions page")).toBeTruthy();
    expect(screen.getByText("Editor sheet")).toBeTruthy();
    expect(editorBackgroundPath("/accounts/123/edit")).toBe("/accounts/123");
    expect(editorBackgroundPath("/categories/123/edit")).toBe("/categories");
    expect(editorBackgroundPath("/settings/profile")).toBeNull();
  });
});
