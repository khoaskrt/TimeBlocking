"use client";

import { ChevronRight, RefreshCw, Star } from "lucide-react";
import { AreaDot } from "@/components/shared/area-dot";
import { RDCheckbox } from "@/components/shared/checkbox";
import { AREA_META } from "@/lib/constants/areas";
import { getDueInfo, getTaskProject } from "@/lib/features/tasks/use-tasks-state";
import type { Area, ManagedTask, TaskProject } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskGroup = {
  key: string;
  label: string;
  area: Area | null;
  items: ManagedTask[];
};

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
      {children}
    </span>
  );
}

function TaskMeta({ task, projects }: { task: ManagedTask; projects: TaskProject[] }) {
  const due = getDueInfo(task);
  const project = getTaskProject(projects, task.project);

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-500">
        <AreaDot area={project?.area || task.area} size={6} />
        {project?.name || AREA_META[task.area]?.label}
      </span>
      <span
        className={cn(
          "text-[11.5px] font-medium",
          due.kind === "overdue" ? "font-semibold text-red-600" : due.kind === "today" ? "text-zinc-950" : "text-zinc-500",
        )}
      >
        {due.label}
      </span>
      {task.repeat ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] text-zinc-400">
          <RefreshCw size={11} strokeWidth={2} />
          {task.repeat}
        </span>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  selected,
  onToggleTask,
  onOpenTask,
  mobile,
  projects,
}: {
  task: ManagedTask;
  selected: boolean;
  onToggleTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  projects: TaskProject[];
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenTask(task.id)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg text-left transition-colors hover:bg-zinc-100",
        selected && "bg-zinc-100",
        mobile ? "px-0 py-2.5" : "-mx-2.5 px-2.5 py-2",
      )}
      style={{ opacity: task.done ? 0.55 : 1 }}
    >
      <span className="pt-0.5">
        <RDCheckbox checked={task.done} onChange={() => onToggleTask(task.id)} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[14px] font-[450] leading-snug text-zinc-950",
            task.done && "line-through",
          )}
        >
          {task.title}
        </span>
        <TaskMeta task={task} projects={projects} />
      </span>
      {task.top3 ? <Star size={14} strokeWidth={1.8} className="mt-1 text-zinc-400" /> : null}
      <ChevronRight size={14} strokeWidth={2} className="mt-1 shrink-0 text-zinc-300" />
    </button>
  );
}

export function TaskCardGroup({
  group,
  selectedId,
  onToggleTask,
  onOpenTask,
  projects,
  mobile = false,
}: {
  group: TaskGroup;
  selectedId: string | "new" | null;
  onToggleTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  projects: TaskProject[];
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <section className="mb-4">
        <div className="mb-1 flex items-center gap-1.5">
          {group.area ? <AreaDot area={group.area} size={6} /> : null}
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{group.label}</span>
          <span className="text-[11px] font-medium text-zinc-300">· {group.items.length}</span>
        </div>
        <div className="rounded-[14px] border border-zinc-200 bg-white px-3 py-1">
          {group.items.map((task, index) => (
            <div key={task.id} className={cn(index > 0 && "border-t border-zinc-100")}>
              <TaskRow
                task={task}
                selected={false}
                onToggleTask={onToggleTask}
                onOpenTask={onOpenTask}
                projects={projects}
                mobile
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 pb-2">
        {group.area ? <AreaDot area={group.area} size={7} /> : null}
        <span className="text-[13px] font-semibold text-zinc-950">{group.label}</span>
        <CountBadge>{group.items.length}</CountBadge>
      </div>
      <div className="-mx-4 h-px bg-zinc-100" />
      <div className="pt-1">
        {group.items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={selectedId === task.id}
            onToggleTask={onToggleTask}
            onOpenTask={onOpenTask}
            projects={projects}
          />
        ))}
      </div>
    </section>
  );
}
