import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ManagedTask } from "@/lib/types";
import {
  DEFAULT_TASK_AREAS,
  normalizeAreas,
  normalizeProjects,
  normalizeTask,
  type DbAreaRow,
  type DbProjectRow,
  type DbTaskRow,
} from "./data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const TASK_SELECT =
  "id,title,notes,area_id,project_id,due_date,due_time,repeat,reminder,note_id,priority,status,pinned_top3,created_at";

async function _ensureTaskAreas(supabase: SupabaseServerClient, userId: string) {
  const { error: upsertError } = await supabase.from("areas").upsert(
    DEFAULT_TASK_AREAS.map((area) => ({
      user_id: userId,
      key: area.key,
      name: area.name,
      color: area.color,
    })),
    { onConflict: "user_id,key" },
  );

  if (upsertError) throw new Error(upsertError.message);

  const { data, error } = await supabase
    .from("areas")
    .select("id,key,name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return normalizeAreas((data || []) as DbAreaRow[]);
}

export const ensureTaskAreas = cache(_ensureTaskAreas);

export async function getTasksPayload(supabase: SupabaseServerClient, userId: string) {
  const [areas, { data: projectRows, error: projectsError }, { data: taskRows, error: tasksError }] = await Promise.all([
    ensureTaskAreas(supabase, userId),
    supabase
      .from("projects")
      .select("id,name,area_id")
      .eq("user_id", userId)
      .order("last_activity_at", { ascending: false }),
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (projectsError) throw new Error(projectsError.message);
  if (tasksError) throw new Error(tasksError.message);

  const areaById = new Map(areas.map((area) => [area.id, area]));

  return {
    areas,
    projects: normalizeProjects((projectRows || []) as DbProjectRow[], areaById),
    tasks: ((taskRows || []) as DbTaskRow[]).map((row) => normalizeTask(row, areaById)),
  };
}

export async function getTaskById(
  supabase: SupabaseServerClient,
  userId: string,
  taskId: string,
): Promise<ManagedTask | null> {
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("id", taskId)
    .single();

  if (error) throw new Error(error.message);

  return data ? normalizeTask(data as DbTaskRow, areaById) : null;
}
