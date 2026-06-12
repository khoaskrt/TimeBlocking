"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useTodayState } from "@/lib/features/today/use-today-state";
import { INITIAL_DATA } from "@/lib/features/today/mock-data";
import { setTaskTop3, toggleTaskStatus } from "@/app/(dashboard)/tasks/actions";
import { toggleRoutineLog } from "@/app/(dashboard)/routines/actions";
import type { RoutineItem, Task } from "@/lib/types";
import { Top3Section } from "@/components/today/top3-section";
import { TaskList } from "@/components/today/task-list";
import { DailyQuote } from "@/components/today/daily-quote";
import { RoutinesSection } from "@/components/today/routines-section";
import { RetainersSection } from "@/components/today/retainers-section";
import { SlippingSection } from "@/components/today/slipping-section";
import { ResurfacingSection } from "@/components/today/resurfacing-section";

function Hr() {
  return <div className="h-px bg-zinc-100 my-5" />;
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="tabular-nums">
      {now
        ? now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--"}
    </span>
  );
}

export function TodayDashboard({
  dateLabel,
  initialTasks,
  initialRoutines,
}: {
  dateLabel: string;
  initialTasks: Task[];
  initialRoutines: Record<string, RoutineItem[]>;
}) {
  const s = useTodayState({ initialTasks, initialRoutines, actions: { toggleTaskStatus, setTaskTop3, toggleRoutineLog } });

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-white font-[family-name:var(--font-inter)]">
        <div className="px-5 pt-8 pb-28 sm:px-8 md:px-11 md:pt-9 md:pb-20 flex gap-12 justify-center">
          {/* Left column - main content */}
          <div className="flex-1 max-w-[620px] min-w-0">
            {/* Editorial header */}
            <div className="flex items-start">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-400">
                  Today
                </div>
                <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-zinc-900">
                  {dateLabel}
                </h1>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-zinc-500">
                  <Clock size={13} strokeWidth={2} className="text-zinc-400" />
                  <LiveClock />
                </div>
              </div>
              <span className="flex-1" />
            </div>

            {s.error ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
                {s.error}
              </div>
            ) : null}

            <Hr />
            <Top3Section
              top3={s.top3}
              onToggleTask={s.toggleTask}
              onToggleTop3={s.toggleTop3}
            />
            <Hr />
            <TaskList
              top3={s.top3}
              todayTasks={s.todayTasks}
              otherTasks={s.otherTasks}
              onToggleTask={s.toggleTask}
              onToggleTop3={s.toggleTop3}
            />
          </div>

          {/* Right rail */}
          <div className="w-[290px] shrink-0 pt-2 flex flex-col gap-6 max-lg:hidden">
            <DailyQuote />
            <RoutinesSection
              routines={s.routines}
              onToggleRoutine={s.toggleRoutine}
            />
            <div className="h-px bg-zinc-100" />
            <RetainersSection retainers={INITIAL_DATA.retainers} />
            <div className="h-px bg-zinc-100" />
            <SlippingSection staleProjects={INITIAL_DATA.staleProjects} />
            <div className="h-px bg-zinc-100" />
            <ResurfacingSection note={INITIAL_DATA.resurface} />
          </div>
        </div>
      </div>
  );
}
