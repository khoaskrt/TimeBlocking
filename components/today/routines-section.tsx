"use client";

import type { RoutineItem } from "@/lib/types";
import { RoutinesView } from "./routines-section.view";

const BLOCKS = ["morning", "afternoon", "evening"] as const;

export interface RoutinesSectionProps {
  routines: Record<string, RoutineItem[]>;
  onToggleRoutine: (block: string, id: string) => void;
}

export function RoutinesSection({ routines, onToggleRoutine }: RoutinesSectionProps) {
  const all = BLOCKS.flatMap((b) => routines[b] || []);
  const doneCount = all.filter((i) => i.done).length;

  return (
    <RoutinesView
      routines={routines}
      doneCount={doneCount}
      totalCount={all.length}
      onToggleRoutine={onToggleRoutine}
    />
  );
}
