import type { Routine, RoutineFrequency, RoutineGroupId } from "@/lib/types";
import { HIST_DAYS } from "./constants";
import { dateAgo } from "./derive";

export type RoutineGoal = NonNullable<Routine["goal"]>;

export type RoutineMutationInput = {
  id?: string;
  label: string;
  desc: string;
  group: RoutineGroupId;
  freq: RoutineFrequency;
  time: string;
  remind: boolean;
  goal: RoutineGoal;
  goalDays: string;
};

export type RoutineActionResult =
  | { ok: true; routine: Routine; deletedId?: never }
  | { ok: true; deletedId: string; routine?: never }
  | { ok: false; error: string };

export type DbRoutineRow = {
  id: string;
  name: string;
  description: string | null;
  time_block: string;
  frequency: string | null;
  routine_time: string | null;
  remind: boolean | null;
  goal: string | null;
  goal_days: number | null;
  order: number | null;
};

export type DbRoutineLogRow = {
  routine_id: string;
  date: string;
  completed: boolean;
};

export function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function historyStartISO() {
  return todayISO(dateAgo(HIST_DAYS - 1));
}

export function isRoutineGroup(value: string | null | undefined): value is RoutineGroupId {
  return value === "morning" || value === "afternoon" || value === "evening";
}

export function isRoutineFrequency(value: string | null | undefined): value is RoutineFrequency {
  return value === "daily" || value === "weekdays" || value === "mwf";
}

export function isRoutineGoal(value: string | null | undefined): value is RoutineGoal {
  return value === "ongoing" || value === "7" || value === "21" || value === "30" || value === "custom";
}

export function cleanTime(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : "";
}

export function cleanDate(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : todayISO();
}

export function toRoutinePayload(input: RoutineMutationInput, userId: string, order?: number) {
  const name = input.label.trim();
  if (!name) throw new Error("Routine name is required.");
  if (!isRoutineGroup(input.group)) throw new Error("Choose a valid time block.");
  if (!isRoutineFrequency(input.freq)) throw new Error("Choose a valid frequency.");
  if (!isRoutineGoal(input.goal)) throw new Error("Choose a valid goal.");

  const time = cleanTime(input.time);
  const customGoalDays = Number.parseInt(input.goalDays, 10);
  const goalDays = input.goal === "custom" && Number.isInteger(customGoalDays) && customGoalDays >= 1
    ? customGoalDays
    : null;

  if (input.goal === "custom" && !goalDays) throw new Error("Custom goal must be at least 1 day.");

  return {
    user_id: userId,
    name,
    description: input.desc.trim(),
    time_block: input.group,
    frequency: input.freq,
    routine_time: time || null,
    remind: Boolean(input.remind && time),
    goal: input.goal,
    goal_days: goalDays,
    ...(typeof order === "number" ? { order } : {}),
  };
}

export function normalizeRoutine(row: DbRoutineRow, logs: Map<string, boolean>): Routine {
  const done = new Array<boolean>(HIST_DAYS).fill(false);

  for (let daysAgo = 0; daysAgo < HIST_DAYS; daysAgo++) {
    done[daysAgo] = Boolean(logs.get(`${row.id}:${todayISO(dateAgo(daysAgo))}`));
  }

  const goal = isRoutineGoal(row.goal) ? row.goal : "ongoing";

  return {
    id: row.id,
    label: row.name,
    desc: row.description || "",
    group: isRoutineGroup(row.time_block) ? row.time_block : "morning",
    freq: isRoutineFrequency(row.frequency) ? row.frequency : "daily",
    time: row.routine_time ? row.routine_time.slice(0, 5) : "",
    remind: Boolean(row.remind && row.routine_time),
    goal,
    goalDays: goal === "custom" && row.goal_days ? String(row.goal_days) : "",
    done,
  };
}
