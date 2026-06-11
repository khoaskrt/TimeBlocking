"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function RDCheckbox({
  checked,
  onChange,
  size = 16,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  size?: number;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
      className={cn(
        "shrink-0 rounded flex items-center justify-center cursor-pointer transition-colors",
        checked ? "bg-zinc-900 border-zinc-900" : "bg-white border-zinc-300"
      )}
      style={{ width: size, height: size, borderWidth: 1 }}
    >
      {checked && <Check size={size - 5} strokeWidth={2.5} className="text-white" />}
    </div>
  );
}
