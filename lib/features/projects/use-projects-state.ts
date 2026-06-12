"use client";

import { useMemo, useState } from "react";
import {
  PROJECT_COLORS,
  PROJECT_SEED,
  PROJECT_TEMPLATES,
  type ProjectActivity,
  type ProjectChecklistItem,
  type ProjectEntry,
  type ProjectEntryType,
  type ProjectFormDraft,
  type ProjectMilestone,
  type ProjectRoute,
  type ProjectTemplate,
} from "./data";

let nextId = 1;
function id(prefix: string) {
  nextId += 1;
  return `${prefix}-${Date.now().toString(36)}-${nextId}`;
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

function nowLabel() {
  return new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function patchEntry(entries: ProjectEntry[], entryId: string, next: (entry: ProjectEntry) => ProjectEntry) {
  return entries.map((entry) => (entry.id === entryId ? next(entry) : entry));
}

export function useProjectsState(initialRoute: ProjectRoute = { view: "list" }) {
  const [entries, setEntries] = useState<ProjectEntry[]>(PROJECT_SEED);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES);
  const [route, setRoute] = useState<ProjectRoute>(initialRoute);

  const areas = useMemo(() => entries.filter((entry) => entry.type === "area"), [entries]);
  const activeProjects = useMemo(() => entries.filter((entry) => entry.type === "project"), [entries]);
  const selectedEntry = route.view === "entry" ? entries.find((entry) => entry.id === route.id) || null : null;

  const updateEntry = (entryId: string, next: (entry: ProjectEntry) => ProjectEntry) => {
    setEntries((current) => patchEntry(current, entryId, next));
  };

  return {
    entries,
    templates,
    route,
    areas,
    activeProjects,
    selectedEntry,
    openEntry: (entryId: string) => setRoute({ view: "entry", id: entryId }),
    backToList: () => setRoute({ view: "list" }),
    openNew: (type?: ProjectEntryType) => setRoute({ view: "new", type }),
    openTemplates: () => setRoute({ view: "templates" }),
    setColor: (entryId: string, color: string) => updateEntry(entryId, (entry) => ({ ...entry, color })),
    toggleMilestone: (entryId: string, milestoneId: string) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        milestones: entry.milestones.map((milestone) =>
          milestone.id === milestoneId ? { ...milestone, done: !milestone.done } : milestone,
        ),
      })),
    addMilestone: (entryId: string, label: string, weight: number) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        milestones: [...entry.milestones, { id: id("milestone"), label, weight, done: false }],
      })),
    updateMilestone: (entryId: string, milestoneId: string, patch: Partial<ProjectMilestone>) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        milestones: entry.milestones.map((milestone) =>
          milestone.id === milestoneId ? { ...milestone, ...patch } : milestone,
        ),
      })),
    removeMilestone: (entryId: string, milestoneId: string) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        milestones: entry.milestones.filter((milestone) => milestone.id !== milestoneId),
      })),
    toggleTask: (entryId: string, taskId: string) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        tasks: entry.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
      })),
    addTask: (entryId: string, title: string) =>
      updateEntry(entryId, (entry) => ({ ...entry, tasks: [...entry.tasks, { id: id("task"), title, done: false }] })),
    toggleCheck: (entryId: string, itemId: string) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        checklist: entry.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
      })),
    addCheck: (entryId: string, label: string, recurring: boolean) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        checklist: [...entry.checklist, { id: id("check"), label, done: false, recurring }],
      })),
    removeCheck: (entryId: string, itemId: string) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        checklist: entry.checklist.filter((item) => item.id !== itemId),
      })),
    loadTemplate: (entryId: string, templateId: string) => {
      const template = templates.find((item) => item.id === templateId);
      if (!template) return;
      updateEntry(entryId, (entry) => ({
        ...entry,
        checklist: [
          ...entry.checklist,
          ...template.items.map<ProjectChecklistItem>((label) => ({
            id: id("check"),
            label,
            done: false,
            recurring: template.monthly,
          })),
        ],
      }));
    },
    logActivity: (entryId: string, activity: Omit<ProjectActivity, "id" | "when">) =>
      updateEntry(entryId, (entry) => ({
        ...entry,
        activity: [{ id: id("activity"), when: nowLabel(), ...activity }, ...entry.activity],
      })),
    addTemplate: (name: string, monthly: boolean) => {
      const templateId = id("template");
      setTemplates((current) => [...current, { id: templateId, name, monthly, items: [] }]);
      return templateId;
    },
    removeTemplate: (templateId: string) => setTemplates((current) => current.filter((item) => item.id !== templateId)),
    addTemplateItem: (templateId: string, label: string) =>
      setTemplates((current) =>
        current.map((item) => (item.id === templateId ? { ...item, items: [...item.items, label] } : item)),
      ),
    removeTemplateItem: (templateId: string, index: number) =>
      setTemplates((current) =>
        current.map((item) =>
          item.id === templateId ? { ...item, items: item.items.filter((_, itemIndex) => itemIndex !== index) } : item,
        ),
      ),
    createEntry: (draft: ProjectFormDraft) => {
      const isRetainer = draft.type === "project" && draft.engagement === "retainer";
      const template = templates.find((item) => item.id === draft.templateId);
      const entryId = id("entry");
      const entry: ProjectEntry = {
        id: entryId,
        type: draft.type,
        engagement: draft.type === "project" ? draft.engagement : undefined,
        name: draft.name.trim(),
        desc: draft.desc,
        area: draft.area,
        areaId: draft.type === "project" ? draft.areaId || null : undefined,
        color: draft.color || PROJECT_COLORS[0],
        start: draft.start,
        target: isRetainer ? "" : draft.target,
        quoted: isRetainer ? undefined : Number.parseFloat(draft.quoted) || undefined,
        monthly: isRetainer ? Number.parseFloat(draft.monthly) || 4 : undefined,
        milestones: [],
        tasks: [],
        checklist: template
          ? template.items.map((label) => ({ id: id("check"), label, done: false, recurring: template.monthly }))
          : [],
        activity: [],
        history: isRetainer ? [] : undefined,
      };

      setEntries((current) => [...current, entry]);
      setRoute({ view: "entry", id: entryId });
    },
  };
}

export type ProjectsState = ReturnType<typeof useProjectsState>;
