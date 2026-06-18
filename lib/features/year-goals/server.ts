import { createClient } from "@/lib/supabase/server";
import { ensureTaskAreas } from "@/lib/features/tasks/server";
import type { Area, YearGoal } from "@/lib/types";
import {
  cleanYearGoalArea,
  normalizeYearGoal,
  type DbYearGoalRow,
} from "./data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const YEAR_GOAL_SELECT = "id,title,note,year,area_id,is_focus,order,created_at,updated_at";

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
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const { data, error } = await supabase
    .from("year_goals")
    .select(YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("year", year)
    .is("archived_at", null)
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (isMissingYearGoalsSchema(error)) return [];
  if (error) throw new Error(error.message);

  return ((data || []) as DbYearGoalRow[]).map((row) => normalizeYearGoal(row, areaById));
}

export async function getYearGoalById(
  supabase: SupabaseServerClient,
  userId: string,
  goalId: string,
): Promise<YearGoal | null> {
  const areas = await ensureTaskAreas(supabase, userId);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const { data, error } = await supabase
    .from("year_goals")
    .select(YEAR_GOAL_SELECT)
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeYearGoal(data as DbYearGoalRow, areaById) : null;
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
