import type { Area, TaskAreaOption, YearGoal, YearGoalProject } from "@/lib/types";
import { isArea } from "@/lib/features/tasks/data";

export const YEAR_GOAL_TITLE_MAX = 120;
export const YEAR_GOAL_NOTE_MAX = 180;
export const YEAR_GOAL_ACTIVE_MAX = 5;

export type DbYearGoalRow = {
  id: string;
  title: string;
  note: string | null;
  year: number;
  area_id: string | null;
  project_id?: string | null;
  is_focus: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type YearGoalMutationInput = {
  id?: string;
  title: string;
  note?: string | null;
  area?: Area | null;
  projectId?: string | null;
  project?: YearGoalProject | null;
  isFocus?: boolean;
};

export type YearGoalActionResult =
  | { ok: true; goal: YearGoal; deletedId?: never; goals?: never }
  | { ok: true; deletedId: string; goal?: never; goals?: never }
  | { ok: true; goals: YearGoal[]; goal?: never; deletedId?: never }
  | { ok: false; error: string };

export function cleanYearGoalTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  if (!title) throw new Error("Goal title is required.");
  if (title.length > YEAR_GOAL_TITLE_MAX) throw new Error(`Goal title must be ${YEAR_GOAL_TITLE_MAX} characters or fewer.`);
  return title;
}

export function cleanYearGoalNote(value: string | null | undefined) {
  const note = value?.trim().replace(/\s+/g, " ") || "";
  if (note.length > YEAR_GOAL_NOTE_MAX) throw new Error(`Goal note must be ${YEAR_GOAL_NOTE_MAX} characters or fewer.`);
  return note || null;
}

export function cleanYearGoalArea(value: string | null | undefined) {
  if (!value) return null;
  if (!isArea(value)) throw new Error("Choose a valid area.");
  return value;
}

export function normalizeYearGoal(
  row: DbYearGoalRow,
  areaById: Map<string, TaskAreaOption>,
  projectById = new Map<string, YearGoalProject>(),
): YearGoal {
  const project = row.project_id ? projectById.get(row.project_id) || null : null;
  const area = row.area_id ? areaById.get(row.area_id)?.key : null;

  return {
    id: row.id,
    title: row.title,
    note: row.note || "",
    year: Number(row.year),
    area: project?.area || area || null,
    project,
    isFocus: row.is_focus,
    order: Number(row.order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
