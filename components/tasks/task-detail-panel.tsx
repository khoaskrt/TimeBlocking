"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronRight, X } from "lucide-react";
import { TASK_PRIORITIES, TASK_REMINDERS, TASK_REPEATS, type TaskDraft } from "@/lib/features/tasks/data";
import type { TasksState } from "@/lib/features/tasks/use-tasks-state";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13.5px] text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950";

function TaskForm({
  task,
  isNew,
  onSave,
  onDelete,
  state,
  big = false,
}: {
  task: TaskDraft;
  isNew: boolean;
  onSave: (draft: TaskDraft) => void;
  onDelete: () => void;
  state: TasksState;
  big?: boolean;
}) {
  const [draft, setDraft] = useState<TaskDraft>(task);

  const valid = draft.title.trim().length > 0;
  const createdLabel =
    !isNew && task.createdAt
      ? `Created ${new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : null;

  return (
    <div className={cn("flex flex-col", big ? "gap-5" : "gap-4")}>
      <Field label="Title (required)">
        <input
          className={cn(inputClass, big && "px-3 py-2.5 text-[15px]")}
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          placeholder="What needs doing?"
          autoFocus={isNew}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className={cn(inputClass, "min-h-[76px] resize-y leading-relaxed")}
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Add details..."
          rows={big ? 4 : 3}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date">
          <input
            className={inputClass}
            type="date"
            value={draft.due}
            onChange={(event) => setDraft((current) => ({ ...current, due: event.target.value }))}
          />
        </Field>
        <Field label="Due time">
          <input
            className={inputClass}
            type="time"
            value={draft.time}
            onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority">
          <select
            className={inputClass}
            value={draft.priority}
            onChange={(event) => setDraft((current) => ({ ...current, priority: Number(event.target.value) }))}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project">
          <select
            className={inputClass}
            value={draft.project || ""}
            onChange={(event) => setDraft((current) => ({ ...current, project: event.target.value || null }))}
          >
            <option value="">(none)</option>
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Area">
        <select
          className={inputClass}
          value={draft.area}
          onChange={(event) => {
            const nextArea = state.areas.find((item) => item.key === event.target.value)?.key;
            if (nextArea) setDraft((current) => ({ ...current, area: nextArea }));
          }}
        >
          {state.areas.map((area) => (
            <option key={area.id} value={area.key}>
              {area.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Linked note (optional, for library items)">
        <select
          className={inputClass}
          value={draft.note || ""}
          onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
        >
          <option value="">(none)</option>
        </select>
      </Field>

      <Field label="Remind me (requires a due time)">
        <select
          className={inputClass}
          value={draft.reminder || "No reminder"}
          onChange={(event) => setDraft((current) => ({ ...current, reminder: event.target.value }))}
        >
          {TASK_REMINDERS.map((reminder) => (
            <option key={reminder} value={reminder}>
              {reminder}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Repeat (recurring tasks roll forward on done)">
        <select
          className={inputClass}
          value={draft.repeat}
          onChange={(event) => setDraft((current) => ({ ...current, repeat: event.target.value }))}
        >
          {TASK_REPEATS.map((repeat) => (
            <option key={repeat || "none"} value={repeat}>
              {repeat || "Does not repeat"}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          disabled={!valid || state.isPending}
          onClick={() => valid && !state.isPending && onSave(draft)}
          className={cn(
            "h-8 rounded-lg border border-zinc-950 bg-zinc-950 px-3.5 text-[13px] font-medium text-white",
            (!valid || state.isPending) && "cursor-not-allowed opacity-40",
          )}
        >
          {state.isPending ? "Saving..." : isNew ? "Create task" : "Save"}
        </button>
        {!isNew ? (
          <button
            type="button"
            disabled={state.isPending}
            onClick={onDelete}
            className={cn(
              "h-8 rounded-lg px-3 text-[13px] font-medium text-zinc-500 hover:bg-zinc-100",
              state.isPending && "cursor-not-allowed opacity-40",
            )}
          >
            Delete
          </button>
        ) : null}
        <span className="flex-1" />
        {createdLabel ? <span className="text-[11.5px] text-zinc-400">{createdLabel}</span> : null}
      </div>
      {state.error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{state.error}</div> : null}
    </div>
  );
}

function PanelHeader({ state, isNew, task }: { state: TasksState; isNew: boolean; task: TaskDraft }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={state.closeTask}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => state.setExpanded(!state.expanded)}
          aria-label={state.expanded ? "Collapse" : "Expand"}
          title={state.expanded ? "Collapse to panel" : "Expand to full page"}
          className="hidden h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 md:flex"
        >
          {state.expanded ? <ChevronRight size={15} strokeWidth={2} /> : <ArrowUpRight size={15} strokeWidth={2} />}
        </button>
      </div>
      <div className="mt-4">
        <div
          className={cn(
            "mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]",
            task.done ? "text-emerald-500" : "text-zinc-400",
          )}
        >
          {isNew ? "New task" : task.done ? "Done" : "Open"}
        </div>
        <h2 className={cn("font-bold tracking-tight text-zinc-950", state.expanded ? "text-[26px]" : "text-[18px]")}>
          {isNew ? "Create a task" : task.title}
        </h2>
      </div>
    </>
  );
}

export function TaskDetailPanel({ state }: { state: TasksState }) {
  if (!state.selectedId || !state.selectedTask) return null;

  const isNew = state.selectedId === "new";
  const task = state.selectedTask;

  if (state.expanded) {
    return (
      <div className="absolute inset-0 z-50 hidden overflow-y-auto bg-zinc-50 md:block">
        <div className="mx-auto max-w-[620px] px-8 py-7 pb-12">
          <PanelHeader state={state} isNew={isNew} task={task} />
          <div className="my-5 h-px bg-zinc-200" />
          <TaskForm
            key={state.selectedId}
            task={task}
            isNew={isNew}
            state={state}
            big
            onSave={state.saveTask}
            onDelete={state.deleteTask}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex md:justify-end">
      <button
        type="button"
        aria-label="Close task details"
        className="absolute inset-0 bg-zinc-950/20"
        onClick={state.closeTask}
      />
      <div className="relative hidden h-full w-[420px] max-w-[88%] flex-col border-l border-zinc-200 bg-white shadow-[-16px_0_40px_-20px_rgba(24,24,27,0.25)] md:flex">
        <div className="shrink-0 px-[18px] pt-3.5">
          <PanelHeader state={state} isNew={isNew} task={task} />
          <div className="mt-4 h-px bg-zinc-100" />
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-[18px] pb-7">
          <TaskForm
            key={state.selectedId}
            task={task}
            isNew={isNew}
            state={state}
            onSave={state.saveTask}
            onDelete={state.deleteTask}
          />
        </div>
      </div>

      <div className="relative mt-auto flex max-h-[88%] w-full flex-col rounded-t-[18px] bg-white shadow-[0_-16px_40px_-16px_rgba(24,24,27,0.3)] md:hidden">
        <div className="shrink-0 px-4 pt-2.5">
          <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-zinc-300" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                  task.done ? "text-emerald-500" : "text-zinc-400",
                )}
              >
                {isNew ? "New task" : task.done ? "Done" : "Open"}
              </div>
              <h2 className="text-[17px] font-bold leading-snug tracking-tight text-zinc-950">
                {isNew ? "Create a task" : task.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={state.closeTask}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 h-px bg-zinc-100" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-7">
          <TaskForm
            key={state.selectedId}
            task={task}
            isNew={isNew}
            state={state}
            onSave={state.saveTask}
            onDelete={state.deleteTask}
          />
        </div>
      </div>
    </div>
  );
}
