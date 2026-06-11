"use client";

import { useState, useTransition } from "react";
import { INITIAL_DATA } from "./mock-data";
import type { TaskActionResult } from "@/lib/features/tasks/data";
import type { Task, RoutineItem } from "@/lib/types";

export type TodayActions = {
  toggleTaskStatus: (taskId: string, done: boolean) => Promise<TaskActionResult>;
  setTaskTop3: (taskId: string, top3: boolean) => Promise<TaskActionResult>;
};

export function useTodayState({ initialTasks, actions }: { initialTasks: Task[]; actions: TodayActions }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [routines, setRoutines] = useState<Record<string, RoutineItem[]>>(INITIAL_DATA.routines);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const patchTask = (id: string, patch: Partial<Task>) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextDone = !task.done;
    setError(null);
    patchTask(id, { done: nextDone });

    startTransition(async () => {
      const result = await actions.toggleTaskStatus(id, nextDone);
      if (!result.ok) {
        patchTask(id, { done: task.done });
        setError(result.error);
      }
    });
  };

  const toggleTop3 = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!task.top3 && tasks.filter((t) => t.top3).length >= 3) return;

    const nextTop3 = !task.top3;
    setError(null);
    patchTask(id, { top3: nextTop3 });

    startTransition(async () => {
      const result = await actions.setTaskTop3(id, nextTop3);
      if (!result.ok) {
        patchTask(id, { top3: task.top3 });
        setError(result.error);
      }
    });
  };

  const toggleRoutine = (block: string, id: string) =>
    setRoutines((r) => ({
      ...r,
      [block]: r[block].map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    }));

  const top3 = tasks.filter((t) => t.top3);
  const todayTasks = tasks.filter((t) => t.today && !t.top3);
  const otherTasks = tasks.filter((t) => !t.today && !t.top3 && !t.done);

  return {
    tasks, top3, todayTasks, otherTasks, toggleTask, toggleTop3,
    routines, toggleRoutine, error,
  };
}

export type TodayState = ReturnType<typeof useTodayState>;
