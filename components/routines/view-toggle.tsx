"use client";

import type { RoutinesViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { v: RoutinesViewMode; label: string }[] = [
  { v: "today", label: "Today" },
  { v: "week", label: "Week" },
];

export function ViewToggle({
  value,
  onChange,
}: {
  value: RoutinesViewMode;
  onChange: (v: RoutinesViewMode) => void;
}) {
  return (
    <div className="flex gap-[3px] rounded-lg bg-zinc-100 p-[3px]">
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-md px-3.5 py-1 text-[12px] font-medium cursor-pointer transition-colors",
            value === o.v
              ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.08)]"
              : "text-zinc-500 hover:text-zinc-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
