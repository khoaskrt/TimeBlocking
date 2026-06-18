"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  activeYearGoalCount,
  getCurrentYear,
  getYearGoalAreaId,
  getYearGoalById,
  getYearGoalProjectId,
  getYearGoalsPayload,
  nextYearGoalOrder,
  yearGoalSchemaMessage,
} from "@/lib/features/year-goals/server";
import {
  cleanYearGoalNote,
  cleanYearGoalTitle,
  YEAR_GOAL_ACTIVE_MAX,
  type YearGoalActionResult,
  type YearGoalMutationInput,
} from "@/lib/features/year-goals/data";

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };

  return { supabase, user };
}

function revalidateToday() {
  revalidatePath("/today");
}

export async function createYearGoal(input: YearGoalMutationInput): Promise<YearGoalActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to create year goals." };

  try {
    const year = getCurrentYear();
    const count = await activeYearGoalCount(supabase, user.id, year);
    if (count >= YEAR_GOAL_ACTIVE_MAX) throw new Error(`Keep this list to ${YEAR_GOAL_ACTIVE_MAX} active goals.`);

    const payload = {
      user_id: user.id,
      title: cleanYearGoalTitle(input.title),
      note: cleanYearGoalNote(input.note),
      year,
      area_id: await getYearGoalAreaId(supabase, user.id, input.area),
      project_id: await getYearGoalProjectId(supabase, user.id, input.projectId),
      is_focus: Boolean(input.isFocus),
      order: await nextYearGoalOrder(supabase, user.id, year),
    };

    const { data, error } = await supabase.from("year_goals").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Year goal was not created.");

    const goal = await getYearGoalById(supabase, user.id, data.id);
    if (!goal) throw new Error("Year goal was created but could not be loaded.");

    revalidateToday();
    return { ok: true, goal };
  } catch (error) {
    return { ok: false, error: yearGoalSchemaMessage(error) };
  }
}

export async function updateYearGoal(input: YearGoalMutationInput): Promise<YearGoalActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update year goals." };
  if (!input.id) return { ok: false, error: "Missing year goal id." };

  try {
    const payload = {
      title: cleanYearGoalTitle(input.title),
      note: cleanYearGoalNote(input.note),
      area_id: await getYearGoalAreaId(supabase, user.id, input.area),
      project_id: await getYearGoalProjectId(supabase, user.id, input.projectId),
      is_focus: Boolean(input.isFocus),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("year_goals")
      .update(payload)
      .eq("user_id", user.id)
      .eq("id", input.id)
      .is("archived_at", null);

    if (error) throw new Error(error.message);

    const goal = await getYearGoalById(supabase, user.id, input.id);
    if (!goal) throw new Error("Year goal was updated but could not be loaded.");

    revalidateToday();
    return { ok: true, goal };
  } catch (error) {
    return { ok: false, error: yearGoalSchemaMessage(error) };
  }
}

export async function archiveYearGoal(goalId: string): Promise<YearGoalActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to archive year goals." };

  try {
    const { error } = await supabase
      .from("year_goals")
      .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("id", goalId)
      .is("archived_at", null);

    if (error) throw new Error(error.message);

    revalidateToday();
    return { ok: true, deletedId: goalId };
  } catch (error) {
    return { ok: false, error: yearGoalSchemaMessage(error) };
  }
}

export async function setYearGoalFocus(goalId: string, isFocus: boolean): Promise<YearGoalActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update year goals." };

  try {
    const { error } = await supabase
      .from("year_goals")
      .update({ is_focus: isFocus, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("id", goalId)
      .is("archived_at", null);

    if (error) throw new Error(error.message);

    const goal = await getYearGoalById(supabase, user.id, goalId);
    if (!goal) throw new Error("Year goal was updated but could not be loaded.");

    revalidateToday();
    return { ok: true, goal };
  } catch (error) {
    return { ok: false, error: yearGoalSchemaMessage(error) };
  }
}

export async function reorderYearGoals(goalIds: string[]): Promise<YearGoalActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to reorder year goals." };

  try {
    const cleanIds = goalIds.filter((id) => !id.startsWith("temp-"));
    const results = await Promise.all(
      cleanIds.map((goalId, index) =>
        supabase
          .from("year_goals")
          .update({ order: index + 1, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("id", goalId)
          .is("archived_at", null),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);

    const goals = await getYearGoalsPayload(supabase, user.id);
    revalidateToday();
    return { ok: true, goals };
  } catch (error) {
    return { ok: false, error: yearGoalSchemaMessage(error) };
  }
}
