import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Delete } from "lucide-react";
import { Button } from "../../components/ui";
import { formatMoney } from "../../design/format";
import { calculateExpression } from "./calculator";

const KEYS = ["C", "(", ")", "⌫", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "%", "+"];

export function AmountCalculator({ id, amount, currency, onUse, onClose }: {
  id: string;
  amount: number;
  currency: string;
  onUse: (amount: number) => void;
  onClose: () => void;
}) {
  const [expression, setExpression] = useState(() => String(amount || 0));
  const [fresh, setFresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  let result: number | null = null;
  try { result = calculateExpression(expression); } catch { /* Incomplete expression while typing. */ }
  const rounded = result === null ? null : Math.round((result + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    // Focus the keypad, not an input: mobile users don't need two keyboards.
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, []);

  function press(key: string) {
    setError(null);
    if (key === "C") { setExpression("0"); setFresh(true); return; }
    if (key === "⌫") { setExpression((value) => value.slice(0, -1) || "0"); setFresh(false); return; }
    if (key === "=") {
      try {
        setExpression(String(calculateExpression(expression)));
        setFresh(true);
      } catch (err) { setError(err instanceof Error ? err.message : "Check your calculation."); }
      return;
    }
    setExpression((value) => {
      if ((fresh || value === "0") && /^[\d.(]$/.test(key)) return key === "." ? "0." : key;
      return (value + key).slice(0, 200);
    });
    setFresh(false);
  }

  function keyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Native buttons keep Enter/Space activation; typed arithmetic works from
    // the focused panel or any keypad key without submitting the transaction.
    if (event.key === "Enter" && event.target instanceof HTMLButtonElement) return;
    const key = event.key === "Backspace" ? "⌫" : event.key === "Delete" ? "C" :
      event.key === "Enter" ? "=" : event.key === "*" ? "×" : event.key === "/" ? "÷" :
      event.key === "-" ? "−" : event.key;
    if (/^[\d.+%()=]$/.test(key) || ["⌫", "C", "×", "÷", "−"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      press(key);
    }
  }

  return (
    <div id={id} ref={panel} role="region" aria-label="Amount calculator" tabIndex={-1} onKeyDown={keyDown}
      className="space-y-3 rounded-xl border border-line bg-surface-sunken p-3 outline-none">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Calculator</p>
        <button type="button" onClick={onClose} className="min-h-11 px-2 text-xs font-semibold text-primary">Close calculator</button>
      </div>
      <div className="rounded-lg bg-surface p-3 text-right">
        <p aria-label="Calculation" className="tabular min-h-6 break-all text-lg text-ink">{expression}</p>
        <p aria-live="polite" className="tabular mt-1 min-h-5 text-sm text-muted">
          {rounded === null ? "Finish your calculation" : formatMoney(rounded, currency)}
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-expense">{error}</p>}
      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((key) => (
          <button key={key} type="button" aria-label={key === "⌫" ? "Backspace" : key === "C" ? "Clear calculation" : key}
            onClick={() => press(key)}
            className={`flex min-h-11 touch-manipulation items-center justify-center rounded-lg text-lg font-semibold transition-colors active:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${/\d|\./.test(key) ? "bg-surface text-ink hover:bg-surface-raised" : "bg-primary-soft text-primary hover:bg-surface-raised"}`}>
            {key === "⌫" ? <Delete aria-hidden="true" className="h-5 w-5" /> : key}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={() => press("=")}>Calculate =</Button>
        <Button type="button" variant="primary" disabled={rounded === null || rounded <= 0} onClick={() => { if (rounded !== null && rounded > 0) onUse(rounded); }}>Use amount</Button>
      </div>
      <p className="text-xs text-muted">Use +, −, ×, ÷, parentheses or %. The amount is rounded to two decimal places.</p>
    </div>
  );
}
