"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { TaskListView } from "./task-list.view";

export interface TaskListProps {
  top3: Task[];
  todayTasks: Task[];
  otherTasks: Task[];
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}

export function TaskList({ top3, todayTasks, otherTasks, onToggleTask, onToggleTop3 }: TaskListProps) {
  const [doneOpen, setDoneOpen] = useState(true);

  const today = todayTasks.filter((t) => !t.done);
  const done = [...top3, ...todayTasks].filter((t) => t.done);

  return (
    <TaskListView
      today={today}
      otherTasks={otherTasks}
      done={done}
      doneOpen={doneOpen}
      onSetDoneOpen={setDoneOpen}
      onToggleTask={onToggleTask}
      onToggleTop3={onToggleTop3}
    />
  );
}
