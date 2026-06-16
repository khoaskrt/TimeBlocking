import { AREA_META } from "@/lib/constants/areas";
import type { Area, ManagedTask, TaskAreaOption, TaskProject } from "@/lib/types";

export const DEFAULT_TASK_AREAS: { key: Area; name: string; color: string }[] = [
  { key: "work", name: AREA_META.work.label, color: "blue" },
  { key: "personal", name: AREA_META.personal.label, color: "green" },
  { key: "family", name: AREA_META.family.label, color: "purple" },
  { key: "health", name: AREA_META.health.label, color: "orange" },
];

export const TASK_REPEATS = ["", "Daily", "Weekly", "Monthly", "Yearly"];
export const TASK_REMINDERS = ["No reminder", "At due time", "10 minutes before", "1 hour before", "1 day before"];
export const TASK_PRIORITIES = [
  { value: 1, label: "1 · Urgent" },
  { value: 2, label: "2 · High" },
  { value: 3, label: "3 · Medium" },
  { value: 4, label: "4 · Low (default)" },
];

export type TaskDraft = Omit<ManagedTask, "id"> & { id?: string };

export type TaskMutationInput = {
  id?: string;
  title: string;
  notes: string;
  area: Area;
  project: string | null;
  due: string;
  time: string;
  repeat: string;
  priority: number;
  done: boolean;
  top3?: boolean;
  reminder?: string;
  note?: string;
};

export type DbTaskRow = {
  id: string;
  title: string;
  notes: string | null;
  area_id: string | null;
  project_id: string | null;
  due_date: string | null;
  due_time: string | null;
  repeat: string | null;
  reminder: string | null;
  note_id: string | null;
  priority: number | string | null;
  status: string;
  pinned_top3: boolean;
  created_at: string;
  completed_at?: string | null;
};

export type DbAreaRow = {
  id: string;
  key: string | null;
  name: string;
  status?: string | null;
};

export type DbProjectRow = {
  id: string;
  name: string;
  area_id: string | null;
  status?: string | null;
  project_kind?: string | null;
};

export type TaskActionResult =
  | { ok: true; task: ManagedTask; deletedId?: never }
  | { ok: true; deletedId: string; task?: never }
  | { ok: false; error: string };

export function isArea(value: string | null | undefined): value is Area {
  return value === "work" || value === "personal" || value === "family" || value === "health";
}

export function normalizeAreas(rows: DbAreaRow[]): TaskAreaOption[] {
  return rows
    .map((row) => {
      if (row.status && row.status !== "active") return null;
      const nameKey = row.name.toLowerCase();
      const key = isArea(row.key) ? row.key : isArea(nameKey) ? nameKey : null;
      return key ? { id: row.id, key, name: row.name || AREA_META[key].label } : null;
    })
    .filter((area): area is TaskAreaOption => Boolean(area));
}

export function normalizeProjects(rows: DbProjectRow[], areaById: Map<string, TaskAreaOption>): TaskProject[] {
  return rows.map((row) => {
    const area = row.area_id ? areaById.get(row.area_id)?.key : undefined;

    return {
      id: row.id,
      name: row.name,
      area: area || "work",
      areaId: row.area_id,
    };
  });
}

export function normalizeTask(row: DbTaskRow, areaById: Map<string, TaskAreaOption>, validProjectIds?: Set<string>): ManagedTask {
  const area = row.area_id ? areaById.get(row.area_id)?.key : undefined;
  const dueTime = row.due_time ? row.due_time.slice(0, 5) : "";
  const project = row.project_id && (!validProjectIds || validProjectIds.has(row.project_id)) ? row.project_id : null;

  return {
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    area: area || "work",
    project,
    due: row.due_date || "",
    time: dueTime,
    repeat: row.repeat || "",
    priority: Number(row.priority) || 4,
    done: row.status === "done",
    top3: row.pinned_top3,
    reminder: row.reminder || undefined,
    note: row.note_id || undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at || null,
  };
}

export function newTaskDraft(defaultArea: Area = "work"): Omit<ManagedTask, "id"> {
  return {
    title: "",
    notes: "",
    area: defaultArea,
    project: null,
    due: new Date().toISOString().slice(0, 10),
    time: "",
    repeat: "",
    priority: 4,
    done: false,
  };
}
