import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "./Button";

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  /** Rendered on the right of the label row (units, add-buttons, hints). */
  addon?: ReactNode;
}

export function Field({ label, hint, error, htmlFor, required, className = "", children, addon }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || addon) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label className="label" htmlFor={htmlFor}>
              {label}
              {required && (
                <span aria-hidden="true" className="ml-0.5 text-expense">
                  *
                </span>
              )}
            </label>
          )}
          {addon}
        </div>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  addon?: ReactNode;
  fieldClassName?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, addon, fieldClassName = "", leadingIcon, trailing, className = "", id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} addon={addon} htmlFor={inputId} required={required} className={fieldClassName}>
      <div className="relative flex items-center">
        {leadingIcon && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3 text-muted">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={`input ${leadingIcon ? "pl-9" : ""} ${trailing ? "pr-10" : ""} ${error ? "input-error" : ""} ${className}`}
          {...rest}
        />
        {trailing && <span className="absolute right-1">{trailing}</span>}
      </div>
    </Field>
  );
});

// Select lives in Select.tsx (EasyUI SpringSelect port); re-exported here so
// existing `./Input` imports keep working.
export { Select, type SelectProps } from "./Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  addon?: ReactNode;
  fieldClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, addon, fieldClassName = "", className = "", id, ...rest },
  ref,
) {
  const generatedId = useId();
  const areaId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} addon={addon} htmlFor={areaId} className={fieldClassName}>
      <textarea
        ref={ref}
        id={areaId}
        className={`input min-h-[72px] resize-y ${error ? "input-error" : ""} ${className}`}
        {...rest}
      />
    </Field>
  );
});

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  fieldClassName?: string;
}

export function SearchInput({ value, onValueChange, label, hint, fieldClassName, className = "", placeholder = "Search", ...rest }: SearchInputProps) {
  return (
    <Input
      type="search"
      role="searchbox"
      aria-label={typeof label === "string" ? label : placeholder}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      label={label}
      hint={hint}
      fieldClassName={fieldClassName}
      placeholder={placeholder}
      leadingIcon={<Search className="h-4 w-4" />}
      trailing={
        value ? (
          <IconButton label="Clear search" size="sm" onClick={() => onValueChange("")}>
            <X className="h-4 w-4" />
          </IconButton>
        ) : null
      }
      className={className}
      {...rest}
    />
  );
}