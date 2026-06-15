import { createClient } from "@/lib/supabase/server";
import { GROUP_ORDER, HIST_DAYS } from "@/lib/features/routines/constants";
import { dateAgo, isScheduled, routineStreak } from "@/lib/features/routines/derive";
import {
  historyStartISO,
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
import { getProjectsPayload } from "@/lib/features/projects/server";
import { retainerCycleHours } from "@/lib/features/projects/data";
import type { Area, ManagedTask, RoutineItem, StaleProject, Task, TaskProject, TodayMonthlyService } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
const PROJECT_SLIPPING_DAYS = 7;
const RETAINER_SLIPPING_DAYS = 5;
const MAX_SLIPPING_PROJECTS = 3;

type SlippingProjectRow = {
  id: string;
  name: string;
  area_id: string | null;
  last_activity_at: string;
  end_date?: string | null;
  project_kind?: "project" | "retainer" | null;
};

type SlippingTaskRow = {
  project_id: string | null;
};

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

function daysSince(value: string, now = new Date()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((now.getTime() - time) / 86_400_000));
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

async function getTodayRoutinesPayload(supabase: SupabaseServerClient, userId: string) {
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
      .gte("date", historyStartISO()),
  ]);

  if (routinesError) throw new Error(routinesError.message);
  if (logsError) throw new Error(logsError.message);

  const completedLogs = new Map<string, boolean>();
  ((logRows || []) as DbRoutineLogRow[]).forEach((row) => {
    completedLogs.set(`${row.routine_id}:${row.date}`, row.completed);
  });

  const routines: Record<string, RoutineItem[]> = Object.fromEntries(GROUP_ORDER.map((group) => [group, []]));

  ((routineRows || []) as Pick<DbRoutineRow, "id" | "name" | "time_block" | "frequency">[]).forEach((routine) => {
    const freq = isRoutineFrequency(routine.frequency) ? routine.frequency : "daily";
    if (!isScheduled(freq, 0)) return;

    const done = new Array<boolean>(HIST_DAYS).fill(false);
    for (let k = 0; k < HIST_DAYS; k++) {
      done[k] = Boolean(completedLogs.get(`${routine.id}:${todayISO(dateAgo(k))}`));
    }

    const group = isRoutineGroup(routine.time_block) ? routine.time_block : "morning";
    routines[group].push({
      id: routine.id,
      label: routine.name,
      done: done[0],
      streak: routineStreak({ done, freq } as import("@/lib/types").Routine),
    });
  });

  return routines;
}

async function getTodayMonthlyServicesPayload(supabase: SupabaseServerClient, userId: string): Promise<TodayMonthlyService[]> {
  const payload = await getProjectsPayload(supabase, userId);

  return payload.entries
    .filter((entry) => entry.type === "project" && entry.engagement === "retainer" && entry.status === "active")
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      area: entry.area,
      doneItems: entry.checklist.filter((item) => item.done).length,
      totalItems: entry.checklist.length,
      loggedHours: retainerCycleHours(entry),
      monthlyHours: entry.monthly || 0,
      month: entry.currentCycle?.label || "Current month",
    }));
}

async function getSlippingProjectRows(supabase: SupabaseServerClient, userId: string) {
  const result = await supabase
    .from("projects")
    .select("id,name,area_id,last_activity_at,end_date,project_kind")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_activity_at", { ascending: true });

  if (!isMissingSchema(result.error)) return result;

  return supabase
    .from("projects")
    .select("id,name,area_id,last_activity_at,end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_activity_at", { ascending: true });
}

async function getTodaySlippingProjectsPayload(supabase: SupabaseServerClient, userId: string): Promise<StaleProject[]> {
  const [areas, { data: projectRows, error: projectsError }] = await Promise.all([
    ensureTaskAreas(supabase, userId),
    getSlippingProjectRows(supabase, userId),
  ]);

  if (projectsError) throw new Error(projectsError.message);

  const rows = (projectRows || []) as SlippingProjectRow[];
  const projectIds = rows.map((project) => project.id);
  const openTaskCounts = new Map<string, number>();

  if (projectIds.length) {
    const { data: taskRows, error: tasksError } = await supabase
      .from("tasks")
      .select("project_id")
      .eq("user_id", userId)
      .eq("status", "todo")
      .in("project_id", projectIds);

    if (tasksError) throw new Error(tasksError.message);

    ((taskRows || []) as SlippingTaskRow[]).forEach((task) => {
      if (!task.project_id) return;
      openTaskCounts.set(task.project_id, (openTaskCounts.get(task.project_id) || 0) + 1);
    });
  }

  const areaById = new Map(areas.map((area) => [area.id, area.key]));

  return rows
    .flatMap((project) => {
      const kind = project.project_kind === "retainer" ? "retainer" : "project";
      const threshold = kind === "retainer" ? RETAINER_SLIPPING_DAYS : PROJECT_SLIPPING_DAYS;
      const daysAgo = daysSince(project.last_activity_at);
      if (daysAgo < threshold) return [];

      const staleProject: StaleProject = {
        id: project.id,
        name: project.name,
        area: (project.area_id ? areaById.get(project.area_id) : undefined) || ("work" as Area),
        daysAgo,
        kind,
        openTasks: openTaskCounts.get(project.id) || 0,
        reason: "quiet" as const,
        target: project.end_date || null,
        lastActivityAt: project.last_activity_at,
      };

      return [staleProject];
    })
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .slice(0, MAX_SLIPPING_PROJECTS);
}

export async function getTodayPayload(supabase: SupabaseServerClient, userId: string) {
  const today = todayISO();
  const [{ tasks, projects }, routines, monthlyServices, staleProjects] = await Promise.all([
    getTodayTasksPayload(supabase, userId, today),
    getTodayRoutinesPayload(supabase, userId),
    getTodayMonthlyServicesPayload(supabase, userId),
    getTodaySlippingProjectsPayload(supabase, userId),
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return {
    dateLabel: formatTodayLabel(),
    tasks: tasks.map((task) => toTodayTask(task, projectById)),
    routines,
    monthlyServices,
    staleProjects,
  };
}
