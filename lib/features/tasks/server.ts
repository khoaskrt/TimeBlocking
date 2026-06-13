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
const TASK_PROJECT_SELECT = "id,name,area_id,status,project_kind";
const LEGACY_TASK_PROJECT_SELECT = "id,name,area_id,status";

function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const text = error.message || "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    text.includes("does not exist") ||
    text.includes("Could not find")
  );
}

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

  const result = await supabase
    .from("areas")
    .select("id,key,name,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!isMissingSchema(result.error)) {
    if (result.error) throw new Error(result.error.message);
    return normalizeAreas((result.data || []) as DbAreaRow[]);
  }

  const { data, error } = await supabase
    .from("areas")
    .select("id,key,name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return normalizeAreas((data || []) as DbAreaRow[]);
}

export const ensureTaskAreas = cache(_ensureTaskAreas);

async function getTaskSelectableProjectRows(supabase: SupabaseServerClient, userId: string) {
  const result = await supabase
    .from("projects")
    .select(TASK_PROJECT_SELECT)
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("project_kind", "project")
    .order("last_activity_at", { ascending: false });

  if (!isMissingSchema(result.error)) return result;

  return supabase
    .from("projects")
    .select(LEGACY_TASK_PROJECT_SELECT)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_activity_at", { ascending: false });
}

export async function getTasksPayload(supabase: SupabaseServerClient, userId: string) {
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const [{ data: projectRows, error: projectsError }, { data: taskRows, error: tasksError }] = await Promise.all([
    getTaskSelectableProjectRows(supabase, userId),
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (projectsError) throw new Error(projectsError.message);
  if (tasksError) throw new Error(tasksError.message);

  const projects = normalizeProjects((projectRows || []) as DbProjectRow[], areaById);
  const validProjectIds = new Set(projects.map((project) => project.id));

  return {
    areas,
    projects,
    tasks: ((taskRows || []) as DbTaskRow[]).map((row) => normalizeTask(row, areaById, validProjectIds)),
  };
}

export async function getTaskById(
  supabase: SupabaseServerClient,
  userId: string,
  taskId: string,
): Promise<ManagedTask | null> {
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const { data: projectRows, error: projectsError } = await getTaskSelectableProjectRows(supabase, userId);
  if (projectsError) throw new Error(projectsError.message);
  const validProjectIds = new Set(((projectRows || []) as DbProjectRow[]).map((project) => project.id));

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("id", taskId)
    .single();

  if (error) throw new Error(error.message);

  return data ? normalizeTask(data as DbTaskRow, areaById, validProjectIds) : null;
}
