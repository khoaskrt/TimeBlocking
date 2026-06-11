"use client";

import { Search, Plus } from "lucide-react";
import { Sidebar, type SidebarUser } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { AreaDot } from "@/components/shared/area-dot";
import { useTasksState } from "@/lib/features/tasks/use-tasks-state";
import type { Area, ManagedTask, TaskAreaOption, TaskGroupBy, TaskProject, TaskStatusFilter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createTask, deleteTask, toggleTaskStatus, updateTask } from "@/app/(dashboard)/tasks/actions";
import { TaskCardGroup } from "./task-card-group";
import { TaskDetailPanel } from "./task-detail-panel";

const STATUS_OPTIONS: { value: TaskStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

const GROUP_OPTIONS: { value: TaskGroupBy; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "due", label: "Due" },
];

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
      {children}
    </span>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex shrink-0 gap-0.5 rounded-lg bg-zinc-100 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-md px-3 text-[12px] font-semibold transition-colors",
              active ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({
  active,
  area,
  children,
  onClick,
}: {
  active: boolean;
  area?: Area;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
        active
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800",
      )}
    >
      {area ? <AreaDot area={area} size={6} mono={active} /> : null}
      {children}
    </button>
  );
}

function SearchBox({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <Search
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks..."
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
      />
    </label>
  );
}

function FilterChips({ state }: { state: ReturnType<typeof useTasksState> }) {
  return (
    <>
      <Chip
        active={state.project === "all" && state.area === "all"}
        onClick={() => {
          state.setProject("all");
          state.setArea("all");
        }}
      >
        All
      </Chip>
      <Chip active={state.project === "none"} onClick={() => state.setProject(state.project === "none" ? "all" : "none")}>
        No project
      </Chip>
      {state.projects.map((project) => (
        <Chip
          key={project.id}
          active={state.project === project.id}
          area={project.area}
          onClick={() => state.setProject(state.project === project.id ? "all" : project.id)}
        >
          {project.name}
        </Chip>
      ))}
      {state.areas.map((item) => (
        <Chip
          key={item.id}
          active={state.area === item.key}
          area={item.key}
          onClick={() => state.setArea(state.area === item.key ? "all" : item.key)}
        >
          {item.name}
        </Chip>
      ))}
    </>
  );
}

function DesktopTasks({ state }: { state: ReturnType<typeof useTasksState> }) {
  return (
    <div className="hidden flex-1 overflow-y-auto md:block">
      <div className="mx-auto max-w-[880px] px-10 py-8 pb-14">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Tasks</h1>
          <CountBadge>{state.visible.length}</CountBadge>
          <span className="flex-1" />
          <SearchBox value={state.query} onChange={state.setQuery} className="w-[220px]" />
          <button
            type="button"
            onClick={state.openNewTask}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-950 bg-zinc-950 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={14} strokeWidth={2.1} />
            New task
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-visible">
          <Segmented value={state.status} options={STATUS_OPTIONS} onChange={state.setStatus} />
          <div className="h-[18px] w-px shrink-0 bg-zinc-200" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <FilterChips state={state} />
          </div>
          <span className="shrink-0 text-[11.5px] text-zinc-400">Group by</span>
          <Segmented value={state.groupBy} options={GROUP_OPTIONS} onChange={state.setGroupBy} />
        </div>

        <div className="mt-5 flex flex-col gap-3.5">
          {state.groups.length ? (
            state.groups.map((group) => (
              <TaskCardGroup
                key={group.key}
                group={group}
                selectedId={state.selectedId}
                onToggleTask={state.toggleTask}
                onOpenTask={state.openTask}
                projects={state.projects}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-[13px] text-zinc-400">
              No tasks match these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileTasks({ state }: { state: ReturnType<typeof useTasksState> }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-zinc-50 md:hidden">
      <div className="shrink-0 px-4 pb-2 pt-14">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Tasks</h1>
          <CountBadge>{state.visible.length}</CountBadge>
          <span className="flex-1" />
          <button
            type="button"
            onClick={state.openNewTask}
            aria-label="New task"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-zinc-950 text-white"
          >
            <Plus size={17} strokeWidth={2.2} />
          </button>
        </div>
        <SearchBox value={state.query} onChange={state.setQuery} className="mt-3" />
      </div>

      <div className="shrink-0 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-stretch gap-1.5">
          <Segmented value={state.status} options={STATUS_OPTIONS} onChange={state.setStatus} />
          <div className="mx-1 w-px bg-zinc-200" />
          <Segmented value={state.groupBy} options={GROUP_OPTIONS} onChange={state.setGroupBy} />
          <div className="mx-1 w-px bg-zinc-200" />
          <FilterChips state={state} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-1">
        {state.groups.length ? (
          state.groups.map((group) => (
            <TaskCardGroup
              key={group.key}
              group={group}
              selectedId={null}
              onToggleTask={state.toggleTask}
              onOpenTask={state.openTask}
              projects={state.projects}
              mobile
            />
          ))
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-zinc-300 px-4 py-7 text-center text-[13px] text-zinc-400">
            No tasks match these filters.
          </div>
        )}
      </div>
    </div>
  );
}

export function TasksDashboard({
  user,
  initialTasks,
  areas,
  projects,
}: {
  user: SidebarUser;
  initialTasks: ManagedTask[];
  areas: TaskAreaOption[];
  projects: TaskProject[];
}) {
  const state = useTasksState({
    initialTasks,
    areas,
    projects,
    actions: { createTask, updateTask, toggleTaskStatus, deleteTask },
  });

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 font-[family-name:var(--font-inter)]">
      <Sidebar active="tasks" user={user} />
      <DesktopTasks state={state} />
      <MobileTasks state={state} />
      <TaskDetailPanel state={state} />
      <MobileTabBar active="tasks" />
    </div>
  );
}
