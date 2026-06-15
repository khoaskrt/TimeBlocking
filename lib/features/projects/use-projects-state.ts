"use client";

import { useMemo, useState, useTransition } from "react";
import {
  daysLeft,
  formatHours,
  formatProjectDate,
  parseDuration,
  projectHours,
  projectPercent,
  retainerCycleHours,
  type ProjectActions,
  type ProjectActivity,
  type ProjectChecklistItem,
  type ProjectEntry,
  type ProjectEntryType,
  type ProjectFormDraft,
  type ProjectMilestone,
  type ProjectPayload,
  type ProjectRoute,
  type ProjectTemplate,
} from "./data";

export { daysLeft, formatHours, formatProjectDate, parseDuration, projectHours, projectPercent, retainerCycleHours };

type UseProjectsStateOptions = {
  initialPayload: ProjectPayload;
  actions: ProjectActions;
  initialRoute?: ProjectRoute;
};

let nextId = 1;
function optimisticId(prefix: string) {
  nextId += 1;
  return `optimistic-${prefix}-${Date.now().toString(36)}-${nextId}`;
}

function replaceEntry(entries: ProjectEntry[], next: ProjectEntry) {
  const found = entries.some((entry) => entry.id === next.id);
  return found ? entries.map((entry) => (entry.id === next.id ? next : entry)) : [...entries, next];
}

function replaceTemplate(templates: ProjectTemplate[], next: ProjectTemplate) {
  const found = templates.some((template) => template.id === next.id);
  return found ? templates.map((template) => (template.id === next.id ? next : template)) : [...templates, next];
}

function patchEntry(entries: ProjectEntry[], entryId: string, next: (entry: ProjectEntry) => ProjectEntry) {
  return entries.map((entry) => (entry.id === entryId ? next(entry) : entry));
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function templateLabels(template: ProjectTemplate): string[] {
  return template.items.map((item) => item.label);
}

export function useProjectsState({ initialPayload, actions, initialRoute = { view: "list" } }: UseProjectsStateOptions) {
  const [entries, setEntries] = useState<ProjectEntry[]>(initialPayload.entries);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(initialPayload.templates);
  const [route, setRoute] = useState<ProjectRoute>(initialRoute);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const areas = useMemo(() => entries.filter((entry) => entry.type === "area"), [entries]);
  const activeProjects = useMemo(
    () => entries.filter((entry) => entry.type === "project" && entry.status === "active"),
    [entries],
  );
  const selectedEntry = route.view === "entry" ? entries.find((entry) => entry.id === route.id) || null : null;

  const applyEntryResult = (result: Awaited<ReturnType<ProjectActions["setColor"]>>, rollback: ProjectEntry[]) => {
    if (result.ok && "entry" in result) {
      setEntries((current) => replaceEntry(current, result.entry));
      return;
    }
    if (!result.ok) {
      setEntries(rollback);
      setError(result.error);
    }
  };

  const applyTemplateResult = (result: Awaited<ReturnType<ProjectActions["addTemplate"]>>, rollback: ProjectTemplate[]) => {
    if (result.ok && "template" in result) {
      setTemplates((current) => replaceTemplate(current, result.template));
      return;
    }
    if (result.ok && "deletedId" in result) {
      setTemplates((current) => current.filter((template) => template.id !== result.deletedId));
      return;
    }
    if (!result.ok) {
      setTemplates(rollback);
      setError(result.error);
    }
  };

  const runEntryMutation = (
    optimistic: (current: ProjectEntry[]) => ProjectEntry[],
    action: () => Promise<Awaited<ReturnType<ProjectActions["setColor"]>>>,
  ) => {
    const rollback = entries;
    setError(null);
    setEntries(optimistic);
    startTransition(async () => applyEntryResult(await action(), rollback));
  };

  const runTemplateMutation = (
    optimistic: (current: ProjectTemplate[]) => ProjectTemplate[],
    action: () => Promise<Awaited<ReturnType<ProjectActions["addTemplate"]>>>,
  ) => {
    const rollback = templates;
    setError(null);
    setTemplates(optimistic);
    startTransition(async () => applyTemplateResult(await action(), rollback));
  };

  return {
    entries,
    templates,
    route,
    areas,
    activeProjects,
    selectedEntry,
    error,
    isPending,
    openEntry: (entryId: string) => {
      setError(null);
      setRoute({ view: "entry", id: entryId });
    },
    backToList: () => {
      setError(null);
      setRoute({ view: "list" });
    },
    openNew: (type?: ProjectEntryType) => {
      setError(null);
      setRoute({ view: "new", type });
    },
    openTemplates: () => {
      setError(null);
      setRoute({ view: "templates" });
    },
    setColor: (entryId: string, color: string) =>
      runEntryMutation(
        (current) => patchEntry(current, entryId, (entry) => ({ ...entry, color })),
        () => actions.setColor({ id: entryId, color }),
      ),
    setEntryStatus: (entryId: string, status: "active" | "done") =>
      runEntryMutation(
        (current) => patchEntry(current, entryId, (entry) => ({ ...entry, status })),
        async () => {
          const entry = entries.find((item) => item.id === entryId);
          if (!entry) return { ok: false, error: "Entry was not found." };
          return actions.setEntryStatus({ id: entryId, type: entry.type, status });
        },
      ),
    deleteEntry: (entryId: string) => {
      const entry = entries.find((item) => item.id === entryId);
      if (!entry) return;

      const rollback = entries;
      setError(null);
      setEntries((current) => current.filter((item) => item.id !== entryId));
      setRoute({ view: "list" });

      startTransition(async () => {
        const result = await actions.deleteEntry({ id: entryId, type: entry.type });
        if (result.ok && "deletedId" in result) return;
        if (!result.ok) {
          setEntries(rollback);
          setRoute({ view: "entry", id: entryId });
          setError(result.error);
        }
      });
    },
    toggleMilestone: (entryId: string, milestoneId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            milestones: entry.milestones.map((milestone) =>
              milestone.id === milestoneId ? { ...milestone, done: !milestone.done } : milestone,
            ),
          })),
        async () => {
          const entry = entries.find((item) => item.id === entryId);
          const milestone = entry?.milestones.find((item) => item.id === milestoneId);
          return actions.updateMilestone({ projectId: entryId, milestoneId, done: !milestone?.done });
        },
      ),
    addMilestone: (entryId: string, label: string, weight: number) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            milestones: sortByOrder([
              ...entry.milestones,
              { id: optimisticId("milestone"), label, weight, done: false, order: entry.milestones.length + 1 },
            ]),
          })),
        () => actions.addMilestone({ projectId: entryId, label, weight }),
      ),
    updateMilestone: (entryId: string, milestoneId: string, patch: Partial<ProjectMilestone>) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            milestones: entry.milestones.map((milestone) =>
              milestone.id === milestoneId ? { ...milestone, ...patch } : milestone,
            ),
          })),
        () =>
          actions.updateMilestone({
            projectId: entryId,
            milestoneId,
            label: patch.label,
            weight: patch.weight,
            done: patch.done,
          }),
      ),
    removeMilestone: (entryId: string, milestoneId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            milestones: entry.milestones.filter((milestone) => milestone.id !== milestoneId),
          })),
        () => actions.removeMilestone({ projectId: entryId, milestoneId }),
      ),
    toggleTask: (entryId: string, taskId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            tasks: entry.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
          })),
        async () => {
          const entry = entries.find((item) => item.id === entryId);
          const task = entry?.tasks.find((item) => item.id === taskId);
          return actions.toggleTask({ taskId, done: !task?.done });
        },
      ),
    addTask: (entryId: string, title: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            tasks: [{ id: optimisticId("task"), title, done: false }, ...entry.tasks],
          })),
        () => actions.addTask({ projectId: entryId, title }),
      ),
    toggleCheck: (entryId: string, itemId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            checklist: entry.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
          })),
        async () => {
          const entry = entries.find((item) => item.id === entryId);
          const check = entry?.checklist.find((item) => item.id === itemId);
          return actions.toggleCheck({ projectId: entryId, itemId, done: !check?.done });
        },
      ),
    addCheck: (entryId: string, label: string, recurring: boolean) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            checklist: sortByOrder([
              ...entry.checklist,
              { id: optimisticId("check"), label, done: false, recurring, order: entry.checklist.length + 1 },
            ]),
          })),
        () => actions.addCheck({ projectId: entryId, label, recurring }),
      ),
    removeCheck: (entryId: string, itemId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            checklist: entry.checklist.filter((item) => item.id !== itemId),
          })),
        () => actions.removeCheck({ projectId: entryId, itemId }),
      ),
    loadTemplate: (entryId: string, templateId: string) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => {
            const template = templates.find((item) => item.id === templateId);
            const labels = template ? templateLabels(template) : [];
            return {
              ...entry,
              checklist: sortByOrder([
                ...entry.checklist,
                ...labels.map<ProjectChecklistItem>((label, index) => ({
                  id: optimisticId("check"),
                  label,
                  done: false,
                  recurring: Boolean(template?.monthly),
                  order: entry.checklist.length + index + 1,
                })),
              ]),
            };
          }),
        () => actions.loadTemplate({ projectId: entryId, templateId }),
      ),
    logActivity: (entryId: string, activity: Omit<ProjectActivity, "id" | "when" | "createdAt">) =>
      runEntryMutation(
        (current) =>
          patchEntry(current, entryId, (entry) => ({
            ...entry,
            activity: [
              {
                id: optimisticId("activity"),
                when: "Just now",
                createdAt: new Date().toISOString(),
                ...activity,
              },
              ...entry.activity,
            ],
          })),
        () => actions.logActivity({ projectId: entryId, ...activity }),
      ),
    addTemplate: (name: string, monthly: boolean) =>
      runTemplateMutation(
        (current) => [...current, { id: optimisticId("template"), name, monthly, items: [] }],
        () => actions.addTemplate({ name, monthly }),
      ),
    removeTemplate: (templateId: string) =>
      runTemplateMutation(
        (current) => current.filter((template) => template.id !== templateId),
        () => actions.removeTemplate({ templateId }),
      ),
    addTemplateItem: (templateId: string, label: string) =>
      runTemplateMutation(
        (current) =>
          current.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  items: [
                    ...template.items,
                    { id: optimisticId("template-item"), label, order: template.items.length + 1 },
                  ],
                }
              : template,
          ),
        () => actions.addTemplateItem({ templateId, label }),
      ),
    removeTemplateItem: (templateId: string, itemId: string) =>
      runTemplateMutation(
        (current) =>
          current.map((template) =>
            template.id === templateId
              ? { ...template, items: template.items.filter((item) => item.id !== itemId) }
              : template,
          ),
        () => actions.removeTemplateItem({ templateId, itemId }),
      ),
    createEntry: (draft: ProjectFormDraft) => {
      if (isPending) return;
      const previousEntries = entries;
      setError(null);
      startTransition(async () => {
        const result = await actions.createEntry(draft);
        if (result.ok && "entry" in result) {
          setEntries((current) => replaceEntry(current, result.entry));
          setRoute({ view: "entry", id: result.entry.id });
        } else if (!result.ok) {
          setEntries(previousEntries);
          setError(result.error);
        }
      });
    },
  };
}

export type ProjectsState = ReturnType<typeof useProjectsState>;
