"use client";

import type { Task } from "@/lib/types";
import { Top3View } from "./top3-section.view";

export interface Top3SectionProps {
  top3: Task[];
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}

export function Top3Section({ top3, onToggleTask, onToggleTop3 }: Top3SectionProps) {
  const spots: (Task | null)[] = [...top3];
  while (spots.length < 3) spots.push(null);

  return (
    <Top3View
      spots={spots}
      onToggleTask={onToggleTask}
      onToggleTop3={onToggleTop3}
    />
  );
}
