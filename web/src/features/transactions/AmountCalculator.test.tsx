import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AmountCalculator } from "./AmountCalculator";

it("applies a keypad calculation without submitting the transaction form", () => {
  const onUse = vi.fn();
  const onSubmit = vi.fn((event) => event.preventDefault());
  render(<form onSubmit={onSubmit}><AmountCalculator id="calculator" amount={0} currency="PHP" onUse={onUse} onClose={() => {}} /></form>);
  for (const key of ["1", "2", "+", "3"]) fireEvent.click(screen.getByRole("button", { name: key }));
  fireEvent.click(screen.getByRole("button", { name: "Use amount" }));
  expect(onUse).toHaveBeenCalledWith(15);
  expect(onSubmit).not.toHaveBeenCalled();
});
