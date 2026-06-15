import { AREA_META } from "@/lib/constants/areas";
import type { Area } from "@/lib/types";

export type ProjectEntryType = "project" | "area";
export type ProjectEngagement = "project" | "retainer";
export type ProjectStatus = "active" | "paused" | "done";
export type ProjectRoute =
  | { view: "list" }
  | { view: "entry"; id: string }
  | { view: "new"; type?: ProjectEntryType }
  | { view: "templates" };

export type ProjectMilestone = {
  id: string;
  label: string;
  weight: number;
  done: boolean;
  order: number;
};

export type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  top3?: boolean;
};

export type ProjectChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  recurring: boolean;
  cycleId?: string | null;
  order: number;
  createdAt?: string;
  completedAt?: string | null;
};

export type ProjectActivity = {
  id: string;
  when: string;
  kind: "work" | "update";
  note: string;
  hours: number;
  createdAt: string;
};

export type ProjectHistoryMonth = {
  month: string;
  hours: number;
  items: { label: string; done: boolean }[];
};

export type ProjectRetainerCycle = {
  id: string;
  monthStart: string;
  nextMonthStart: string;
  label: string;
  resetLabel: string;
};

export type ProjectEntry = {
  id: string;
  type: ProjectEntryType;
  engagement?: ProjectEngagement;
  name: string;
  area: Area;
  areaId?: string | null;
  color: string;
  desc: string;
  status: ProjectStatus;
  start?: string;
  target?: string;
  quoted?: number;
  monthly?: number;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  checklist: ProjectChecklistItem[];
  activity: ProjectActivity[];
  history?: ProjectHistoryMonth[];
  currentCycle?: ProjectRetainerCycle;
  monthlyLogged?: number;
  createdAt?: string;
  lastActivityAt?: string;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  monthly: boolean;
  items: { id: string; label: string; order: number }[];
};

export type ProjectPayload = {
  entries: ProjectEntry[];
  templates: ProjectTemplate[];
};

export type ProjectFormDraft = {
  type: ProjectEntryType;
  engagement: ProjectEngagement;
  name: string;
  desc: string;
  area: Area;
  areaId: string;
  color: string;
  start: string;
  target: string;
  quoted: string;
  monthly: string;
  templateId: string;
};

export type CreateProjectInput = ProjectFormDraft;
export type UpdateProjectColorInput = { id: string; color: string };
export type UpdateEntryStatusInput = { id: string; type: ProjectEntryType; status: Extract<ProjectStatus, "active" | "done"> };
export type DeleteEntryInput = { id: string; type: ProjectEntryType };
export type CreateMilestoneInput = { projectId: string; label: string; weight: number };
export type UpdateMilestoneInput = { projectId: string; milestoneId: string; label?: string; weight?: number; done?: boolean };
export type DeleteMilestoneInput = { projectId: string; milestoneId: string };
export type CreateChecklistItemInput = { projectId: string; label: string; recurring: boolean };
export type UpdateChecklistItemInput = { projectId: string; itemId: string; done: boolean };
export type DeleteChecklistItemInput = { projectId: string; itemId: string };
export type LoadTemplateInput = { projectId: string; templateId: string };
export type CreateProjectTaskInput = { projectId: string; title: string };
export type ToggleProjectTaskInput = { taskId: string; done: boolean };
export type LogProjectActivityInput = { projectId: string; kind: "work" | "update"; note: string; hours: number };
export type CreateTemplateInput = { name: string; monthly: boolean };
export type DeleteTemplateInput = { templateId: string };
export type CreateTemplateItemInput = { templateId: string; label: string };
export type DeleteTemplateItemInput = { templateId: string; itemId: string };

export type ProjectActionResult =
  | { ok: true; payload: ProjectPayload }
  | { ok: true; entry: ProjectEntry }
  | { ok: true; template: ProjectTemplate }
  | { ok: true; deletedId: string }
  | { ok: false; error: string };

export type ProjectActions = {
  createEntry: (input: CreateProjectInput) => Promise<ProjectActionResult>;
  setColor: (input: UpdateProjectColorInput) => Promise<ProjectActionResult>;
  setEntryStatus: (input: UpdateEntryStatusInput) => Promise<ProjectActionResult>;
  deleteEntry: (input: DeleteEntryInput) => Promise<ProjectActionResult>;
  addMilestone: (input: CreateMilestoneInput) => Promise<ProjectActionResult>;
  updateMilestone: (input: UpdateMilestoneInput) => Promise<ProjectActionResult>;
  removeMilestone: (input: DeleteMilestoneInput) => Promise<ProjectActionResult>;
  addCheck: (input: CreateChecklistItemInput) => Promise<ProjectActionResult>;
  toggleCheck: (input: UpdateChecklistItemInput) => Promise<ProjectActionResult>;
  removeCheck: (input: DeleteChecklistItemInput) => Promise<ProjectActionResult>;
  loadTemplate: (input: LoadTemplateInput) => Promise<ProjectActionResult>;
  addTask: (input: CreateProjectTaskInput) => Promise<ProjectActionResult>;
  toggleTask: (input: ToggleProjectTaskInput) => Promise<ProjectActionResult>;
  logActivity: (input: LogProjectActivityInput) => Promise<ProjectActionResult>;
  addTemplate: (input: CreateTemplateInput) => Promise<ProjectActionResult>;
  removeTemplate: (input: DeleteTemplateInput) => Promise<ProjectActionResult>;
  addTemplateItem: (input: CreateTemplateItemInput) => Promise<ProjectActionResult>;
  removeTemplateItem: (input: DeleteTemplateItemInput) => Promise<ProjectActionResult>;
};

export type DbAreaRow = {
  id: string;
  key: string | null;
  name: string;
  color: string | null;
  ui_color?: string | null;
  status?: ProjectStatus | "deleted" | null;
  created_at: string;
};

export type DbProjectRow = {
  id: string;
  name: string;
  description: string | null;
  area_id: string | null;
  status: ProjectStatus;
  last_activity_at: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  ui_color?: string | null;
  project_kind?: ProjectEngagement | null;
  quoted_hours?: number | string | null;
  monthly_hours?: number | string | null;
  sort_order?: number | null;
};

export type DbTaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  project_id: string | null;
  status: string;
  created_at: string;
  pinned_top3: boolean;
};

export type DbMilestoneRow = {
  id: string;
  project_id: string;
  label: string;
  weight: number;
  completed: boolean;
  order: number;
};

export type DbChecklistItemRow = {
  id: string;
  project_id: string;
  label: string;
  completed: boolean;
  recurring: boolean;
  cycle_id?: string | null;
  order: number;
  created_at?: string;
  completed_at?: string | null;
};

export type DbActivityRow = {
  id: string;
  project_id: string;
  kind: "work" | "update";
  note: string;
  hours: number | string | null;
  created_at: string;
};

export type DbTemplateRow = {
  id: string;
  name: string;
  monthly: boolean;
  created_at: string;
};

export type DbTemplateItemRow = {
  id: string;
  template_id: string;
  label: string;
  order: number;
};

export type DbRetainerCycleRow = {
  id: string;
  project_id: string;
  month_start: string;
  created_at: string;
};

export const PROJECT_COLORS = [
  "#334155",
  "#0f766e",
  "#15803d",
  "#9f1239",
  "#ca8a04",
  "#7c3aed",
  "#c2410c",
  "#71717a",
];

export function isArea(value: string | null | undefined): value is Area {
  return value === "work" || value === "personal" || value === "family" || value === "health";
}

export function colorNameToHex(value: string | null | undefined) {
  switch (value) {
    case "blue":
      return AREA_META.work.color;
    case "green":
      return AREA_META.personal.color;
    case "purple":
      return AREA_META.family.color;
    case "orange":
      return AREA_META.health.color;
    case "red":
      return "#dc2626";
    case "yellow":
      return "#ca8a04";
    case "pink":
      return "#db2777";
    case "gray":
      return "#71717a";
    default:
      return PROJECT_COLORS[0];
  }
}

export function cleanProjectStatus(value: string | null | undefined): ProjectStatus {
  if (value === "paused" || value === "done") return value;
  return "active";
}

export function cleanAreaStatus(value: string | null | undefined): ProjectStatus {
  if (value === "done") return "done";
  return "active";
}

export function cleanProjectKind(value: string | null | undefined): ProjectEngagement {
  return value === "retainer" ? "retainer" : "project";
}

export function cleanHours(value: string | number | null | undefined) {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function retainerMonthWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 12));
  return { monthStart: isoDate(start), nextMonthStart: isoDate(next) };
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatResetLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function cycleFromMonth(id: string, monthStart: string): ProjectRetainerCycle {
  const date = new Date(`${monthStart}T12:00:00`);
  const next = Number.isNaN(date.getTime())
    ? retainerMonthWindow().nextMonthStart
    : isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 12)));

  return {
    id,
    monthStart,
    nextMonthStart: next,
    label: formatMonthLabel(monthStart),
    resetLabel: formatResetLabel(next),
  };
}

function isWithinMonth(value: string, monthStart: string, nextMonthStart: string) {
  const time = Date.parse(value);
  const start = Date.parse(`${monthStart}T00:00:00Z`);
  const next = Date.parse(`${nextMonthStart}T00:00:00Z`);
  return Number.isFinite(time) && Number.isFinite(start) && Number.isFinite(next) && time >= start && time < next;
}

export function normalizeArea(row: DbAreaRow): ProjectEntry {
  const nameKey = row.key || row.name.toLowerCase();
  const area = isArea(nameKey) ? nameKey : "work";

  return {
    id: row.id,
    type: "area",
    name: row.name,
    area,
    color: row.ui_color || colorNameToHex(row.color),
    desc: "",
    status: cleanAreaStatus(row.status),
    milestones: [],
    tasks: [],
    checklist: [],
    activity: [],
    createdAt: row.created_at,
  };
}

export function normalizeProject(
  row: DbProjectRow,
  areaById: Map<string, ProjectEntry>,
  children: {
    tasks: ProjectTask[];
    milestones: ProjectMilestone[];
    checklist: ProjectChecklistItem[];
    activity: ProjectActivity[];
    cycles?: DbRetainerCycleRow[];
  },
): ProjectEntry {
  const area = row.area_id ? areaById.get(row.area_id) : null;
  const engagement = cleanProjectKind(row.project_kind);
  const { monthStart, nextMonthStart } = retainerMonthWindow();
  const currentCycleRow = children.cycles?.find((cycle) => cycle.month_start === monthStart);
  const currentCycle = engagement === "retainer" ? cycleFromMonth(currentCycleRow?.id || "", monthStart) : undefined;
  const checklist =
    engagement === "retainer" && currentCycleRow
      ? children.checklist.filter((item) => !item.recurring || item.cycleId === currentCycleRow.id)
      : children.checklist;
  const monthlyLogged =
    engagement === "retainer"
      ? children.activity.reduce(
          (sum, item) => sum + (item.kind === "work" && isWithinMonth(item.createdAt, monthStart, nextMonthStart) ? item.hours : 0),
          0,
        )
      : undefined;

  return {
    id: row.id,
    type: "project",
    engagement,
    name: row.name,
    area: area?.area || "work",
    areaId: row.area_id,
    color: row.ui_color || PROJECT_COLORS[0],
    desc: row.description || "",
    status: cleanProjectStatus(row.status),
    start: row.start_date || "",
    target: row.end_date || "",
    quoted: engagement === "project" ? cleanHours(row.quoted_hours) : undefined,
    monthly: engagement === "retainer" ? cleanHours(row.monthly_hours) || 4 : undefined,
    milestones: children.milestones,
    tasks: children.tasks,
    checklist,
    activity: children.activity,
    history: engagement === "retainer" ? deriveRetainerHistory(children.activity, children.checklist, children.cycles || [], currentCycle?.id) : undefined,
    currentCycle,
    monthlyLogged,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

export function normalizeMilestone(row: DbMilestoneRow): ProjectMilestone {
  return {
    id: row.id,
    label: row.label,
    weight: Number(row.weight) || 1,
    done: row.completed,
    order: Number(row.order) || 0,
  };
}

export function normalizeChecklistItem(row: DbChecklistItemRow): ProjectChecklistItem {
  return {
    id: row.id,
    label: row.label,
    done: row.completed,
    recurring: row.recurring,
    cycleId: row.cycle_id,
    order: Number(row.order) || 0,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function normalizeTask(row: DbTaskRow): ProjectTask {
  return {
    id: row.id,
    title: row.title,
    done: row.status === "done",
    due: row.due_date || undefined,
    top3: row.pinned_top3 || false,
  };
}

export function normalizeActivity(row: DbActivityRow): ProjectActivity {
  return {
    id: row.id,
    when: formatActivityDate(row.created_at),
    kind: row.kind === "work" ? "work" : "update",
    note: row.note,
    hours: Number(row.hours) || 0,
    createdAt: row.created_at,
  };
}

export function normalizeTemplate(row: DbTemplateRow, items: DbTemplateItemRow[]): ProjectTemplate {
  return {
    id: row.id,
    name: row.name,
    monthly: row.monthly,
    items: items
      .filter((item) => item.template_id === row.id)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ id: item.id, label: item.label, order: Number(item.order) || 0 })),
  };
}

export function projectPercent(entry: Pick<ProjectEntry, "milestones">) {
  const total = entry.milestones.reduce((sum, milestone) => sum + milestone.weight, 0);
  if (!total) return 0;
  const done = entry.milestones.reduce((sum, milestone) => sum + (milestone.done ? milestone.weight : 0), 0);
  return Math.round((done / total) * 100);
}

export function projectHours(entry: Pick<ProjectEntry, "activity">) {
  return entry.activity.reduce((sum, item) => sum + (item.kind === "work" ? item.hours : 0), 0);
}

export function retainerCycleHours(entry: Pick<ProjectEntry, "activity" | "currentCycle" | "monthlyLogged">) {
  if (typeof entry.monthlyLogged === "number") return entry.monthlyLogged;
  if (!entry.currentCycle) return projectHours(entry);
  return entry.activity.reduce(
    (sum, item) =>
      sum + (item.kind === "work" && isWithinMonth(item.createdAt, entry.currentCycle!.monthStart, entry.currentCycle!.nextMonthStart) ? item.hours : 0),
    0,
  );
}

export function formatHours(hours: number | undefined) {
  return `${(Math.round((hours || 0) * 10) / 10).toFixed(1)}h`;
}

export function formatProjectDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysLeft(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export function parseDuration(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (/^\d+(\.\d+)?$/.test(text)) return Number.parseFloat(text);

  let hours = 0;
  let matched = false;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = text.match(/(\d+)\s*m/);

  if (hourMatch) {
    hours += Number.parseFloat(hourMatch[1]);
    matched = true;
  }
  if (minuteMatch) {
    hours += Number.parseInt(minuteMatch[1], 10) / 60;
    matched = true;
  }

  return matched ? hours : null;
}

export function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function deriveRetainerHistory(
  activity: ProjectActivity[],
  checklist: ProjectChecklistItem[],
  cycles: DbRetainerCycleRow[],
  currentCycleId?: string,
): ProjectHistoryMonth[] {
  const { monthStart, nextMonthStart } = retainerMonthWindow();
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const monthMap = new Map<string, { month: string; monthStart: string; hours: number; items: { label: string; done: boolean }[] }>();

  activity.forEach((item) => {
    if (item.kind !== "work") return;
    const date = new Date(item.createdAt);
    const key = `${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`;
    const activityMonth = isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12)));
    if (isWithinMonth(item.createdAt, monthStart, nextMonthStart)) return;
    const current = monthMap.get(activityMonth) || { month: key, monthStart: activityMonth, hours: 0, items: [] };
    current.hours += item.hours;
    monthMap.set(activityMonth, current);
  });

  checklist.forEach((item) => {
    if (!item.recurring || !item.cycleId || item.cycleId === currentCycleId) return;
    const cycle = cycleById.get(item.cycleId);
    if (!cycle) return;
    const current = monthMap.get(cycle.month_start) || {
      month: formatMonthLabel(cycle.month_start),
      monthStart: cycle.month_start,
      hours: 0,
      items: [],
    };
    current.items.push({ label: item.label, done: item.done });
    monthMap.set(cycle.month_start, current);
  });

  return Array.from(monthMap.values())
    .sort((a, b) => b.monthStart.localeCompare(a.monthStart))
    .map(({ month, hours, items }) => ({ month, hours, items }));
}
