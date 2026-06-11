import { isScheduled } from "@/lib/features/routines/derive";
import type { Routine } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySquares({
  routine,
  days = 14,
  size = 7,
}: {
  routine: Routine;
  days?: number;
  size?: number;
}) {
  const cells = [];
  for (let k = days - 1; k >= 0; k--) {
    const sched = isScheduled(routine.freq, k);
    const isToday = k === 0;
    cells.push(
      <span
        key={k}
        className={cn(
          "shrink-0 rounded-[2px] border box-border",
          !sched && "border-zinc-100 bg-transparent",
          sched && routine.done[k] && "border-zinc-700 bg-zinc-700",
          sched && !routine.done[k] && isToday && "border-zinc-400 bg-white",
          sched && !routine.done[k] && !isToday && "border-zinc-200 bg-zinc-200",
          // Show only the most recent week on small screens
          k >= 7 && "max-sm:hidden",
        )}
        style={{ width: size, height: size }}
      />,
    );
  }
  return <span className="inline-flex items-center gap-[2.5px]">{cells}</span>;
}
