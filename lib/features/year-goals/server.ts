import { createClient } from "@/lib/supabase/server";
import { ensureTaskAreas } from "@/lib/features/tasks/server";
import type { Area, TaskAreaOption, YearGoal, YearGoalProject } from "@/lib/types";
import {
  cleanYearGoalArea,
  normalizeYearGoal,
  type DbYearGoalRow,
} from "./data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const YEAR_GOAL_SELECT = "id,title,note,year,area_id,project_id,is_focus,order,created_at,updated_at";
const LEGACY_YEAR_GOAL_SELECT = "id,title,note,year,area_id,is_focus,order,created_at,updated_at";
const YEAR_GOAL_PROJECT_SELECT = "id,name,area_id,status,project_kind";
const LEGACY_YEAR_GOAL_PROJECT_SELECT = "id,name,area_id,status";

function currentYear(date = new Date()) {
  return date.getFullYear();
}

function isMissingYearGoalsSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const text = error.message || "";
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    text.includes("year_goals") ||
    text.includes("does not exist") ||
    text.includes("Could not find")
  );
}

export function yearGoalSchemaMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("project_id")) {
    return "Production database is missing year goal project links. Apply Supabase migration 013_year_goal_projects.sql.";
  }
  if (message.includes("year_goals") || message.includes("Could not find") || message.includes("does not exist")) {
    return "Production database is missing year goals support. Apply Supabase migration 012_year_goals.sql.";
  }
  return error instanceof Error ? error.message : "Could not save year goal.";
}

export async function getYearGoalsPayload(
  supabase: SupabaseServerClient,
  userId: string,
  year = currentYear(),
): Promise<YearGoal[]> {
  const [areas, projects] = await Promise.all([
    ensureTaskAreas(supabase, userId),
    getYearGoalProjectsPayload(supabase, userId),
  ]);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const result = await supabase
    .from("year_goals")
    .select(YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("year", year)
    .is("archived_at", null)
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!isMissingYearGoalsSchema(result.error)) {
    if (result.error) throw new Error(result.error.message);
    return ((result.data || []) as DbYearGoalRow[]).map((row) => normalizeYearGoal(row, areaById, projectById));
  }

  const legacyResult = await supabase
    .from("year_goals")
    .select(LEGACY_YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("year", year)
    .is("archived_at", null)
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (isMissingYearGoalsSchema(legacyResult.error)) return [];
  if (legacyResult.error) throw new Error(legacyResult.error.message);

  return ((legacyResult.data || []) as DbYearGoalRow[]).map((row) => normalizeYearGoal(row, areaById, projectById));
}

export async function getYearGoalById(
  supabase: SupabaseServerClient,
  userId: string,
  goalId: string,
): Promise<YearGoal | null> {
  const [areas, projects] = await Promise.all([
    ensureTaskAreas(supabase, userId),
    getYearGoalProjectsPayload(supabase, userId),
  ]);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const result = await supabase
    .from("year_goals")
    .select(YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  if (!isMissingYearGoalsSchema(result.error)) {
    if (result.error) throw new Error(result.error.message);
    return result.data ? normalizeYearGoal(result.data as DbYearGoalRow, areaById, projectById) : null;
  }

  const legacyResult = await supabase
    .from("year_goals")
    .select(LEGACY_YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  if (legacyResult.error) throw new Error(legacyResult.error.message);
  return legacyResult.data ? normalizeYearGoal(legacyResult.data as DbYearGoalRow, areaById, projectById) : null;
}

export async function getYearGoalAreaId(
  supabase: SupabaseServerClient,
  userId: string,
  area: Area | null | undefined,
) {
  const cleanArea = cleanYearGoalArea(area);
  if (!cleanArea) return null;

  const areas = await ensureTaskAreas(supabase, userId);
  const match = areas.find((item) => item.key === cleanArea);
  if (!match) throw new Error("Choose a valid area.");

  return match.id;
}

function normalizeYearGoalProjects(rows: { id: string; name: string; area_id: string | null; status: string }[], areaById: Map<string, TaskAreaOption>) {
  return rows
    .filter((project) => project.status === "active")
    .map((project) => ({
      id: project.id,
      name: project.name,
      area: (project.area_id ? areaById.get(project.area_id)?.key : undefined) || ("work" as Area),
    }));
}

async function getProjectRows(supabase: SupabaseServerClient, userId: string) {
  const result = await supabase
    .from("projects")
    .select(YEAR_GOAL_PROJECT_SELECT)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_activity_at", { ascending: false });

  if (!isMissingYearGoalsSchema(result.error)) return result;

  return supabase
    .from("projects")
    .select(LEGACY_YEAR_GOAL_PROJECT_SELECT)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_activity_at", { ascending: false });
}

export async function getYearGoalProjectsPayload(supabase: SupabaseServerClient, userId: string): Promise<YearGoalProject[]> {
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const { data, error } = await getProjectRows(supabase, userId);

  if (error) throw new Error(error.message);
  return normalizeYearGoalProjects((data || []) as { id: string; name: string; area_id: string | null; status: string }[], areaById);
}

export async function getYearGoalProjectId(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string | null | undefined,
) {
  const cleanProjectId = projectId?.trim();
  if (!cleanProjectId) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("id", cleanProjectId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Choose an active project.");

  return cleanProjectId;
}

export async function nextYearGoalOrder(supabase: SupabaseServerClient, userId: string, year = currentYear()) {
  const { data, error } = await supabase
    .from("year_goals")
    .select("order")
    .eq("user_id", userId)
    .eq("year", year)
    .is("archived_at", null)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.order || 0) + 1;
}

export async function activeYearGoalCount(supabase: SupabaseServerClient, userId: string, year = currentYear()) {
  const { count, error } = await supabase
    .from("year_goals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("year", year)
    .is("archived_at", null);

  if (error) throw new Error(error.message);
  return count || 0;
}

export function getCurrentYear() {
  return currentYear();
}
