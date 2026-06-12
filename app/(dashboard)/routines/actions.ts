"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRoutineById } from "@/lib/features/routines/server";
import {
  cleanDate,
  cleanTime,
  isRoutineGroup,
  toRoutinePayload,
  type RoutineActionResult,
  type RoutineMutationInput,
} from "@/lib/features/routines/data";

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };

  return { supabase, user };
}

function revalidateRoutineViews() {
  revalidatePath("/routines");
  revalidatePath("/today");
}

async function ensureRoutineOwned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  routineId: string,
) {
  const { data, error } = await supabase
    .from("routines")
    .select("id")
    .eq("user_id", userId)
    .eq("id", routineId)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Routine was not found.");
}

async function nextRoutineOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  group: string,
) {
  if (!isRoutineGroup(group)) return 0;

  const { data, error } = await supabase
    .from("routines")
    .select("order")
    .eq("user_id", userId)
    .eq("active", true)
    .eq("time_block", group)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.order || 0) + 1;
}

export async function createRoutine(input: RoutineMutationInput): Promise<RoutineActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to create routines." };

  try {
    const order = await nextRoutineOrder(supabase, user.id, input.group);
    const payload = toRoutinePayload(input, user.id, order);
    const { data, error } = await supabase.from("routines").insert(payload).select("id").single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Routine was not created.");

    const routine = await getRoutineById(supabase, user.id, data.id);
    if (!routine) throw new Error("Routine was created but could not be loaded.");

    revalidateRoutineViews();
    return { ok: true, routine };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create routine." };
  }
}

export async function updateRoutine(input: RoutineMutationInput): Promise<RoutineActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update routines." };
  if (!input.id) return { ok: false, error: "Missing routine id." };

  try {
    await ensureRoutineOwned(supabase, user.id, input.id);
    const payload = toRoutinePayload(input, user.id);
    const { error } = await supabase.from("routines").update(payload).eq("user_id", user.id).eq("id", input.id);

    if (error) throw new Error(error.message);

    const routine = await getRoutineById(supabase, user.id, input.id);
    if (!routine) throw new Error("Routine was updated but could not be loaded.");

    revalidateRoutineViews();
    return { ok: true, routine };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update routine." };
  }
}

export async function renameRoutine(routineId: string, label: string): Promise<RoutineActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update routines." };

  try {
    const name = label.trim();
    if (!name) throw new Error("Routine name is required.");

    await ensureRoutineOwned(supabase, user.id, routineId);
    const { error } = await supabase.from("routines").update({ name }).eq("user_id", user.id).eq("id", routineId);

    if (error) throw new Error(error.message);

    const routine = await getRoutineById(supabase, user.id, routineId);
    if (!routine) throw new Error("Routine was updated but could not be loaded.");

    revalidateRoutineViews();
    return { ok: true, routine };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not rename routine." };
  }
}

export async function deleteRoutine(routineId: string): Promise<RoutineActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to delete routines." };

  try {
    await ensureRoutineOwned(supabase, user.id, routineId);
    const { error } = await supabase
      .from("routines")
      .update({ active: false })
      .eq("user_id", user.id)
      .eq("id", routineId);

    if (error) throw new Error(error.message);

    revalidateRoutineViews();
    return { ok: true, deletedId: routineId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete routine." };
  }
}

export async function toggleRoutineLog(
  routineId: string,
  date: string,
  completed: boolean,
): Promise<RoutineActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update routines." };

  try {
    await ensureRoutineOwned(supabase, user.id, routineId);
    const cleanLogDate = cleanDate(date);
    const { error } = await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        routine_id: routineId,
        date: cleanLogDate,
        completed,
      },
      { onConflict: "routine_id,date" },
    );

    if (error) throw new Error(error.message);

    const routine = await getRoutineById(supabase, user.id, routineId);
    if (!routine) throw new Error("Routine was updated but could not be loaded.");

    revalidateRoutineViews();
    return { ok: true, routine };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update routine." };
  }
}

export async function quickCreateRoutine(group: string, label: string): Promise<RoutineActionResult> {
  return createRoutine({
    label,
    desc: "",
    group: isRoutineGroup(group) ? group : "morning",
    freq: "daily",
    time: cleanTime(""),
    remind: false,
    goal: "ongoing",
    goalDays: "",
  });
}
