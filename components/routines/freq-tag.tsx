import { FREQ_META } from "@/lib/features/routines/constants";
import { formatRecurrenceLabel } from "@/lib/features/routines/derive";
import type { RoutineFrequency, RoutineRecurrence } from "@/lib/types";

export function FreqTag({ freq, recurrence }: { freq: RoutineFrequency; recurrence?: RoutineRecurrence | null }) {
  if (freq === "daily" && !recurrence) return null;
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-medium text-zinc-400">
      {recurrence ? formatRecurrenceLabel(recurrence) : FREQ_META[freq].label}
    </span>
  );
}
