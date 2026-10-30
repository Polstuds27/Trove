import { useState } from "react";
import { X } from "lucide-react";
import { GlassPanel, Mascot } from "./index";
import type { MascotState } from "../../lib/mascot";

interface MascotTipCardProps {
  title: string;
  lines: string[];
  mascotState?: MascotState;
  storageKey: string;
  mascotSize?: number;
  className?: string;
}

export function MascotTipCard({
  title,
  lines,
  mascotState = "accounts",
  storageKey,
  className = "",
}: MascotTipCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(
    () => typeof localStorage !== "undefined" && localStorage.getItem(storageKey) === "1",
  );

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <GlassPanel
      className={`relative flex items-center gap-3 overflow-hidden !rounded-[24px] !border-line/55 p-3.5 sm:p-4 ${className}`}
    >
      <button
        type="button"
        aria-label="Dismiss tip"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-line/60"
        onClick={dismiss}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1 pr-10">
        <p className="mb-1 text-[12.5px] font-bold leading-5 text-ink">{title}</p>
        <div className="space-y-1.5">
          {lines.map((line, index) => (
            <p key={index} className="text-[12px] leading-[1.45] text-muted">
              {line}
            </p>
          ))}
        </div>
      </div>
      <Mascot
        state={mascotState}
        size={64}
        className="shrink-0 self-center !h-[56px] !w-[56px] sm:!h-[64px] sm:!w-[64px]"
      />
    </GlassPanel>
  );
}
