"use client";

import { useState, useTransition } from "react";
import type { Routine, RoutineFrequency, RoutineGroup, RoutineGroupId, RoutineRecurrence, RoutinesViewMode } from "@/lib/types";
import { GROUP_LABELS, GROUP_ORDER, HIST_DAYS } from "./constants";
import { type RoutineActionResult, type RoutineMutationInput, todayISO } from "./data";
import { computeStats } from "./derive";

export type RoutineEditor =
  | { mode: "new" }
  | { mode: "edit"; id: string }
  | null;

export type RoutineDraft = {
  label: string;
  desc: string;
  group: RoutineGroupId;
  freq: RoutineFrequency;
  recurrence: RoutineRecurrence | null;
  time: string;
  remind: boolean;
  goal: NonNullable<Routine["goal"]>;
  goalDays: string;
};

export function routineToDraft(item?: Routine | null): RoutineDraft {
  return {
    label: item?.label || "",
    desc: item?.desc || "",
    group: item?.group || "morning",
    freq: item?.freq || "daily",
    recurrence: item?.recurrence || null,
    time: item?.time || "",
    remind: Boolean(item?.remind && item?.time),
    goal: item?.goal || "ongoing",
    goalDays: item?.goalDays || "",
  };
}

export type RoutineActions = {
  createRoutine: (input: RoutineMutationInput) => Promise<RoutineActionResult>;
  updateRoutine: (input: RoutineMutationInput) => Promise<RoutineActionResult>;
  deleteRoutine: (routineId: string) => Promise<RoutineActionResult>;
  renameRoutine: (routineId: string, label: string) => Promise<RoutineActionResult>;
  toggleRoutineLog: (routineId: string, date: string, completed: boolean) => Promise<RoutineActionResult>;
  quickCreateRoutine: (group: string, label: string) => Promise<RoutineActionResult>;
};

export function useRoutinesState({
  initialItems,
  actions,
}: {
  initialItems: Routine[];
  actions: RoutineActions;
}) {
  const [items, setItems] = useState<Routine[]>(initialItems);
  const [view, setView] = useState<RoutinesViewMode>("today");
  const [editor, setEditor] = useState<RoutineEditor>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const patchRoutine = (routine: Routine) =>
    setItems((xs) => xs.map((item) => (item.id === routine.id ? routine : item)));

  const toggle = (id: string) => {
    const routine = items.find((item) => item.id === id);
    if (!routine) return;

    const done = [...routine.done];
    done[0] = !done[0];
    const nextDone = done[0];
    setError(null);
    setItems((xs) =>
      xs.map((it) => {
        if (it.id !== id) return it;
        return { ...it, done };
      }),
    );

    startTransition(async () => {
      const result = await actions.toggleRoutineLog(id, todayISO(), nextDone);
      if (result.ok && result.routine) {
        patchRoutine(result.routine);
      } else {
        patchRoutine(routine);
        setError(result.ok ? "Routine was updated but could not be loaded." : result.error);
      }
    });
  };

  const rename = (id: string, label: string) => {
    const routine = items.find((item) => item.id === id);
    if (!routine) return;

    const nextLabel = label.trim() || routine.label;
    setError(null);
    setItems((xs) =>
      xs.map((it) => (it.id === id ? { ...it, label: nextLabel } : it)),
    );

    startTransition(async () => {
      const result = await actions.renameRoutine(id, nextLabel);
      if (result.ok && result.routine) {
        patchRoutine(result.routine);
      } else {
        patchRoutine(routine);
        setError(result.ok ? "Routine was updated but could not be loaded." : result.error);
      }
    });
  };

  const remove = (id: string) => {
    const previous = items;
    setError(null);
    setItems((xs) => xs.filter((it) => it.id !== id));

    startTransition(async () => {
      const result = await actions.deleteRoutine(id);
      if (!result.ok) {
        setItems(previous);
        setError(result.error);
      }
    });
  };

  const add = (group: RoutineGroupId, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const tempId = `n${Date.now()}`;
    setError(null);
    setItems((xs) => [
      ...xs,
      {
        id: tempId,
        label: trimmed,
        group,
        freq: "daily",
        recurrence: null,
        done: new Array<boolean>(HIST_DAYS).fill(false),
      },
    ]);

    startTransition(async () => {
      const result = await actions.quickCreateRoutine(group, trimmed);
      if (result.ok && result.routine) {
        setItems((xs) => xs.map((item) => (item.id === tempId ? result.routine : item)));
      } else {
        setItems((xs) => xs.filter((item) => item.id !== tempId));
        setError(result.ok ? "Routine was created but could not be loaded." : result.error);
      }
    });
  };

  const openNewRoutine = () => setEditor({ mode: "new" });
  const openRoutine = (id: string) => setEditor({ mode: "edit", id });
  const closeEditor = () => setEditor(null);

  const saveRoutine = (draft: RoutineDraft, id?: string | null) => {
    const patch = {
      label: draft.label.trim(),
      desc: draft.desc.trim(),
      group: draft.group,
      freq: draft.freq,
      recurrence: draft.recurrence,
      time: draft.time,
      remind: Boolean(draft.remind && draft.time),
      goal: draft.goal,
      goalDays: draft.goal === "custom" ? draft.goalDays : "",
    };

    if (!patch.label) return;

    setError(null);

    if (id) {
      const previous = items;
      setItems((xs) => xs.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      setEditor(null);
      setView("today");

      startTransition(async () => {
        const result = await actions.updateRoutine({ id, ...patch });
        if (result.ok && result.routine) {
          patchRoutine(result.routine);
        } else {
          setItems(previous);
          setError(result.ok ? "Routine was updated but could not be loaded." : result.error);
        }
      });
    } else {
      const tempId = `n${Date.now()}`;
      setItems((xs) => [
        ...xs,
        {
          id: tempId,
          ...patch,
          done: new Array<boolean>(HIST_DAYS).fill(false),
        },
      ]);
      setEditor(null);
      setView("today");

      startTransition(async () => {
        const result = await actions.createRoutine(patch);
        if (result.ok && result.routine) {
          setItems((xs) => xs.map((item) => (item.id === tempId ? result.routine : item)));
        } else {
          setItems((xs) => xs.filter((item) => item.id !== tempId));
          setError(result.ok ? "Routine was created but could not be loaded." : result.error);
        }
      });
    }
  };

  const deleteRoutine = (id: string) => {
    remove(id);
    setEditor(null);
  };

  const groups: RoutineGroup[] = GROUP_ORDER.map((g) => ({
    id: g,
    label: GROUP_LABELS[g],
    items: items.filter((it) => it.group === g),
  }));

  return {
    items,
    groups,
    view,
    setView,
    toggle,
    rename,
    remove,
    add,
    editor,
    error,
    openNewRoutine,
    openRoutine,
    closeEditor,
    saveRoutine,
    deleteRoutine,
    stats: computeStats(items),
  };
}

export type RoutinesState = ReturnType<typeof useRoutinesState>;
