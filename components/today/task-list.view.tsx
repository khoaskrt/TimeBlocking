"use client";

import { Star, RefreshCw, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { RDCheckbox } from "@/components/shared/checkbox";
import { AreaDot } from "@/components/shared/area-dot";
import { AREA_META } from "@/lib/constants/areas";
import { TASK_META } from "@/lib/features/today/constants";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Design-safe zone ──────────────────────────────────────
   This file contains ONLY presentation (JSX + Tailwind).
   State logic lives in task-list.tsx (container).
   Do NOT add state, handlers, or business logic here.
   ────────────────────────────────────────────────────────── */

export interface TaskListViewProps {
  today: Task[];
  otherTasks: Task[];
  done: Task[];
  doneOpen: boolean;
  onSetDoneOpen: (open: boolean) => void;
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}

function TaskMeta({ task }: { task: Task }) {
  const m = TASK_META[task.id] || {};
  const flag = task.flag || m.flag;
  const recur = task.recur || m.recur;
  return (
    <div className="flex items-center gap-3 text-[11px] tracking-[0.05em] uppercase text-zinc-400 mt-0.5">
      <span className="inline-flex items-center gap-1.5">
        <AreaDot area={task.area} size={6} />
        {m.proj || task.project || AREA_META[task.area]?.label}
      </span>
      {flag && (
        <span className={cn(flag.startsWith("overdue") ? "font-semibold text-zinc-900" : "font-medium text-zinc-400")}>
          {flag}
        </span>
      )}
      {task.due && <span>{task.due}</span>}
      {recur && (
        <span className="inline-flex items-center gap-1">
          <RefreshCw size={10} strokeWidth={2} />
          {recur}
        </span>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggleTask,
  onToggleTop3,
}: {
  task: Task;
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}) {
  return (
    <div
      className="group flex items-start gap-3 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
      style={{ opacity: task.done ? 0.45 : 1 }}
    >
      <div className="pt-0.5">
        <RDCheckbox checked={task.done} onChange={() => onToggleTask(task.id)} size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[14.5px] text-zinc-900", task.done && "line-through")}>
          {task.title}
        </div>
        <TaskMeta task={task} />
      </div>
      <div className="pt-1">
        <span
          onClick={(e) => { e.stopPropagation(); onToggleTop3(task.id); }}
          className={cn(
            "cursor-pointer transition-all hover:scale-110",
            task.top3 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Star
            size={15}
            strokeWidth={1.75}
            fill={task.top3 ? "#18181B" : "none"}
            stroke={task.top3 ? "#18181B" : "#A1A1AA"}
          />
        </span>
      </div>
    </div>
  );
}

function ViewAll() {
  return (
    <span className="text-[11.5px] text-zinc-400 inline-flex items-center gap-1 cursor-pointer hover:underline">
      View all <ArrowRight size={11} strokeWidth={2} />
    </span>
  );
}

function Hr() {
  return <div className="h-px bg-zinc-100 my-5" />;
}

export function TaskListView({
  today,
  otherTasks,
  done,
  doneOpen,
  onSetDoneOpen,
  onToggleTask,
  onToggleTop3,
}: TaskListViewProps) {
  return (
    <div>
      {/* Today tasks */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 whitespace-nowrap">
          Today · {today.length}
        </span>
        <span className="flex-1" />
        <ViewAll />
      </div>
      <div className="mt-1">
        {today.map((t) => <TaskRow key={t.id} task={t} onToggleTask={onToggleTask} onToggleTop3={onToggleTop3} />)}
      </div>

      <Hr />

      {/* All open */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 whitespace-nowrap">
          All open · {otherTasks.length}
        </span>
        <span className="flex-1" />
        <ViewAll />
      </div>
      <div className="mt-1">
        {otherTasks.map((t) => <TaskRow key={t.id} task={t} onToggleTask={onToggleTask} onToggleTop3={onToggleTop3} />)}
      </div>

      {/* Completed */}
      {done.length > 0 && (
        <>
          <Hr />
          <div
            onClick={() => onSetDoneOpen(!doneOpen)}
            className="flex items-center gap-1.5 text-[12px] text-zinc-400 cursor-pointer hover:underline"
          >
            {doneOpen ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
            Completed · {done.length}
          </div>
          {doneOpen && done.map((t) => <TaskRow key={t.id} task={t} onToggleTask={onToggleTask} onToggleTop3={onToggleTop3} />)}
        </>
      )}
    </div>
  );
}
