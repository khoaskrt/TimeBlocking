"use client";

import { useState } from "react";
import type { Routine, RoutineGroup, RoutineGroupId, RoutinesViewMode } from "@/lib/types";
import { GROUP_LABELS, GROUP_ORDER, HIST_DAYS } from "./constants";
import { computeStats } from "./derive";
import { buildInitialRoutines } from "./mock-data";

export function useRoutinesState() {
  const [items, setItems] = useState<Routine[]>(buildInitialRoutines);
  const [view, setView] = useState<RoutinesViewMode>("today");

  const toggle = (id: string) =>
    setItems((xs) =>
      xs.map((it) => {
        if (it.id !== id) return it;
        const done = [...it.done];
        done[0] = !done[0];
        return { ...it, done };
      }),
    );

  const rename = (id: string, label: string) =>
    setItems((xs) =>
      xs.map((it) => (it.id === id ? { ...it, label: label.trim() || it.label } : it)),
    );

  const remove = (id: string) => setItems((xs) => xs.filter((it) => it.id !== id));

  const add = (group: RoutineGroupId, label: string) =>
    setItems((xs) => [
      ...xs,
      {
        id: "n" + Date.now(),
        label: label.trim(),
        group,
        freq: "daily",
        done: new Array<boolean>(HIST_DAYS).fill(false),
      },
    ]);

  const groups: RoutineGroup[] = GROUP_ORDER.map((g) => ({
    id: g,
    label: GROUP_LABELS[g],
    items: items.filter((it) => it.group === g),
  }));

  return { items, groups, view, setView, toggle, rename, remove, add, stats: computeStats(items) };
}

export type RoutinesState = ReturnType<typeof useRoutinesState>;
