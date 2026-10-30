import { describe, expect, it } from "vitest";
import { calculateExpression } from "./calculator";

describe("transaction calculator", () => {
  it("supports precedence, parentheses, decimals and percentages", () => {
    expect(calculateExpression("120 + 30 × 2")).toBe(180);
    expect(calculateExpression("(120 + 30) ÷ 2")).toBe(75);
    expect(calculateExpression("150 × (1 + 12%)")).toBe(168);
    expect(calculateExpression("0.1 + 0.2")).toBe(0.3);
  });
  it("rejects division by zero and incomplete expressions", () => {
    expect(() => calculateExpression("15 ÷ 0")).toThrow("divide by zero");
    expect(() => calculateExpression("15 +")).toThrow();
    expect(() => calculateExpression("(15 + 2")).toThrow();
  });
  it("rejects arbitrary code and unsafe amounts", () => {
    expect(() => calculateExpression("alert(1)")).toThrow();
    expect(() => calculateExpression("99999999999999999999 × 8")).toThrow();
  });
});
