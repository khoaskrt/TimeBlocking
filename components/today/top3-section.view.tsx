"use client";

import { Star } from "lucide-react";
import { RDCheckbox } from "@/components/shared/checkbox";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Design-safe zone ──────────────────────────────────────
   This file contains ONLY presentation (JSX + Tailwind).
   State logic lives in top3-section.tsx (container).
   Do NOT add state, handlers, or business logic here.
   ────────────────────────────────────────────────────────── */

export interface Top3ViewProps {
  spots: (Task | null)[];
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}

function StarButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={on ? "Remove from Top 3" : "Star for Top 3"}
      className={cn(
        "cursor-pointer transition-all hover:scale-110",
        on ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}
    >
      <Star
        size={15}
        strokeWidth={1.75}
        fill={on ? "#18181B" : "none"}
        stroke={on ? "#18181B" : "#A1A1AA"}
      />
    </span>
  );
}

export function Top3View({ spots, onToggleTask, onToggleTop3 }: Top3ViewProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400">
        Top 3 for today
      </div>
      <div className="mt-1.5">
        {spots.map((t, i) =>
          t ? (
            <div
              key={t.id}
              className="group flex items-center gap-3 min-h-[46px] px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
              style={{ opacity: t.done ? 0.45 : 1 }}
            >
              <RDCheckbox checked={t.done} onChange={() => onToggleTask(t.id)} size={18} />
              <span
                className={cn(
                  "flex-1 text-[15.5px] font-medium text-zinc-900",
                  t.done && "line-through"
                )}
              >
                {t.title}
              </span>
              <StarButton on onClick={() => onToggleTop3(t.id)} />
            </div>
          ) : (
            <div key={"spot" + i} className="flex items-center gap-3 min-h-[46px]">
              <span className="w-[18px] h-[18px] rounded border border-dashed border-zinc-300" />
              <span className="text-sm italic text-zinc-300">(open spot)</span>
            </div>
          )
        )}
      </div>
      {spots.some((x) => !x) && (
        <p className="mt-0.5 text-[12.5px] text-zinc-400">
          Star a task below to set it as today&apos;s Top 3.
        </p>
      )}
    </div>
  );
}
