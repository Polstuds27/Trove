/**
 * File drop zone with a live file card.
 *
 * Adapted from EasyUI's `AnimatedFileUpload` (MIT, (c) 2026 Suraj Maurya,
 * github.com/Surajmaurya1/easyui). Kept: the dashed drop zone that lifts and
 * brightens while a file is dragged over it, the icon that rises on drag,
 * click / Enter / Space to browse, the file card with a type icon, name, size
 * and status line, the progress strip along the card's bottom edge, and the
 * retry / remove actions. Trove changes:
 * - No simulated upload: the card reflects the caller's real work. `onFile`
 *   returns null when it succeeded or an error message, and the card shows
 *   "Working…", "Ready" or that message. While working, the strip is an
 *   indeterminate sweep, never an invented percentage.
 * - Single-file by default (Trove's imports take one file); `resetKey`
 *   clears the card after the caller commits or cancels; `onClear` lets the
 *   caller drop its preview when the user removes the file.
 * - Framer Motion became CSS transitions/keyframes; theme tokens throughout.
 */
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { AlertCircle, Check, File as FileIcon, FileJson, FileSpreadsheet, RotateCcw, Upload, X } from "lucide-react";

type Status = "working" | "ready" | "error";

interface Item {
  file: File;
  status: Status;
  message?: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv" || ext === "xlsx" || ext === "xls") return FileSpreadsheet;
  if (ext === "json") return FileJson;
  return FileIcon;
}

export function FileDrop({
  label,
  accept,
  title = "Drop a file here",
  subtitle = "or browse from your device",
  hint,
  maxSize,
  disabled = false,
  onFile,
  onClear,
  resetKey,
}: {
  /** Accessible name for the drop zone, e.g. "CSV file to import". */
  label: string;
  accept?: string;
  title?: string;
  subtitle?: string;
  /** Extra line under the subtitle, e.g. "CSV files". */
  hint?: string;
  /** Optional size limit in bytes (rejected before `onFile`). */
  maxSize?: number;
  disabled?: boolean;
  /** Do the real work; resolve null on success or an error message. */
  onFile: (file: File) => Promise<string | null | void>;
  /** The user removed the file. */
  onClear?: () => void;
  /** Change this to clear the card (after a commit or cancel). */
  resetKey?: unknown;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const depth = useRef(0);

  // Caller-driven reset (e.g. after "Import" or "Cancel").
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    setItem(null);
  }, [resetKey]);

  const run = async (file: File) => {
    if (maxSize && file.size > maxSize) {
      setItem({ file, status: "error", message: `File is larger than ${formatSize(maxSize)}` });
      return;
    }
    setItem({ file, status: "working" });
    try {
      const result = await onFile(file);
      setItem((current) =>
        current?.file === file ? { file, status: result ? "error" : "ready", message: result || undefined } : current,
      );
    } catch (error) {
      setItem((current) =>
        current?.file === file
          ? { file, status: "error", message: error instanceof Error ? error.message : "Couldn't read that file." }
          : current,
      );
    }
  };

  const browse = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    depth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void run(file);
  };

  const Icon = item ? iconFor(item.file.name) : FileIcon;
  const working = item?.status === "working";
  const ready = item?.status === "ready";
  const failed = item?.status === "error";

  return (
    <div className="w-full select-none">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void run(file);
          event.target.value = "";
        }}
      />

      {/* Drop zone. */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={browse}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            browse();
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center outline-none transition-[transform,background-color,border-color,box-shadow] duration-base ease-out-soft focus-visible:shadow-[0_0_0_3px_rgb(var(--ring-focus)/0.35)] ${
          dragging
            ? "scale-[1.01] border-primary bg-primary-soft-bg/60"
            : "border-line-strong bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken/70"
        } ${disabled ? "cursor-not-allowed border-solid opacity-40" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border transition-[transform,color,background-color,border-color] duration-base ease-out-soft ${
            dragging ? "-translate-y-[3px] scale-[1.08] border-primary/40 bg-surface-raised text-primary" : "border-line bg-surface-raised text-muted"
          }`}
        >
          <Upload className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-ink">{dragging ? "Release to add" : title}</p>
        <p className="mt-1 text-xs text-muted">
          {subtitle}
          {maxSize ? <span className="text-faint"> (up to {formatSize(maxSize)})</span> : null}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
      </div>

      {/* File card. */}
      {item && (
        <div
          className={`relative mt-3 animate-rise overflow-hidden rounded-xl border p-3 transition-colors duration-base ${
            failed ? "border-expense/30 bg-expense-soft/50" : ready ? "border-income/30 bg-income-soft/50" : "border-line bg-surface"
          }`}
        >
          <div className="relative z-10 flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                failed
                  ? "border-expense/30 bg-expense-soft text-expense"
                  : ready
                    ? "border-income/30 bg-income-soft text-income"
                    : "border-line bg-surface-sunken text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-medium text-ink">{item.file.name}</p>
                <span className="tabular shrink-0 text-[11px] text-faint">{formatSize(item.file.size)}</span>
              </div>
              <p role="status" aria-live="polite" className="mt-0.5 text-[11.5px]">
                {failed ? (
                  <span className="flex items-center gap-1 text-expense">
                    <AlertCircle aria-hidden="true" className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.message ?? "Couldn't read that file."}</span>
                  </span>
                ) : ready ? (
                  <span className="flex items-center gap-1 text-income">
                    <Check aria-hidden="true" className="h-3 w-3 shrink-0 animate-cal-pill" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted">
                    <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
                    Working…
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {failed && (
                <button
                  type="button"
                  onClick={() => void run(item.file)}
                  aria-label={`Retry ${item.file.name}`}
                  title="Retry"
                  className="icon-btn h-8 w-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setItem(null);
                  onClear?.();
                }}
                disabled={working}
                aria-label={`Remove ${item.file.name}`}
                title="Remove"
                className="icon-btn h-8 w-8 disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {working && (
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-surface-sunken">
              <div className="file-sweep h-full w-1/3 rounded-full bg-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
