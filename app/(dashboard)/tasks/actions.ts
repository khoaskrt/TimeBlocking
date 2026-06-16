"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTaskById, ensureTaskAreas } from "@/lib/features/tasks/server";
import { isArea, type TaskActionResult, type TaskMutationInput } from "@/lib/features/tasks/data";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanPriority(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 4) return value;
  return 4;
}

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };

  return { supabase, user };
}

async function getAreaId(input: TaskMutationInput, supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  if (!isArea(input.area)) throw new Error("Choose a valid area.");

  const areas = await ensureTaskAreas(supabase, userId);
  const area = areas.find((item) => item.key === input.area);
  if (!area) throw new Error("Choose a valid area.");

  return area.id;
}

async function getProjectId(input: TaskMutationInput, supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const projectId = asNullable(input.project);
  if (!projectId) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("id", projectId)
    .eq("status", "active")
    .eq("project_kind", "project")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Choose an active project.");

  return projectId;
}

async function toTaskPayload(input: TaskMutationInput, supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");

  const note = asNullable(input.note);

  return {
    user_id: userId,
    title,
    notes: input.notes || "",
    due_date: asNullable(input.due),
    due_time: asNullable(input.time),
    area_id: await getAreaId(input, supabase, userId),
    project_id: await getProjectId(input, supabase, userId),
    status: input.done ? "done" : "todo",
    priority: cleanPriority(input.priority),
    pinned_top3: Boolean(input.top3),
    repeat: input.repeat || "",
    reminder: input.reminder === "No reminder" ? null : asNullable(input.reminder),
    note_id: note && UUID_PATTERN.test(note) ? note : null,
    completed_at: input.done ? new Date().toISOString() : null,
  };
}

export async function createTask(input: TaskMutationInput): Promise<TaskActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to create tasks." };

  try {
    const payload = await toTaskPayload(input, supabase, user.id);
    const { data, error } = await supabase.from("tasks").insert(payload).select("id").single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Task was not created.");

    const task = await getTaskById(supabase, user.id, data.id);
    if (!task) throw new Error("Task was created but could not be loaded.");

    revalidatePath("/tasks");
    revalidatePath("/today");
    revalidatePath("/projects");
    return { ok: true, task };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create task." };
  }
}

export async function updateTask(input: TaskMutationInput): Promise<TaskActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update tasks." };
  if (!input.id) return { ok: false, error: "Missing task id." };

  try {
    const payload = await toTaskPayload(input, supabase, user.id);
    const { error } = await supabase.from("tasks").update(payload).eq("user_id", user.id).eq("id", input.id);

    if (error) throw new Error(error.message);

    const task = await getTaskById(supabase, user.id, input.id);
    if (!task) throw new Error("Task was updated but could not be loaded.");

    revalidatePath("/tasks");
    revalidatePath("/today");
    revalidatePath("/projects");
    return { ok: true, task };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update task." };
  }
}

export async function toggleTaskStatus(taskId: string, done: boolean): Promise<TaskActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update tasks." };

  try {
    const { error } = await supabase
      .from("tasks")
      .update({ status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null })
      .eq("user_id", user.id)
      .eq("id", taskId);

    if (error) throw new Error(error.message);

    const task = await getTaskById(supabase, user.id, taskId);
    if (!task) throw new Error("Task was updated but could not be loaded.");

    revalidatePath("/tasks");
    revalidatePath("/today");
    revalidatePath("/projects");
    return { ok: true, task };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update task." };
  }
}

export async function setTaskTop3(taskId: string, top3: boolean): Promise<TaskActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update tasks." };

  try {
    const { error } = await supabase
      .from("tasks")
      .update({ pinned_top3: top3 })
      .eq("user_id", user.id)
      .eq("id", taskId);

    if (error) throw new Error(error.message);

    const task = await getTaskById(supabase, user.id, taskId);
    if (!task) throw new Error("Task was updated but could not be loaded.");

    revalidatePath("/tasks");
    revalidatePath("/today");
    revalidatePath("/projects");
    return { ok: true, task };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update task." };
  }
}

export async function deleteTask(taskId: string): Promise<TaskActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to delete tasks." };

  try {
    const { error } = await supabase.from("tasks").delete().eq("user_id", user.id).eq("id", taskId);
    if (error) throw new Error(error.message);

    revalidatePath("/tasks");
    revalidatePath("/today");
    revalidatePath("/projects");
    return { ok: true, deletedId: taskId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete task." };
  }
}
