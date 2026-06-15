"use client";

import { RefreshCw } from "lucide-react";
import { AreaDot } from "@/components/shared/area-dot";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionLabel } from "@/components/shared/section-label";
import { formatHours } from "@/lib/features/projects/data";
import type { TodayMonthlyService } from "@/lib/types";

export interface RetainersSectionProps {
  monthlyServices: TodayMonthlyService[];
}

export function RetainersSection({ monthlyServices }: RetainersSectionProps) {
  return (
    <div>
      <SectionLabel icon={<RefreshCw size={13} strokeWidth={2} className="text-zinc-400" />}>
        Monthly services
      </SectionLabel>
      <div className="flex flex-col gap-2.5 mt-2">
        {monthlyServices.length ? (
          monthlyServices.map((service) => (
            <div
              key={service.id}
              className="border border-zinc-200 rounded-xl p-3.5 cursor-pointer hover:border-zinc-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AreaDot area={service.area} size={7} />
                <span className="text-[13.5px] font-medium text-zinc-900 flex-1 truncate">
                  {service.name}
                </span>
                <span className="text-[11.5px] text-zinc-400">{service.month}</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2.5">
                <ProgressBar value={service.doneItems} max={service.totalItems || 1} />
                <span className="text-[11.5px] text-zinc-500 whitespace-nowrap tabular-nums">
                  {service.doneItems}/{service.totalItems}
                </span>
              </div>
              <div className="mt-1.5 text-[11.5px] text-zinc-400 tabular-nums">
                {formatHours(service.loggedHours)} / {formatHours(service.monthlyHours)}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-200 px-3.5 py-3 text-[12.5px] italic text-zinc-400">
            No monthly services are active.
          </p>
        )}
      </div>
    </div>
  );
}
