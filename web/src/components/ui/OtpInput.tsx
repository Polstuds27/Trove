/**
 * Boxed one-time-code input.
 *
 * Adapted from OpenSource UI's `OtpBoxedInput` (MIT, (c) 2026 Bidyut Kundu,
 * github.com/bidyut10/opensourceui). Kept: per-character boxes, digit
 * sanitising, auto-advance, Backspace/Delete/Arrow/Home/End handling and
 * paste-to-fill from any box. Trove changes: always controlled (the page owns
 * the value and validation), no demo copy/resend timer, `one-time-code`
 * autocomplete on the first box so SMS/email autofill still works, theme
 * tokens, and a fieldset/legend so the group is announced as one field.
 */
import { useCallback, useEffect, useId, useRef, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";

function sanitize(raw: string, length: number): string {
  return raw.replace(/\D/g, "").slice(0, length);
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  label,
  autoFocus = false,
  disabled = false,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label: string;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const id = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const current = sanitize(value, length);
  const digits = Array.from({ length }, (_, index) => current[index] ?? "");

  const focusAt = useCallback(
    (index: number) => {
      const node = refs.current[Math.max(0, Math.min(length - 1, index))];
      node?.focus();
      node?.select();
    },
    [length],
  );

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const frame = requestAnimationFrame(() => focusAt(0));
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, disabled, focusAt]);

  const setDigit = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    // Keep characters contiguous: a cleared middle box collapses the gap.
    onChange(sanitize(next.join(""), length));
  };

  const handleInput = (index: number, event: FormEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value;
    if (raw.length > 1) {
      // Autofill or IME delivered several characters at once.
      const filled = sanitize(digits.slice(0, index).join("") + raw, length);
      onChange(filled);
      focusAt(Math.min(filled.length, length - 1));
      return;
    }
    const char = raw.replace(/\D/g, "");
    if (!char) return;
    setDigit(index, char);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        focusAt(index - 1);
        return;
      case "ArrowRight":
        event.preventDefault();
        focusAt(index + 1);
        return;
      case "Home":
        event.preventDefault();
        focusAt(0);
        return;
      case "End":
        event.preventDefault();
        focusAt(length - 1);
        return;
      case "Backspace":
        event.preventDefault();
        if (digits[index]) {
          setDigit(index, "");
        } else if (index > 0) {
          setDigit(index - 1, "");
          focusAt(index - 1);
        }
        return;
      case "Delete":
        event.preventDefault();
        setDigit(index, "");
        return;
      default:
        // Typing over a filled box replaces it and advances.
        if (/^\d$/.test(event.key) && digits[index]) {
          event.preventDefault();
          setDigit(index, event.key);
          if (index < length - 1) focusAt(index + 1);
        }
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = sanitize(event.clipboardData.getData("text"), length - index);
    if (!pasted) return;
    const next = sanitize(digits.slice(0, index).join("") + pasted, length);
    onChange(next);
    focusAt(Math.min(next.length, length - 1));
  };

  return (
    <fieldset disabled={disabled} aria-invalid={invalid || undefined}>
      <legend className="label mb-1.5">{label}</legend>
      <div className="flex gap-1.5 sm:gap-2" aria-describedby={`${id}-hint`}>
        <span id={`${id}-hint`} className="sr-only">
          {length} digits
        </span>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={index === 0 ? length : 1}
            aria-label={`Digit ${index + 1} of ${length}`}
            value={digit}
            onInput={(event) => handleInput(index, event)}
            onChange={() => undefined}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.currentTarget.select()}
            className={`tabular h-12 w-full min-w-0 rounded-xl border bg-surface text-center text-[20px] font-semibold text-ink outline-none transition-[border-color,box-shadow,transform] duration-fast focus:border-primary focus:shadow-[0_0_0_3px_rgb(var(--ring-focus)/0.25)] sm:h-14 ${
              invalid ? "border-expense" : digit ? "border-line-strong" : "border-line"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}
