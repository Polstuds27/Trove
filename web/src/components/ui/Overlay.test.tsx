import { describe, expect, it } from "vitest";
import { StrictMode, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Overlay } from "./Overlay";

/** Mirrors the real call sites: a fresh inline `onClose` every render. */
function Harness() {
  const [text, setText] = useState("");
  return (
    <Overlay open onClose={() => {}} title="Test" variant="sheet">
      <input aria-label="Name" value={text} onChange={(event) => setText(event.target.value)} />
    </Overlay>
  );
}

describe("Overlay focus", () => {
  it("keeps its scroll lock and Escape handler in StrictMode", () => {
    let closed = 0;
    render(<StrictMode><Overlay open onClose={() => { closed += 1; }} title="Strict dialog">Content</Overlay></StrictMode>);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(1);
  });

  it("closes only the top dialog and keeps the page locked beneath it", () => {
    function Stacked() {
      const [confirm, setConfirm] = useState(true);
      return <><Overlay open onClose={() => { throw new Error("Parent should stay open"); }} title="Parent sheet">Parent content</Overlay>
        <Overlay open={confirm} onClose={() => setConfirm(false)} title="Confirmation">Confirm content</Overlay></>;
    }
    render(<Stacked />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Parent sheet" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
  });
  it("keeps typing focus across parent re-renders with an unstable onClose", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Name" });
    input.focus();
    // Before the fix, each keystroke tore the lifecycle effect down (new
    // onClose identity) and the teardown re-focused the opener — dismissing
    // the mobile keyboard mid-word.
    fireEvent.change(input, { target: { value: "Allow" } });
    fireEvent.change(input, { target: { value: "Allowa" } });
    fireEvent.change(input, { target: { value: "Allowance" } });
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue("Allowance");
  });

  it("still closes on Escape", () => {
    let closed = 0;
    render(
      <Overlay open onClose={() => { closed += 1; }} title="Test" variant="sheet">
        <input aria-label="Name" />
      </Overlay>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(1);
  });
});
