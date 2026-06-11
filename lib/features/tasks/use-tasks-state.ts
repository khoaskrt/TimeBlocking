"use client";

import { useMemo, useState, useTransition } from "react";
import type { Area, ManagedTask, TaskAreaOption, TaskGroupBy, TaskProject, TaskStatusFilter } from "@/lib/types";
import { newTaskDraft, type TaskActionResult, type TaskDraft, type TaskMutationInput } from "./data";

export type DueKind = "overdue" | "today" | "upcoming" | "none";
export type ManagedTaskGroup = {
  key: string;
  label: string;
  area: Area | null;
  items: ManagedTask[];
};

export type TaskActions = {
  createTask: (input: TaskMutationInput) => Promise<TaskActionResult>;
  updateTask: (input: TaskMutationInput) => Promise<TaskActionResult>;
  toggleTaskStatus: (taskId: string, done: boolean) => Promise<TaskActionResult>;
  deleteTask: (taskId: string) => Promise<TaskActionResult>;
};

type UseTasksStateOptions = {
  initialTasks: ManagedTask[];
  areas: TaskAreaOption[];
  projects: TaskProject[];
  actions: TaskActions;
};

export function getTaskProject(projects: TaskProject[], projectId: string | null) {
  return projects.find((project) => project.id === projectId) || null;
}

export function getDueInfo(task: Pick<ManagedTask, "due" | "time">) {
  if (!task.due) return { kind: "none" as DueKind, label: "No date" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${task.due}T00:00:00`);
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { kind: "overdue" as DueKind, label: `Overdue ${Math.abs(diff)}d` };
  if (diff === 0) return { kind: "today" as DueKind, label: task.time ? `Today ${task.time}` : "Due today" };
  if (diff === 1) return { kind: "upcoming" as DueKind, label: "Tomorrow" };

  return {
    kind: "upcoming" as DueKind,
    label: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

function matchesTask(
  task: ManagedTask,
  filters: { status: TaskStatusFilter; project: string; area: Area | "all"; query: string },
) {
  if (filters.status === "open" && task.done) return false;
  if (filters.status === "done" && !task.done) return false;
  if (filters.project !== "all") {
    if (filters.project === "none" ? Boolean(task.project) : task.project !== filters.project) return false;
  }
  if (filters.area !== "all" && task.area !== filters.area) return false;
  if (filters.query.trim() && !task.title.toLowerCase().includes(filters.query.trim().toLowerCase())) return false;
  return true;
}

export function groupTasks(tasks: ManagedTask[], projects: TaskProject[], groupBy: TaskGroupBy): ManagedTaskGroup[] {
  if (groupBy === "due") {
    return [
      { key: "overdue", label: "Overdue", area: null, items: tasks.filter((task) => getDueInfo(task).kind === "overdue") },
      { key: "today", label: "Today", area: null, items: tasks.filter((task) => getDueInfo(task).kind === "today") },
      { key: "upcoming", label: "Upcoming", area: null, items: tasks.filter((task) => getDueInfo(task).kind === "upcoming") },
      { key: "none", label: "No date", area: null, items: tasks.filter((task) => getDueInfo(task).kind === "none") },
    ].filter((group) => group.items.length > 0);
  }

  const projectGroups: ManagedTaskGroup[] = projects.map((project) => ({
    key: project.id,
    label: project.name,
    area: project.area,
    items: tasks.filter((task) => task.project === project.id),
  }));
  const noProject = tasks.filter((task) => !task.project);

  if (noProject.length) {
    projectGroups.push({ key: "none", label: "No project", area: null, items: noProject });
  }

  return projectGroups.filter((group) => group.items.length > 0);
}

function toMutationInput(draft: TaskDraft): TaskMutationInput {
  return {
    id: draft.id,
    title: draft.title,
    notes: draft.notes,
    area: draft.area,
    project: draft.project,
    due: draft.due,
    time: draft.time,
    repeat: draft.repeat,
    priority: draft.priority,
    done: draft.done,
    top3: draft.top3,
    reminder: draft.reminder,
    note: draft.note,
  };
}

function replaceTask(tasks: ManagedTask[], next: ManagedTask) {
  return tasks.map((task) => (task.id === next.id ? next : task));
}

export function useTasksState({ initialTasks, areas, projects, actions }: UseTasksStateOptions) {
  const [tasks, setTasks] = useState<ManagedTask[]>(initialTasks);
  const [status, setStatus] = useState<TaskStatusFilter>("open");
  const [project, setProject] = useState("all");
  const [area, setArea] = useState<Area | "all">("all");
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<TaskGroupBy>("project");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => tasks.filter((task) => matchesTask(task, { status, project, area, query })),
    [tasks, status, project, area, query],
  );
  const groups = useMemo(() => groupTasks(visible, projects, groupBy), [visible, projects, groupBy]);
  const selectedTask =
    selectedId === "new" ? newTaskDraft(areas[0]?.key || "work") : tasks.find((task) => task.id === selectedId) || null;

  const closeTask = () => {
    setSelectedId(null);
    setExpanded(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const nextDone = !task.done;
    setError(null);
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, done: nextDone } : item)));

    startTransition(async () => {
      const result = await actions.toggleTaskStatus(id, nextDone);
      if (result.ok && result.task) {
        setTasks((current) => replaceTask(current, result.task));
      } else if (!result.ok) {
        setTasks((current) => current.map((item) => (item.id === id ? { ...item, done: task.done } : item)));
        setError(result.error);
      }
    });
  };

  const openTask = (id: string) => {
    setError(null);
    setSelectedId(id);
    setExpanded(false);
  };

  const openNewTask = () => {
    setError(null);
    setSelectedId("new");
    setExpanded(false);
  };

  const saveTask = (draft: TaskDraft) => {
    if (!draft.title.trim()) return;

    setError(null);
    const input = toMutationInput(draft);
    const currentSelectedId = selectedId;

    startTransition(async () => {
      const result =
        currentSelectedId === "new"
          ? await actions.createTask(input)
          : await actions.updateTask({ ...input, id: currentSelectedId || input.id });

      if (result.ok && result.task) {
        setTasks((current) =>
          currentSelectedId === "new" ? [result.task, ...current] : replaceTask(current, result.task),
        );
        closeTask();
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  };

  const deleteTask = () => {
    if (!selectedId || selectedId === "new") return;

    const taskId = selectedId;
    setError(null);

    startTransition(async () => {
      const result = await actions.deleteTask(taskId);
      if (result.ok) {
        setTasks((current) => current.filter((task) => task.id !== taskId));
        closeTask();
      } else {
        setError(result.error);
      }
    });
  };

  return {
    tasks,
    visible,
    groups,
    areas,
    projects,
    status,
    setStatus,
    project,
    setProject,
    area,
    setArea,
    query,
    setQuery,
    groupBy,
    setGroupBy,
    selectedId,
    selectedTask,
    expanded,
    setExpanded,
    error,
    isPending,
    toggleTask,
    openTask,
    openNewTask,
    closeTask,
    saveTask,
    deleteTask,
  };
}

export type TasksState = ReturnType<typeof useTasksState>;
