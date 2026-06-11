"use client";

import { RefreshCw } from "lucide-react";
import { AreaDot } from "@/components/shared/area-dot";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionLabel } from "@/components/shared/section-label";
import type { Retainer } from "@/lib/types";

export interface RetainersSectionProps {
  retainers: Retainer[];
}

export function RetainersSection({ retainers }: RetainersSectionProps) {
  return (
    <div>
      <SectionLabel icon={<RefreshCw size={13} strokeWidth={2} className="text-zinc-400" />}>
        Retainer progress
      </SectionLabel>
      <div className="flex flex-col gap-2.5 mt-2">
        {retainers.map((r) => (
          <div
            key={r.id}
            className="border border-zinc-200 rounded-xl p-3.5 cursor-pointer hover:border-zinc-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AreaDot area={r.area} size={7} />
              <span className="text-[13.5px] font-medium text-zinc-900 flex-1 truncate">
                {r.client}
              </span>
              <span className="text-[11.5px] text-zinc-400">{r.month}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2.5">
              <ProgressBar value={r.doneItems} max={r.totalItems} />
              <span className="text-[11.5px] text-zinc-500 whitespace-nowrap tabular-nums">
                {r.doneItems}/{r.totalItems}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
