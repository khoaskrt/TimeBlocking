import { FREQ_META } from "@/lib/features/routines/constants";
import type { RoutineFrequency } from "@/lib/types";

export function FreqTag({ freq }: { freq: RoutineFrequency }) {
  if (freq === "daily") return null;
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-medium text-zinc-400">
      {FREQ_META[freq].label}
    </span>
  );
}
