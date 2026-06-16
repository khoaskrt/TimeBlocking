import { createClient } from "@/lib/supabase/server";
import { historyStartISO, normalizeRoutine, type DbRoutineLogRow, type DbRoutineRow } from "./data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ROUTINE_SELECT = "id,name,description,time_block,frequency,recurrence,routine_time,remind,goal,goal_days,order,created_at";

export async function getRoutinesPayload(supabase: SupabaseServerClient, userId: string) {
  const [{ data: routineRows, error: routinesError }, { data: logRows, error: logsError }] = await Promise.all([
    supabase
      .from("routines")
      .select(ROUTINE_SELECT)
      .eq("user_id", userId)
      .eq("active", true)
      .order("time_block", { ascending: true })
      .order("order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("routine_logs")
      .select("routine_id,date,completed")
      .eq("user_id", userId)
      .gte("date", historyStartISO()),
  ]);

  if (routinesError) throw new Error(routinesError.message);
  if (logsError) throw new Error(logsError.message);

  const completedLogs = new Map<string, boolean>();
  ((logRows || []) as DbRoutineLogRow[]).forEach((row) => {
    completedLogs.set(`${row.routine_id}:${row.date}`, row.completed);
  });

  return ((routineRows || []) as DbRoutineRow[]).map((row) => normalizeRoutine(row, completedLogs));
}

export async function getRoutineById(
  supabase: SupabaseServerClient,
  userId: string,
  routineId: string,
) {
  const [{ data: routineRow, error: routineError }, { data: logRows, error: logsError }] = await Promise.all([
    supabase
      .from("routines")
      .select(ROUTINE_SELECT)
      .eq("user_id", userId)
      .eq("id", routineId)
      .eq("active", true)
      .single(),
    supabase
      .from("routine_logs")
      .select("routine_id,date,completed")
      .eq("user_id", userId)
      .eq("routine_id", routineId)
      .gte("date", historyStartISO()),
  ]);

  if (routineError) throw new Error(routineError.message);
  if (logsError) throw new Error(logsError.message);

  const completedLogs = new Map<string, boolean>();
  ((logRows || []) as DbRoutineLogRow[]).forEach((row) => {
    completedLogs.set(`${row.routine_id}:${row.date}`, row.completed);
  });

  return routineRow ? normalizeRoutine(routineRow as DbRoutineRow, completedLogs) : null;
}
