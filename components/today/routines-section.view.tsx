"use client";

import { Flame, ArrowRight } from "lucide-react";
import { RDCheckbox } from "@/components/shared/checkbox";
import { ROUTINE_STREAKS } from "@/lib/features/today/constants";
import type { RoutineItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Design-safe zone ──────────────────────────────────────
   This file contains ONLY presentation (JSX + Tailwind).
   State logic lives in routines-section.tsx (container).
   Do NOT add state, handlers, or business logic here.
   ────────────────────────────────────────────────────────── */

const BLOCKS = ["morning", "afternoon", "evening"] as const;
const BLOCK_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export interface RoutinesViewProps {
  routines: Record<string, RoutineItem[]>;
  doneCount: number;
  totalCount: number;
  onToggleRoutine: (block: string, id: string) => void;
}

export function RoutinesView({ routines, doneCount, totalCount, onToggleRoutine }: RoutinesViewProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 whitespace-nowrap">
          Routines · {doneCount}/{totalCount}
        </span>
        <span className="flex-1" />
        <span className="text-[11.5px] text-zinc-400 inline-flex items-center gap-1 cursor-pointer hover:underline">
          View all <ArrowRight size={11} strokeWidth={2} />
        </span>
      </div>

      {BLOCKS.map((block) => (
        <div key={block} className="mt-3">
          <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-zinc-300">
            {BLOCK_LABELS[block]}
          </div>
          {(routines[block] || []).map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2.5 min-h-[32px] px-2 -mx-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <RDCheckbox
                checked={item.done}
                onChange={() => onToggleRoutine(block, item.id)}
                size={15}
              />
              <span
                className={cn(
                  "flex-1 text-[13px] truncate",
                  item.done ? "text-zinc-400 line-through" : "text-zinc-900"
                )}
              >
                {item.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 tabular-nums">
                <Flame size={11} strokeWidth={1.9} />
                {ROUTINE_STREAKS[item.id]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
