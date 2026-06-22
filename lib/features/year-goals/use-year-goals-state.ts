"use client";

import { useState, useTransition, useEffect } from "react";
import type { Area, YearGoal } from "@/lib/types";
import type { YearGoalActionResult, YearGoalMutationInput } from "./data";

export type YearGoalActions = {
  createYearGoal: (input: YearGoalMutationInput) => Promise<YearGoalActionResult>;
  updateYearGoal: (input: YearGoalMutationInput) => Promise<YearGoalActionResult>;
  archiveYearGoal: (goalId: string) => Promise<YearGoalActionResult>;
  reorderYearGoals: (goalIds: string[]) => Promise<YearGoalActionResult>;
  setYearGoalFocus: (goalId: string, isFocus: boolean) => Promise<YearGoalActionResult>;
};

function tempGoal(input: YearGoalMutationInput): YearGoal {
  const now = new Date().toISOString();

  return {
    id: `temp-${crypto.randomUUID()}`,
    title: input.title.trim(),
    note: input.note?.trim() || "",
    year: new Date().getFullYear(),
    area: input.project?.area || input.area || null,
    project: input.project || null,
    isFocus: Boolean(input.isFocus),
    order: Number.MAX_SAFE_INTEGER,
    createdAt: now,
    updatedAt: now,
  };
}

function ordered(goals: YearGoal[]) {
  return [...goals].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function resequence(goals: YearGoal[]) {
  return goals.map((goal, index) => ({ ...goal, order: index + 1 }));
}

export function useYearGoalsState({
  initialGoals,
  actions,
}: {
  initialGoals: YearGoal[];
  actions: YearGoalActions;
}) {
  const [goals, setGoals] = useState<YearGoal[]>(ordered(initialGoals));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setGoals(ordered(initialGoals));
  }, [initialGoals]);

  const createGoal = (input: YearGoalMutationInput) => {
    const goal = tempGoal(input);
    const before = goals;
    setError(null);
    setGoals((items) => resequence([...items, goal]));

    startTransition(async () => {
      const result = await actions.createYearGoal(input);
      if (!result.ok) {
        setGoals(before);
        setError(result.error);
        return;
      }
      if (!result.goal) return;
      setGoals((items) => ordered(items.map((item) => (item.id === goal.id ? result.goal : item))));
    });
  };

  const updateGoal = (input: YearGoalMutationInput) => {
    if (!input.id) return;

    const before = goals;
    setError(null);
    setGoals((items) =>
      items.map((goal) =>
        goal.id === input.id
          ? {
              ...goal,
              title: input.title.trim(),
              note: input.note?.trim() || "",
              area: (input.project?.area || input.area || null) as Area | null,
              project: input.project || null,
              isFocus: Boolean(input.isFocus),
              updatedAt: new Date().toISOString(),
            }
          : goal,
      ),
    );

    startTransition(async () => {
      const result = await actions.updateYearGoal(input);
      if (!result.ok) {
        setGoals(before);
        setError(result.error);
        return;
      }
      if (!result.goal) return;
      setGoals((items) => ordered(items.map((goal) => (goal.id === input.id ? result.goal : goal))));
    });
  };

  const archiveGoal = (goalId: string) => {
    const before = goals;
    setError(null);
    setGoals((items) => resequence(items.filter((goal) => goal.id !== goalId)));

    startTransition(async () => {
      const result = await actions.archiveYearGoal(goalId);
      if (!result.ok) {
        setGoals(before);
        setError(result.error);
      }
    });
  };

  const setFocus = (goalId: string, isFocus: boolean) => {
    const before = goals;
    setError(null);
    setGoals((items) => items.map((goal) => (goal.id === goalId ? { ...goal, isFocus } : goal)));

    startTransition(async () => {
      const result = await actions.setYearGoalFocus(goalId, isFocus);
      if (!result.ok) {
        setGoals(before);
        setError(result.error);
        return;
      }
      if (!result.goal) return;
      setGoals((items) => ordered(items.map((goal) => (goal.id === goalId ? result.goal : goal))));
    });
  };

  const moveGoal = (goalId: string, direction: -1 | 1) => {
    const index = goals.findIndex((goal) => goal.id === goalId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= goals.length) return;

    const before = goals;
    const next = [...goals];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const sequenced = resequence(next);
    setError(null);
    setGoals(sequenced);

    startTransition(async () => {
      const result = await actions.reorderYearGoals(sequenced.map((goal) => goal.id));
      if (!result.ok) {
        setGoals(before);
        setError(result.error);
        return;
      }
      if (!result.goals) return;
      setGoals(result.goals);
    });
  };

  return {
    goals,
    error,
    createGoal,
    updateGoal,
    archiveGoal,
    setFocus,
    moveGoal,
  };
}

export type YearGoalsState = ReturnType<typeof useYearGoalsState>;
