import type { Routine, RoutineFrequency, RoutineRecurrence, RoutineStats } from "@/lib/types";
import { FREQ_META, HIST_DAYS, WEEKDAY_LABELS } from "./constants";

export function dateAgo(daysAgo: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function startOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseLocalDate(value: string | null | undefined) {
  if (!value) return null;
  const [datePart] = value.split("T");
  const parts = datePart.split("-").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / 86_400_000);
}

function monthDiff(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
}

function weekStart(date: Date) {
  const copy = startOfLocalDay(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

function recurrenceMatchesDate(recurrence: RoutineRecurrence, anchor: Date, date: Date) {
  const interval = Math.max(1, recurrence.interval || 1);
  const diffDays = daysBetween(anchor, date);
  if (diffDays < 0) return false;

  if (recurrence.unit === "day") return diffDays % interval === 0;

  if (recurrence.unit === "week") {
    const diffWeeks = Math.floor(daysBetween(weekStart(anchor), weekStart(date)) / 7);
    const days = recurrence.daysOfWeek?.length ? recurrence.daysOfWeek : [anchor.getDay()];
    return diffWeeks >= 0 && diffWeeks % interval === 0 && days.includes(date.getDay());
  }

  const diffMonths = monthDiff(anchor, date);
  return diffMonths >= 0 && diffMonths % interval === 0 && date.getDate() === anchor.getDate();
}

function occurrenceCountThrough(recurrence: RoutineRecurrence, anchor: Date, date: Date) {
  let count = 0;
  const cursor = startOfLocalDay(anchor);
  const end = startOfLocalDay(date);

  while (cursor.getTime() <= end.getTime()) {
    if (recurrenceMatchesDate(recurrence, anchor, cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function isRecurrenceScheduled(recurrence: RoutineRecurrence, daysAgo: number, anchorValue?: string) {
  const anchor = parseLocalDate(anchorValue) || dateAgo(0);
  const date = dateAgo(daysAgo);
  const end = recurrence.ends;

  if (end.mode === "on") {
    const endDate = parseLocalDate(end.date);
    if (endDate && daysBetween(date, endDate) < 0) return false;
  }

  if (!recurrenceMatchesDate(recurrence, anchor, date)) return false;

  if (end.mode === "after" && end.occurrences) {
    return occurrenceCountThrough(recurrence, anchor, date) <= end.occurrences;
  }

  return true;
}

export const isScheduled = (
  freq: RoutineFrequency,
  daysAgo: number,
  recurrence?: RoutineRecurrence | null,
  anchorValue?: string,
) => recurrence
  ? isRecurrenceScheduled(recurrence, daysAgo, anchorValue)
  : FREQ_META[freq].test(dateAgo(daysAgo).getDay());

export function isRoutineScheduled(item: Pick<Routine, "freq" | "recurrence" | "createdAt">, daysAgo: number) {
  return isScheduled(item.freq, daysAgo, item.recurrence, item.createdAt);
}

export function formatRecurrenceLabel(recurrence: RoutineRecurrence | null | undefined) {
  if (!recurrence) return "";

  const interval = Math.max(1, recurrence.interval || 1);
  const unitLabel = recurrence.unit + (interval === 1 ? "" : "s");
  const base = interval === 1 ? `Every ${recurrence.unit}` : `Every ${interval} ${unitLabel}`;
  const days = recurrence.unit === "week" && recurrence.daysOfWeek?.length
    ? ` on ${recurrence.daysOfWeek.map((day) => WEEKDAY_LABELS[day]).join(", ")}`
    : "";
  const end = recurrence.ends.mode === "on" && recurrence.ends.date
    ? ` until ${new Date(`${recurrence.ends.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : recurrence.ends.mode === "after" && recurrence.ends.occurrences
      ? ` for ${recurrence.ends.occurrences} times`
      : "";

  return `${base}${days}${end}`;
}

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
    if (!isRoutineScheduled(item, k)) continue;
    if (item.done[k]) n++;
    else break;
  }
  return n;
}

export function computeStats(items: Routine[]): RoutineStats {
  const schedToday = items.filter((it) => isRoutineScheduled(it, 0));
  const todayDone = schedToday.filter((it) => it.done[0]).length;

  const ratio = (from: number, to: number) => {
    let d = 0;
    let s = 0;
    items.forEach((it) => {
      for (let k = from; k <= to; k++) {
        if (isRoutineScheduled(it, k)) {
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
      if (isRoutineScheduled(it, k)) {
        s++;
        if (it.done[k]) d++;
      }
    });
    spark.push(s ? d / s : 1);
  }

  const dayComplete = (k: number) =>
    items.every((it) => !isRoutineScheduled(it, k) || it.done[k]);
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
