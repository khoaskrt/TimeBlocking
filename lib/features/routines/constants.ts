import type { RoutineFrequency, RoutineGroupId } from "@/lib/types";

/** done[k] = completed k days ago (0 = today) */
export const HIST_DAYS = 36;

export const FREQ_META: Record<
  RoutineFrequency,
  { label: string; test: (dow: number) => boolean }
> = {
  daily: { label: "Daily", test: () => true },
  weekdays: { label: "Weekdays (Mon-Fri)", test: (dow) => dow >= 1 && dow <= 5 },
  weekends: { label: "Weekends (Sat-Sun)", test: (dow) => dow === 0 || dow === 6 },
  mwf: { label: "Mon · Wed · Fri", test: (dow) => dow === 1 || dow === 3 || dow === 5 },
  weekly_sun: { label: "Weekly on Sunday", test: (dow) => dow === 0 },
  weekly_mon: { label: "Weekly on Monday", test: (dow) => dow === 1 },
  weekly_tue: { label: "Weekly on Tuesday", test: (dow) => dow === 2 },
  weekly_wed: { label: "Weekly on Wednesday", test: (dow) => dow === 3 },
  weekly_thu: { label: "Weekly on Thursday", test: (dow) => dow === 4 },
  weekly_fri: { label: "Weekly on Friday", test: (dow) => dow === 5 },
  weekly_sat: { label: "Weekly on Saturday", test: (dow) => dow === 6 },
};

export const WEEKLY_FREQUENCIES: RoutineFrequency[] = [
  "weekly_sun",
  "weekly_mon",
  "weekly_tue",
  "weekly_wed",
  "weekly_thu",
  "weekly_fri",
  "weekly_sat",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_CHIPS = ["S", "M", "T", "W", "T", "F", "S"];

export const GROUP_ORDER: RoutineGroupId[] = ["morning", "afternoon", "evening"];

export const GROUP_LABELS: Record<RoutineGroupId, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
