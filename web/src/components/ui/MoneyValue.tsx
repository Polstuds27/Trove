/**
 * MoneyValue: the one way to render a monetary figure.
 *
 * Formatting is always `formatMoney` (sign, symbol, precision, compact), so
 * MoneyValue can never show a number the rest of the app would not. Optional
 * `animate` rolls the digits into place. The rolling-digit columns are adapted
 * from EasyUI's `AnimatedNumber` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Framer Motion springs are replaced with a CSS
 * transform transition, and the roll runs only when the value changes or on
 * first mount, never during list scrolling. Screen readers get the plain
 * formatted string; the animated glyphs are aria-hidden.
 *
 * Use `animate` for hero totals only, not for rows in lists.
 */
import { memo, useEffect, useState } from "react";
import { formatMoney } from "../../design/format";
import { useReducedMotion } from "../../lib/motion";

export type MoneyTone = "inherit" | "auto" | "income" | "expense" | "transfer" | "muted";

const TONES: Record<Exclude<MoneyTone, "auto">, string> = {
  inherit: "",
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
  muted: "text-muted",
};

export interface MoneyValueProps {
  amount: number | string | null | undefined;
  currency?: string;
  signed?: boolean;
  compact?: boolean;
  decimals?: number;
  showSymbol?: boolean;
  /** `auto` colours positive amounts as income and negative as expense. */
  tone?: MoneyTone;
  /** Roll the digits on mount / change. Reserve for one or two hero figures. */
  animate?: boolean;
  className?: string;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const DigitColumn = memo(function DigitColumn({ digit, settled }: { digit: number; settled: boolean }) {
  return (
    <span className="relative inline-block h-[1.1em] w-[0.62em] overflow-hidden text-center align-[-0.12em] leading-[1.1em]">
      <span
        className="flex flex-col transition-transform duration-[650ms] ease-out-soft will-change-transform"
        style={{ transform: `translateY(-${(settled ? digit : 0) * 10}%)` }}
      >
        {DIGITS.map((n) => (
          <span key={n} className="block h-[1.1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
});

export function MoneyValue({
  amount,
  currency = "USD",
  signed,
  compact,
  decimals,
  showSymbol,
  tone = "inherit",
  animate = false,
  className = "",
}: MoneyValueProps) {
  const reduced = useReducedMotion();
  const text = formatMoney(amount, currency, { signed, compact, decimals, showSymbol });
  const numeric = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  const resolvedTone =
    tone === "auto" ? (numeric > 0 ? TONES.income : numeric < 0 ? TONES.expense : "") : TONES[tone];

  const rolling = animate && !reduced;
  // First paint shows zeros; the next frame rolls them to the real digits.
  const [settled, setSettled] = useState(!rolling);
  useEffect(() => {
    if (!rolling) return;
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, [rolling]);

  if (!rolling) {
    return <span className={`tabular ${resolvedTone} ${className}`}>{text}</span>;
  }

  const chars = text.split("");
  // Key digits from the right so a value growing a digit keeps its columns.
  return (
    <span className={`tabular inline-flex items-baseline whitespace-nowrap ${resolvedTone} ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {chars.map((char, index) => {
          const fromRight = chars.length - index;
          return /\d/.test(char) ? (
            <DigitColumn key={`d${fromRight}`} digit={Number(char)} settled={settled} />
          ) : (
            <span key={`c${fromRight}-${char}`}>{char}</span>
          );
        })}
      </span>
    </span>
  );
}
