import type { RoutineFrequency, RoutineGroupId } from "@/lib/types";

/** done[k] = completed k days ago (0 = today) */
export const HIST_DAYS = 36;

export const FREQ_META: Record<
  RoutineFrequency,
  { label: string; test: (dow: number) => boolean }
> = {
  daily: { label: "Daily", test: () => true },
  weekdays: { label: "Weekdays", test: (dow) => dow >= 1 && dow <= 5 },
  mwf: { label: "Mon · Wed · Fri", test: (dow) => dow === 1 || dow === 3 || dow === 5 },
};

export const GROUP_ORDER: RoutineGroupId[] = ["morning", "afternoon", "evening"];

export const GROUP_LABELS: Record<RoutineGroupId, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
