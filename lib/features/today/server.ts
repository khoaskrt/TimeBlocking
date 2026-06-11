import { createClient } from "@/lib/supabase/server";
import { getTasksPayload } from "@/lib/features/tasks/server";
import type { ManagedTask, Task, TaskProject } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

export async function getTodayPayload(supabase: SupabaseServerClient, userId: string) {
  const { tasks, projects } = await getTasksPayload(supabase, userId);
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return {
    dateLabel: formatTodayLabel(),
    tasks: tasks.map((task) => toTodayTask(task, projectById)),
  };
}
