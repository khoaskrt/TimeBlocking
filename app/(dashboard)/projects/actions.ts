"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  PROJECT_COLORS,
  retainerMonthWindow,
  type CreateChecklistItemInput,
  type CreateMilestoneInput,
  type CreateProjectInput,
  type CreateProjectTaskInput,
  type CreateTemplateInput,
  type CreateTemplateItemInput,
  type DeleteChecklistItemInput,
  type DeleteEntryInput,
  type DeleteMilestoneInput,
  type DeleteTemplateInput,
  type DeleteTemplateItemInput,
  type LoadTemplateInput,
  type LogProjectActivityInput,
  type ProjectActionResult,
  type ToggleProjectTaskInput,
  type UpdateChecklistItemInput,
  type UpdateEntryStatusInput,
  type UpdateMilestoneInput,
  type UpdateProjectColorInput,
} from "@/lib/features/projects/data";
import { ensureTaskAreas } from "@/lib/features/tasks/server";
import { getProjectEntryById, getProjectsPayload, getProjectTemplateById } from "@/lib/features/projects/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function asNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanPositiveNumber(value: string | number | null | undefined, fallback?: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return fallback;
}

function cleanWeight(value: number) {
  if (Number.isFinite(value) && value >= 1) return Math.round(value);
  return 10;
}

function revalidateProjectViews(includeTasks = false) {
  revalidatePath("/projects");
  if (includeTasks) {
    revalidatePath("/tasks");
    revalidatePath("/today");
  }
}

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };
  return { supabase, user };
}

async function ensureProjectOwned(supabase: SupabaseServerClient, userId: string, projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id,area_id,project_kind")
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project was not found.");
  return data as { id: string; area_id: string | null; project_kind?: string | null };
}

async function ensureAreaOwned(supabase: SupabaseServerClient, userId: string, areaId: string) {
  const { data, error } = await supabase
    .from("areas")
    .select("id")
    .eq("user_id", userId)
    .eq("id", areaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Area was not found.");
}

async function nextOrder(
  supabase: SupabaseServerClient,
  table: "project_milestones" | "project_checklist_items",
  userId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("order")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.order || 0) + 1;
}

async function nextTemplateItemOrder(supabase: SupabaseServerClient, templateId: string) {
  const { data, error } = await supabase
    .from("project_checklist_template_items")
    .select("order")
    .eq("template_id", templateId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.order || 0) + 1;
}

async function touchProject(supabase: SupabaseServerClient, userId: string, projectId: string) {
  const { error } = await supabase
    .from("projects")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const text = error.message || "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    text.includes("does not exist") ||
    text.includes("Could not find")
  );
}

async function ensureCurrentRetainerCycle(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string,
  projectKind: string | null | undefined,
) {
  if (projectKind !== "retainer") return null;

  const { monthStart } = retainerMonthWindow();
  const { data, error } = await supabase
    .from("project_retainer_cycles")
    .upsert(
      {
        user_id: userId,
        project_id: projectId,
        month_start: monthStart,
      },
      { onConflict: "project_id,month_start" },
    )
    .select("id")
    .single();

  if (isMissingSchema(error)) return null;
  if (error) throw new Error(error.message);
  return data?.id ? String(data.id) : null;
}

async function entryResult(supabase: SupabaseServerClient, userId: string, entryId: string): Promise<ProjectActionResult> {
  const entry = await getProjectEntryById(supabase, userId, entryId);
  if (!entry) return { ok: false, error: "Entry was saved but could not be loaded." };
  return { ok: true, entry };
}

async function templateResult(supabase: SupabaseServerClient, userId: string, templateId: string): Promise<ProjectActionResult> {
  const template = await getProjectTemplateById(supabase, userId, templateId);
  if (!template) return { ok: false, error: "Template was saved but could not be loaded." };
  return { ok: true, template };
}

export async function createEntry(input: CreateProjectInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to create projects." };

  try {
    const name = input.name.trim();
    if (!name) throw new Error("Name is required.");

    if (input.type === "area") {
      const { data, error } = await supabase
        .from("areas")
        .insert({
          user_id: user.id,
          key: null,
          name,
          color: "gray",
          ui_color: input.color || PROJECT_COLORS[0],
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Area was not created.");
      revalidateProjectViews();
      return entryResult(supabase, user.id, data.id);
    }

    if (input.areaId) await ensureAreaOwned(supabase, user.id, input.areaId);

    const isRetainer = input.engagement === "retainer";
    if (isRetainer && !input.areaId) throw new Error("Choose an area for this monthly service.");

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        description: asNullable(input.desc),
        area_id: asNullable(input.areaId),
        status: "active",
        start_date: isRetainer ? null : asNullable(input.start),
        end_date: isRetainer ? null : asNullable(input.target),
        ui_color: input.color || PROJECT_COLORS[0],
        project_kind: isRetainer ? "retainer" : "project",
        quoted_hours: isRetainer ? null : cleanPositiveNumber(input.quoted),
        monthly_hours: isRetainer ? cleanPositiveNumber(input.monthly, 4) : null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Project was not created.");

    if (isRetainer) {
      await ensureCurrentRetainerCycle(supabase, user.id, data.id, "retainer");
    }

    if (input.templateId) {
      await loadTemplateItems(supabase, user.id, data.id, input.templateId, isRetainer ? "retainer" : "project");
    }

    revalidateProjectViews(!isRetainer);
    return entryResult(supabase, user.id, data.id);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create entry." };
  }
}

export async function setColor(input: UpdateProjectColorInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", input.id)
      .maybeSingle();

    if (project) {
      const { error } = await supabase
        .from("projects")
        .update({ ui_color: input.color || PROJECT_COLORS[0] })
        .eq("user_id", user.id)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    } else {
      await ensureAreaOwned(supabase, user.id, input.id);
      const { error } = await supabase
        .from("areas")
        .update({ ui_color: input.color || PROJECT_COLORS[0] })
        .eq("user_id", user.id)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    }

    revalidateProjectViews();
    return entryResult(supabase, user.id, input.id);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update color." };
  }
}

export async function setEntryStatus(input: UpdateEntryStatusInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    if (input.type === "area") {
      await ensureAreaOwned(supabase, user.id, input.id);
      const { error } = await supabase
        .from("areas")
        .update({ status: input.status })
        .eq("user_id", user.id)
        .eq("id", input.id);

      if (error) throw new Error(error.message);
    } else {
      await ensureProjectOwned(supabase, user.id, input.id);
      const { error } = await supabase
        .from("projects")
        .update({ status: input.status, last_activity_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("id", input.id);

      if (error) throw new Error(error.message);
    }

    revalidateProjectViews(true);
    return entryResult(supabase, user.id, input.id);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update entry status." };
  }
}

export async function deleteEntry(input: DeleteEntryInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to delete projects." };

  try {
    if (input.type === "area") {
      await ensureAreaOwned(supabase, user.id, input.id);
      const { error } = await supabase
        .from("areas")
        .update({ status: "deleted" })
        .eq("user_id", user.id)
        .eq("id", input.id);

      if (error) throw new Error(error.message);
    } else {
      await ensureProjectOwned(supabase, user.id, input.id);
      const { error } = await supabase.from("projects").delete().eq("user_id", user.id).eq("id", input.id);

      if (error) throw new Error(error.message);
    }

    revalidateProjectViews(true);
    return { ok: true, deletedId: input.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete entry." };
  }
}

export async function addMilestone(input: CreateMilestoneInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const label = input.label.trim();
    if (!label) throw new Error("Milestone label is required.");

    const { error } = await supabase.from("project_milestones").insert({
      user_id: user.id,
      project_id: input.projectId,
      label,
      weight: cleanWeight(input.weight),
      completed: false,
      order: await nextOrder(supabase, "project_milestones", user.id, input.projectId),
    });

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add milestone." };
  }
}

export async function updateMilestone(input: UpdateMilestoneInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const patch: Record<string, string | number | boolean> = {};
    if (typeof input.label === "string") patch.label = input.label.trim();
    if (typeof input.weight === "number") patch.weight = cleanWeight(input.weight);
    if (typeof input.done === "boolean") patch.completed = input.done;

    const { error } = await supabase
      .from("project_milestones")
      .update(patch)
      .eq("user_id", user.id)
      .eq("project_id", input.projectId)
      .eq("id", input.milestoneId);

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update milestone." };
  }
}

export async function removeMilestone(input: DeleteMilestoneInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const { error } = await supabase
      .from("project_milestones")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", input.projectId)
      .eq("id", input.milestoneId);

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove milestone." };
  }
}

export async function addCheck(input: CreateChecklistItemInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    const project = await ensureProjectOwned(supabase, user.id, input.projectId);
    const label = input.label.trim();
    if (!label) throw new Error("Checklist item is required.");
    const cycleId = input.recurring ? await ensureCurrentRetainerCycle(supabase, user.id, input.projectId, project.project_kind) : null;

    const { error } = await supabase.from("project_checklist_items").insert({
      user_id: user.id,
      project_id: input.projectId,
      label,
      completed: false,
      recurring: input.recurring,
      cycle_id: cycleId,
      order: await nextOrder(supabase, "project_checklist_items", user.id, input.projectId),
    });

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add checklist item." };
  }
}

export async function toggleCheck(input: UpdateChecklistItemInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const { error } = await supabase
      .from("project_checklist_items")
      .update({ completed: input.done, completed_at: input.done ? new Date().toISOString() : null })
      .eq("user_id", user.id)
      .eq("project_id", input.projectId)
      .eq("id", input.itemId);

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update checklist item." };
  }
}

export async function removeCheck(input: DeleteChecklistItemInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const { error } = await supabase
      .from("project_checklist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", input.projectId)
      .eq("id", input.itemId);

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove checklist item." };
  }
}

async function loadTemplateItems(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string,
  templateId: string,
  projectKind: string | null | undefined,
) {
  const { data: template, error: templateError } = await supabase
    .from("project_checklist_templates")
    .select("id,monthly")
    .eq("user_id", userId)
    .eq("id", templateId)
    .maybeSingle();

  if (templateError) throw new Error(templateError.message);
  if (!template) throw new Error("Template was not found.");

  const { data: items, error: itemError } = await supabase
    .from("project_checklist_template_items")
    .select("label,order")
    .eq("template_id", templateId)
    .order("order", { ascending: true });

  if (itemError) throw new Error(itemError.message);

  const start = await nextOrder(supabase, "project_checklist_items", userId, projectId);
  const cycleId = template.monthly ? await ensureCurrentRetainerCycle(supabase, userId, projectId, projectKind) : null;
  const rows = (items || []).map((item, index) => ({
    user_id: userId,
    project_id: projectId,
    label: item.label,
    completed: false,
    recurring: Boolean(template.monthly),
    cycle_id: cycleId,
    order: start + index,
  }));

  if (!rows.length) return;
  const { error } = await supabase.from("project_checklist_items").insert(rows);
  if (error) throw new Error(error.message);
}

export async function loadTemplate(input: LoadTemplateInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    const project = await ensureProjectOwned(supabase, user.id, input.projectId);
    await loadTemplateItems(supabase, user.id, input.projectId, input.templateId, project.project_kind);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not load template." };
  }
}

export async function addTask(input: CreateProjectTaskInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to create tasks." };

  try {
    const project = await ensureProjectOwned(supabase, user.id, input.projectId);
    const title = input.title.trim();
    if (!title) throw new Error("Task title is required.");

    await ensureTaskAreas(supabase, user.id);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title,
      notes: "",
      area_id: project.area_id,
      project_id: input.projectId,
      status: "todo",
      priority: 4,
      repeat: "",
      pinned_top3: false,
    });

    if (error) throw new Error(error.message);
    revalidateProjectViews(true);
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add task." };
  }
}

export async function toggleTask(input: ToggleProjectTaskInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update tasks." };

  try {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id,project_id")
      .eq("user_id", user.id)
      .eq("id", input.taskId)
      .maybeSingle();

    if (taskError) throw new Error(taskError.message);
    if (!task?.project_id) throw new Error("Task was not found.");

    const { error } = await supabase
      .from("tasks")
      .update({ status: input.done ? "done" : "todo" })
      .eq("user_id", user.id)
      .eq("id", input.taskId);

    if (error) throw new Error(error.message);
    revalidateProjectViews(true);
    return entryResult(supabase, user.id, task.project_id);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update task." };
  }
}

export async function logActivity(input: LogProjectActivityInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update projects." };

  try {
    await ensureProjectOwned(supabase, user.id, input.projectId);
    const note = input.note.trim();
    if (!note) throw new Error("Activity note is required.");

    const { error } = await supabase.from("project_activity").insert({
      user_id: user.id,
      project_id: input.projectId,
      kind: input.kind,
      note,
      hours: input.kind === "work" ? cleanPositiveNumber(input.hours, 0) : 0,
    });

    if (error) throw new Error(error.message);
    await touchProject(supabase, user.id, input.projectId);
    revalidateProjectViews();
    return entryResult(supabase, user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not log activity." };
  }
}

export async function addTemplate(input: CreateTemplateInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update templates." };

  try {
    const name = input.name.trim();
    if (!name) throw new Error("Template name is required.");

    const { data, error } = await supabase
      .from("project_checklist_templates")
      .insert({ user_id: user.id, name, monthly: input.monthly })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Template was not created.");
    revalidateProjectViews();
    return templateResult(supabase, user.id, data.id);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create template." };
  }
}

export async function removeTemplate(input: DeleteTemplateInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update templates." };

  try {
    const { error } = await supabase
      .from("project_checklist_templates")
      .delete()
      .eq("user_id", user.id)
      .eq("id", input.templateId);

    if (error) throw new Error(error.message);
    revalidateProjectViews();
    return { ok: true, deletedId: input.templateId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove template." };
  }
}

export async function addTemplateItem(input: CreateTemplateItemInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update templates." };

  try {
    const template = await getProjectTemplateById(supabase, user.id, input.templateId);
    if (!template) throw new Error("Template was not found.");
    const label = input.label.trim();
    if (!label) throw new Error("Template item is required.");

    const { error } = await supabase.from("project_checklist_template_items").insert({
      template_id: input.templateId,
      label,
      order: await nextTemplateItemOrder(supabase, input.templateId),
    });

    if (error) throw new Error(error.message);
    revalidateProjectViews();
    return templateResult(supabase, user.id, input.templateId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add template item." };
  }
}

export async function removeTemplateItem(input: DeleteTemplateItemInput): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to update templates." };

  try {
    const template = await getProjectTemplateById(supabase, user.id, input.templateId);
    if (!template) throw new Error("Template was not found.");

    const { error } = await supabase
      .from("project_checklist_template_items")
      .delete()
      .eq("template_id", input.templateId)
      .eq("id", input.itemId);

    if (error) throw new Error(error.message);
    revalidateProjectViews();
    return templateResult(supabase, user.id, input.templateId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove template item." };
  }
}

export async function refreshProjects(): Promise<ProjectActionResult> {
  const { supabase, user } = await getAuthedClient();
  if (!user) return { ok: false, error: "You must be logged in to load projects." };

  try {
    return { ok: true, payload: await getProjectsPayload(supabase, user.id) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not load projects." };
  }
}
