import type { Routine, RoutineFrequency, RoutineStats } from "@/lib/types";
import { FREQ_META, HIST_DAYS } from "./constants";

export function dateAgo(daysAgo: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export const isScheduled = (freq: RoutineFrequency, daysAgo: number) =>
  FREQ_META[freq].test(dateAgo(daysAgo).getDay());

export const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

/** Consecutive scheduled days completed, counting today only if checked. */
export function routineStreak(item: Routine) {
  let n = item.done[0] ? 1 : 0;
  for (let k = 1; k < HIST_DAYS; k++) {
    if (!isScheduled(item.freq, k)) continue;
    if (item.done[k]) n++;
    else break;
  }
  return n;
}

export function computeStats(items: Routine[]): RoutineStats {
  const schedToday = items.filter((it) => isScheduled(it.freq, 0));
  const todayDone = schedToday.filter((it) => it.done[0]).length;

  const ratio = (from: number, to: number) => {
    let d = 0;
    let s = 0;
    items.forEach((it) => {
      for (let k = from; k <= to; k++) {
        if (isScheduled(it.freq, k)) {
          s++;
          if (it.done[k]) d++;
        }
      }
    });
    return s ? d / s : 0;
  };

  const spark: number[] = [];
  for (let k = 29; k >= 0; k--) {
    let d = 0;
    let s = 0;
    items.forEach((it) => {
      if (isScheduled(it.freq, k)) {
        s++;
        if (it.done[k]) d++;
      }
    });
    spark.push(s ? d / s : 1);
  }

  const dayComplete = (k: number) =>
    items.every((it) => !isScheduled(it.freq, k) || it.done[k]);
  let streak = 0;
  for (let k = 1; k < HIST_DAYS; k++) {
    if (dayComplete(k)) streak++;
    else break;
  }
  if (schedToday.length && dayComplete(0)) streak += 1;

  return {
    todayDone,
    todayTotal: schedToday.length,
    rate30: Math.round(ratio(1, 30) * 100),
    rate7: Math.round(ratio(1, 7) * 100),
    spark,
    streak,
  };
}

export interface WeekDay {
  daysAgo: number;
  isToday: boolean;
  isFuture: boolean;
  label: string;
  num: number;
  dow: number;
}

/** Current week, Monday → Sunday. */
export function weekDays(): WeekDay[] {
  const offset = (new Date().getDay() + 6) % 7; // 0 = Monday
  return [...Array(7)].map((_, i) => {
    const daysAgo = offset - i;
    const real = dateAgo(daysAgo);
    return {
      daysAgo,
      isToday: daysAgo === 0,
      isFuture: daysAgo < 0,
      label: ["M", "T", "W", "T", "F", "S", "S"][i],
      num: real.getDate(),
      dow: real.getDay(),
    };
  });
}
