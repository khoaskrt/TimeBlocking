import { createClient } from "@/lib/supabase/server";
import { GROUP_ORDER } from "@/lib/features/routines/constants";
import { isScheduled } from "@/lib/features/routines/derive";
import {
  isRoutineFrequency,
  isRoutineGroup,
  type DbRoutineLogRow,
  type DbRoutineRow,
} from "@/lib/features/routines/data";
import {
  ensureTaskAreas,
  TASK_SELECT,
} from "@/lib/features/tasks/server";
import {
  normalizeProjects,
  normalizeTask,
  type DbProjectRow,
  type DbTaskRow,
} from "@/lib/features/tasks/data";
import type { ManagedTask, RoutineItem, Task, TaskProject } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dueFlag(due: string, today: string) {
  if (due === today) return "due today";
  if (due < today) {
    const days = Math.round((Date.parse(today) - Date.parse(due)) / 86_400_000);
    return `overdue ${days}d`;
  }
  return undefined;
}

export function toTodayTask(task: ManagedTask, projectById: Map<string, TaskProject>): Task {
  const today = todayISO();
  const isToday = Boolean(task.due && task.due <= today);

  return {
    id: task.id,
    title: task.title,
    area: task.area,
    due: task.time || null,
    today: isToday,
    top3: task.top3,
    done: task.done,
    project: task.project ? projectById.get(task.project)?.name : undefined,
    flag: task.due && !task.done ? dueFlag(task.due, today) : undefined,
    recur: task.repeat ? task.repeat.toLowerCase() : undefined,
  };
}

export function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

async function getTodayTasksPayload(supabase: SupabaseServerClient, userId: string, today: string) {
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
      .or(`status.eq.todo,pinned_top3.eq.true,due_date.lte.${today}`)
      .order("created_at", { ascending: false }),
  ]);

  if (projectsError) throw new Error(projectsError.message);
  if (tasksError) throw new Error(tasksError.message);

  const areaById = new Map(areas.map((area) => [area.id, area]));

  return {
    projects: normalizeProjects((projectRows || []) as DbProjectRow[], areaById),
    tasks: ((taskRows || []) as DbTaskRow[]).map((row) => normalizeTask(row, areaById)),
  };
}

async function getTodayRoutinesPayload(supabase: SupabaseServerClient, userId: string, today: string) {
  const [{ data: routineRows, error: routinesError }, { data: logRows, error: logsError }] = await Promise.all([
    supabase
      .from("routines")
      .select("id,name,time_block,frequency")
      .eq("user_id", userId)
      .eq("active", true)
      .order("time_block", { ascending: true })
      .order("order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("routine_logs")
      .select("routine_id,date,completed")
      .eq("user_id", userId)
      .eq("date", today),
  ]);

  if (routinesError) throw new Error(routinesError.message);
  if (logsError) throw new Error(logsError.message);

  const completedLogs = new Map<string, boolean>();
  ((logRows || []) as DbRoutineLogRow[]).forEach((row) => {
    completedLogs.set(row.routine_id, row.completed);
  });

  const routines: Record<string, RoutineItem[]> = Object.fromEntries(GROUP_ORDER.map((group) => [group, []]));

  ((routineRows || []) as Pick<DbRoutineRow, "id" | "name" | "time_block" | "frequency">[]).forEach((routine) => {
    const freq = isRoutineFrequency(routine.frequency) ? routine.frequency : "daily";
    if (!isScheduled(freq, 0)) return;

    const group = isRoutineGroup(routine.time_block) ? routine.time_block : "morning";
    routines[group].push({
      id: routine.id,
      label: routine.name,
      done: Boolean(completedLogs.get(routine.id)),
    });
  });

  return routines;
}

export async function getTodayPayload(supabase: SupabaseServerClient, userId: string) {
  const today = todayISO();
  const [{ tasks, projects }, routines] = await Promise.all([
    getTodayTasksPayload(supabase, userId, today),
    getTodayRoutinesPayload(supabase, userId, today),
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return {
    dateLabel: formatTodayLabel(),
    tasks: tasks.map((task) => toTodayTask(task, projectById)),
    routines,
  };
}
