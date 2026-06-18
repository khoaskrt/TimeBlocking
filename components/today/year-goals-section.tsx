"use client";

import { FormEvent, useMemo, useState } from "react";
import { Archive, Check, ChevronDown, ChevronUp, Pencil, Plus, Star, Target, X } from "lucide-react";
import type { Area, TaskAreaOption, YearGoal, YearGoalProject } from "@/lib/types";
import { YEAR_GOAL_ACTIVE_MAX } from "@/lib/features/year-goals/data";
import type { YearGoalsState } from "@/lib/features/year-goals/use-year-goals-state";
import { AreaDot } from "@/components/shared/area-dot";
import { SectionLabel } from "@/components/shared/section-label";
import { cn } from "@/lib/utils";

function IconButton({
  children,
  label,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  );
}

function GoalForm({
  goal,
  areas,
  projects,
  onCancel,
  onSubmit,
}: {
  goal?: YearGoal;
  areas: TaskAreaOption[];
  projects: YearGoalProject[];
  onCancel: () => void;
  onSubmit: (input: { title: string; note: string; area: Area | null; projectId: string | null; project: YearGoalProject | null; isFocus: boolean }) => void;
}) {
  const [title, setTitle] = useState(goal?.title || "");
  const [note, setNote] = useState(goal?.note || "");
  const [area, setArea] = useState<Area | "">(goal?.project ? "" : goal?.area || "");
  const [projectId, setProjectId] = useState(goal?.project?.id || "");
  const [isFocus, setIsFocus] = useState(Boolean(goal?.isFocus));
  const selectedProject = projects.find((project) => project.id === projectId) || null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, note, area: selectedProject ? null : area || null, projectId: selectedProject?.id || null, project: selectedProject, isFocus });
  };

  return (
    <form onSubmit={submit} className="mt-2 rounded-lg border border-zinc-200 bg-white p-2.5">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={120}
        placeholder="What matters by December?"
        className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
      />
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={180}
        rows={2}
        placeholder="A quiet why, optional"
        className="mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-zinc-700 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
      />
      <div className="mt-2 flex items-center gap-2">
        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-[12px] font-medium text-zinc-600 outline-none focus:border-zinc-400"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setIsFocus((value) => !value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
            isFocus
              ? "border-zinc-300 bg-zinc-100 text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50",
          )}
        >
          <Star size={13} strokeWidth={2} className={isFocus ? "fill-zinc-700 text-zinc-700" : ""} />
          Focus
        </button>
      </div>
      <select
        value={selectedProject ? "" : area}
        onChange={(event) => setArea(event.target.value as Area | "")}
        disabled={Boolean(selectedProject)}
        className="mt-2 h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-[12px] font-medium text-zinc-600 outline-none transition-colors focus:border-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        <option value="">{selectedProject ? "Using project area" : "No area"}</option>
        {areas.map((item) => (
          <option key={item.id} value={item.key}>
            {item.name}
          </option>
        ))}
      </select>
      <div className="mt-2.5 flex justify-end gap-1">
        <IconButton label="Cancel" onClick={onCancel}>
          <X size={14} strokeWidth={2} />
        </IconButton>
        <button
          type="submit"
          className="inline-flex size-7 items-center justify-center rounded-md bg-zinc-900 text-white transition-colors hover:bg-zinc-700"
          aria-label="Save goal"
          title="Save goal"
        >
          <Check size={14} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}

function GoalRow({
  goal,
  areas,
  projects,
  index,
  total,
  editing,
  onEdit,
  onCancel,
  onSave,
  onArchive,
  onMove,
  onFocus,
}: {
  goal: YearGoal;
  areas: TaskAreaOption[];
  projects: YearGoalProject[];
  index: number;
  total: number;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (input: { title: string; note: string; area: Area | null; projectId: string | null; project: YearGoalProject | null; isFocus: boolean }) => void;
  onArchive: () => void;
  onMove: (direction: -1 | 1) => void;
  onFocus: (isFocus: boolean) => void;
}) {
  if (editing) {
    return (
      <div>
        <GoalForm goal={goal} areas={areas} projects={projects} onCancel={onCancel} onSubmit={onSave} />
        <button
          type="button"
          onClick={onArchive}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <Archive size={13} strokeWidth={2} />
          Archive
        </button>
      </div>
    );
  }
  const rowArea = goal.project?.area || goal.area || null;

  return (
    <div
      className={cn(
        "group rounded-lg border px-3 py-2.5 transition-colors",
        goal.isFocus ? "border-zinc-300 bg-zinc-50" : "border-transparent bg-white hover:border-zinc-200",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onFocus(!goal.isFocus)}
          className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={goal.isFocus ? "Remove focus" : "Mark as focus"}
          title={goal.isFocus ? "Remove focus" : "Mark as focus"}
        >
          <Star size={13} strokeWidth={2} className={goal.isFocus ? "fill-zinc-700 text-zinc-700" : ""} />
        </button>
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 items-center gap-1.5">
            {rowArea ? <AreaDot area={rowArea} size={6} /> : null}
            <div className="truncate text-[13.5px] font-medium leading-snug text-zinc-900">{goal.title}</div>
          </div>
          {goal.project ? (
            <div className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.05em] text-zinc-400">
              {goal.project.name}
            </div>
          ) : null}
          {goal.note ? <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">{goal.note}</div> : null}
        </button>
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton label="Edit goal" onClick={onEdit}>
            <Pencil size={13} strokeWidth={2} />
          </IconButton>
          <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp size={14} strokeWidth={2} />
          </IconButton>
          <IconButton label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ChevronDown size={14} strokeWidth={2} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export function YearGoalsSection({
  state,
  areas,
  projects,
  compact = false,
}: {
  state: YearGoalsState;
  areas: TaskAreaOption[];
  projects: YearGoalProject[];
  compact?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(compact);
  const visibleGoals = useMemo(() => state.goals.slice(0, YEAR_GOAL_ACTIVE_MAX), [state.goals]);
  const previewGoal = visibleGoals.find((goal) => goal.isFocus) || visibleGoals[0];

  const content = (
    <>
      {state.error ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] leading-relaxed text-red-600">
          {state.error}
        </div>
      ) : null}

      {!visibleGoals.length && !adding ? (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-zinc-400">
          Write the few things Future You will thank you for.
        </p>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {visibleGoals.map((goal, index) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            areas={areas}
            projects={projects}
            index={index}
            total={visibleGoals.length}
            editing={editingId === goal.id}
            onEdit={() => {
              setAdding(false);
              setEditingId(goal.id);
            }}
            onCancel={() => setEditingId(null)}
            onSave={(input) => {
              state.updateGoal({ ...input, id: goal.id });
              setEditingId(null);
            }}
            onArchive={() => {
              state.archiveGoal(goal.id);
              setEditingId(null);
            }}
            onMove={(direction) => state.moveGoal(goal.id, direction)}
            onFocus={(isFocus) => state.setFocus(goal.id, isFocus)}
          />
        ))}
      </div>

      {adding ? (
          <GoalForm
          areas={areas}
          projects={projects}
          onCancel={() => setAdding(false)}
          onSubmit={(input) => {
            state.createGoal(input);
            setAdding(false);
          }}
        />
      ) : null}
    </>
  );

  return (
    <section className={cn(compact && "rounded-xl border border-zinc-200 bg-zinc-50 p-3")}>
      <SectionLabel
        icon={<Target size={13} strokeWidth={2} className="text-zinc-400" />}
        count={visibleGoals.length || undefined}
        right={
          <div className="flex items-center gap-0.5">
            {compact ? (
              <IconButton label={collapsed ? "Expand year goals" : "Collapse year goals"} onClick={() => setCollapsed((value) => !value)}>
                {collapsed ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronUp size={14} strokeWidth={2} />}
              </IconButton>
            ) : null}
            <IconButton
              label="Add year goal"
              disabled={adding || visibleGoals.length >= YEAR_GOAL_ACTIVE_MAX}
              onClick={() => {
                setEditingId(null);
                setAdding(true);
                setCollapsed(false);
              }}
            >
              <Plus size={14} strokeWidth={2} />
            </IconButton>
          </div>
        }
      >
        This year
      </SectionLabel>

      {compact && collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mt-2 flex w-full min-w-0 items-center gap-2 text-left"
        >
          {previewGoal?.project?.area || previewGoal?.area ? <AreaDot area={(previewGoal.project?.area || previewGoal.area) as Area} size={6} /> : null}
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-700">
            {previewGoal ? previewGoal.title : "Write one thing worth returning to."}
          </span>
        </button>
      ) : (
        content
      )}
    </section>
  );
}
