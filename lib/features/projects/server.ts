import { createClient } from "@/lib/supabase/server";
import { ensureTaskAreas } from "@/lib/features/tasks/server";
import {
  normalizeActivity,
  normalizeArea,
  normalizeChecklistItem,
  normalizeMilestone,
  normalizeProject,
  normalizeTask,
  normalizeTemplate,
  type DbActivityRow,
  type DbAreaRow,
  type DbChecklistItemRow,
  type DbMilestoneRow,
  type DbProjectRow,
  type DbTaskRow,
  type DbTemplateItemRow,
  type DbTemplateRow,
  type ProjectEntry,
  type ProjectPayload,
  type ProjectTemplate,
} from "./data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const AREA_SELECT = "id,key,name,color,ui_color,status,created_at";
const LEGACY_AREA_SELECT = "id,key,name,color,created_at";
const PROJECT_SELECT =
  "id,name,description,area_id,status,last_activity_at,start_date,end_date,created_at,ui_color,project_kind,quoted_hours,monthly_hours,sort_order";
const LEGACY_PROJECT_SELECT = "id,name,description,area_id,status,last_activity_at,start_date,end_date,created_at";
const TASK_SELECT = "id,title,due_date,project_id,status,created_at,pinned_top3";
const MILESTONE_SELECT = "id,project_id,label,weight,completed,order";
const CHECKLIST_SELECT = "id,project_id,label,completed,recurring,order";
const ACTIVITY_SELECT = "id,project_id,kind,note,hours,created_at";
const TEMPLATE_SELECT = "id,name,monthly,created_at";
const TEMPLATE_ITEM_SELECT = "id,template_id,label,order";

function byProject<T extends { project_id: string | null }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((row) => {
    if (!row.project_id) return;
    const current = map.get(row.project_id) || [];
    current.push(row);
    map.set(row.project_id, current);
  });
  return map;
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

async function getAreas(supabase: SupabaseServerClient, userId: string) {
  const result = await supabase
    .from("areas")
    .select(AREA_SELECT)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (!isMissingSchema(result.error)) return result;

  return supabase
    .from("areas")
    .select(LEGACY_AREA_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
}

async function getProjects(supabase: SupabaseServerClient, userId: string) {
  const result = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("last_activity_at", { ascending: false });

  if (!isMissingSchema(result.error)) return result;

  return supabase
    .from("projects")
    .select(LEGACY_PROJECT_SELECT)
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("last_activity_at", { ascending: false });
}

async function getOptionalRows<T>(query: PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>) {
  const result = await query;
  if (isMissingSchema(result.error)) return { data: [] as T[], error: null };
  return result;
}

function replaceEntry(payload: ProjectPayload, entry: ProjectEntry): ProjectPayload {
  const found = payload.entries.some((item) => item.id === entry.id);
  return {
    ...payload,
    entries: found ? payload.entries.map((item) => (item.id === entry.id ? entry : item)) : [...payload.entries, entry],
  };
}

function replaceTemplate(payload: ProjectPayload, template: ProjectTemplate): ProjectPayload {
  const found = payload.templates.some((item) => item.id === template.id);
  return {
    ...payload,
    templates: found ? payload.templates.map((item) => (item.id === template.id ? template : item)) : [...payload.templates, template],
  };
}

export async function getProjectsPayload(supabase: SupabaseServerClient, userId: string): Promise<ProjectPayload> {
  await ensureTaskAreas(supabase, userId);

  const [
    { data: areaRows, error: areasError },
    { data: projectRows, error: projectsError },
    { data: taskRows, error: tasksError },
    { data: milestoneRows, error: milestonesError },
    { data: checklistRows, error: checklistError },
    { data: activityRows, error: activityError },
    { data: templateRows, error: templatesError },
    { data: templateItemRows, error: templateItemsError },
  ] = await Promise.all([
    getAreas(supabase, userId),
    getProjects(supabase, userId),
    supabase.from("tasks").select(TASK_SELECT).eq("user_id", userId).order("created_at", { ascending: false }),
    getOptionalRows<DbMilestoneRow>(
      supabase.from("project_milestones").select(MILESTONE_SELECT).eq("user_id", userId).order("order", { ascending: true }),
    ),
    getOptionalRows<DbChecklistItemRow>(
      supabase
        .from("project_checklist_items")
        .select(CHECKLIST_SELECT)
        .eq("user_id", userId)
        .order("order", { ascending: true }),
    ),
    getOptionalRows<DbActivityRow>(
      supabase.from("project_activity").select(ACTIVITY_SELECT).eq("user_id", userId).order("created_at", { ascending: false }),
    ),
    getOptionalRows<DbTemplateRow>(
      supabase.from("project_checklist_templates").select(TEMPLATE_SELECT).eq("user_id", userId).order("created_at", { ascending: true }),
    ),
    getOptionalRows<DbTemplateItemRow>(
      supabase.from("project_checklist_template_items").select(TEMPLATE_ITEM_SELECT).order("order", { ascending: true }),
    ),
  ]);

  if (areasError) throw new Error(areasError.message);
  if (projectsError) throw new Error(projectsError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (milestonesError) throw new Error(milestonesError.message);
  if (checklistError) throw new Error(checklistError.message);
  if (activityError) throw new Error(activityError.message);
  if (templatesError) throw new Error(templatesError.message);
  if (templateItemsError) throw new Error(templateItemsError.message);

  const areas = ((areaRows || []) as DbAreaRow[]).map(normalizeArea);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const taskByProject = byProject((taskRows || []) as DbTaskRow[]);
  const milestonesByProject = byProject((milestoneRows || []) as DbMilestoneRow[]);
  const checklistByProject = byProject((checklistRows || []) as DbChecklistItemRow[]);
  const activityByProject = byProject((activityRows || []) as DbActivityRow[]);

  const projects = ((projectRows || []) as DbProjectRow[]).map((row) =>
    normalizeProject(row, areaById, {
      tasks: (taskByProject.get(row.id) || []).map(normalizeTask),
      milestones: (milestonesByProject.get(row.id) || []).map(normalizeMilestone),
      checklist: (checklistByProject.get(row.id) || []).map(normalizeChecklistItem),
      activity: (activityByProject.get(row.id) || []).map(normalizeActivity),
    }),
  );

  return {
    entries: [...areas, ...projects],
    templates: ((templateRows || []) as DbTemplateRow[]).map((template) =>
      normalizeTemplate(template, (templateItemRows || []) as DbTemplateItemRow[]),
    ),
  };
}

export async function getProjectEntryById(
  supabase: SupabaseServerClient,
  userId: string,
  entryId: string,
): Promise<ProjectEntry | null> {
  const payload = await getProjectsPayload(supabase, userId);
  return payload.entries.find((entry) => entry.id === entryId) || null;
}

export async function getProjectTemplateById(
  supabase: SupabaseServerClient,
  userId: string,
  templateId: string,
): Promise<ProjectTemplate | null> {
  const payload = await getProjectsPayload(supabase, userId);
  return payload.templates.find((template) => template.id === templateId) || null;
}

export { replaceEntry, replaceTemplate };
