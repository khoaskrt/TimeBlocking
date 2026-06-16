"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Clock, Flame, Plus } from "lucide-react";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionLabel } from "@/components/shared/section-label";
import * as routineActions from "@/app/(dashboard)/routines/actions";
import {
  routineToDraft,
  useRoutinesState,
  type RoutineDraft,
  type RoutinesState,
} from "@/lib/features/routines/use-routines-state";
import { FREQ_META, GROUP_LABELS, WEEKDAY_CHIPS, WEEKDAY_LABELS, WEEKLY_FREQUENCIES } from "@/lib/features/routines/constants";
import { formatRecurrenceLabel, isRoutineScheduled, routineStreak, todayLabel, weekDays, type WeekDay } from "@/lib/features/routines/derive";
import type { Routine, RoutineFrequency, RoutineGroup, RoutineRecurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FreqTag } from "./freq-tag";
import { RoutineRow } from "./routine-row";
import { Sparkline } from "./sparkline";
import { StreakFlame } from "./streak-flame";
import { ViewToggle } from "./view-toggle";

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
      {children}
    </span>
  );
}

function HeaderMeta({
  done,
  total,
  dateLabel,
}: {
  done: number;
  total: number;
  dateLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 tabular-nums">
      <span>
        {done}/{total} today
      </span>
      <span className="text-zinc-300">·</span>
      <span>{dateLabel}</span>
      <span className="text-zinc-300 max-sm:hidden">·</span>
      <span className="inline-flex items-center gap-1 max-sm:hidden">
        <Clock size={12} strokeWidth={2} className="text-zinc-400" />
        <LiveClock />
      </span>
    </span>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      {now
        ? now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--"}
    </>
  );
}

function StatsBanner({ state }: { state: ReturnType<typeof useRoutinesState> }) {
  const divider = <div className="hidden w-px self-stretch bg-zinc-100 md:block" />;

  return (
    <section className="mt-5 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(24,24,27,0.04)] sm:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <div className="shrink-0 md:w-[120px]">
          <div className="text-[36px] font-bold leading-none tracking-tight text-zinc-950 tabular-nums">
            {state.stats.rate30}
            <span className="text-[20px] font-semibold text-zinc-400">%</span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-500">
            30-day rate · 7-day {state.stats.rate7}%
          </div>
        </div>
        {divider}
        <div className="min-w-0 flex-1">
          <Sparkline data={state.stats.spark} height={42} />
          <div className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-300">
            Last 30 days · daily completion
          </div>
        </div>
        {divider}
        <div className="flex shrink-0 items-center gap-2.5 md:w-[138px]">
          <Flame size={22} strokeWidth={1.8} className="text-amber-500" />
          <div>
            <div className="text-[20px] font-bold leading-none tracking-tight text-zinc-950 tabular-nums">
              {state.stats.streak} {state.stats.streak === 1 ? "day" : "days"}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">Current streak</div>
          </div>
        </div>
        {divider}
        <div className="shrink-0 md:w-32">
          <div className="text-[20px] font-bold leading-none tracking-tight text-zinc-950 tabular-nums">
            {state.stats.todayDone}/{state.stats.todayTotal}
          </div>
          <div className="mb-2 mt-1 text-[11px] text-zinc-500">Done today</div>
          <ProgressBar value={state.stats.todayDone} max={state.stats.todayTotal} />
        </div>
      </div>
    </section>
  );
}

function RoutineError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
      {message}
    </div>
  );
}

function EmptyRoutineNote() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-5 text-[13px] text-zinc-500">
      No routines yet. Create one to start tracking your day.
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13.5px] text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

type FrequencySelectValue = RoutineFrequency | "custom";

function weeklyFrequencyForDow(dow: number): RoutineFrequency {
  return WEEKLY_FREQUENCIES[dow];
}

function defaultRecurrence(): RoutineRecurrence {
  return {
    interval: 1,
    unit: "week",
    daysOfWeek: [new Date().getDay()],
    ends: { mode: "never" },
  };
}

function frequencyOptions(current: RoutineFrequency): { value: FrequencySelectValue; label: string }[] {
  const weeklyToday = weeklyFrequencyForDow(new Date().getDay());
  const options: { value: FrequencySelectValue; label: string }[] = [
    { value: "daily", label: FREQ_META.daily.label },
    { value: "weekdays", label: FREQ_META.weekdays.label },
    { value: "weekends", label: FREQ_META.weekends.label },
    { value: "mwf", label: FREQ_META.mwf.label },
    { value: weeklyToday, label: FREQ_META[weeklyToday].label },
  ];

  if (current.startsWith("weekly_") && current !== weeklyToday) {
    options.push({ value: current, label: FREQ_META[current].label });
  }

  options.push({ value: "custom", label: "Custom..." });
  return options;
}

function CustomRecurrenceEditor({
  value,
  onChange,
}: {
  value: RoutineRecurrence;
  onChange: (value: RoutineRecurrence) => void;
}) {
  const set = (patch: Partial<RoutineRecurrence>) => onChange({ ...value, ...patch });
  const setEnds = (patch: Partial<RoutineRecurrence["ends"]>) =>
    onChange({ ...value, ends: { ...value.ends, ...patch } });
  const selectedDays = value.daysOfWeek?.length ? value.daysOfWeek : [new Date().getDay()];

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((current) => current !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    set({ daysOfWeek: next.length ? next : [day] });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-zinc-600">Repeat every</span>
        <input
          className={cn(inputClass, "h-9 w-16 bg-white text-center")}
          type="number"
          min="1"
          value={value.interval}
          onChange={(event) => set({ interval: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })}
        />
        <select
          className={cn(inputClass, "h-9 w-28 bg-white")}
          value={value.unit}
          onChange={(event) => {
            const unit = event.target.value as RoutineRecurrence["unit"];
            set({ unit, daysOfWeek: unit === "week" ? selectedDays : undefined });
          }}
        >
          <option value="day">day</option>
          <option value="week">week</option>
          <option value="month">month</option>
        </select>
      </div>

      {value.unit === "week" ? (
        <div className="mt-3">
          <div className="mb-2 text-[12.5px] text-zinc-600">Repeat on</div>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_CHIPS.map((label, day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={`${label}-${day}`}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                    active ? "bg-zinc-950 text-white" : "bg-white text-zinc-500 hover:bg-zinc-100",
                  )}
                  aria-label={WEEKDAY_LABELS[day]}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 text-[12.5px] text-zinc-600">Ends</div>
        <div className="grid gap-2">
          {(["never", "on", "after"] as const).map((mode) => (
            <label key={mode} className="flex min-h-9 items-center gap-2.5 text-[13px] text-zinc-700">
              <input
                type="radio"
                checked={value.ends.mode === mode}
                onChange={() => setEnds({ mode })}
                className="h-4 w-4 accent-zinc-950"
              />
              <span className="w-12 capitalize">{mode}</span>
              {mode === "on" ? (
                <input
                  className={cn(inputClass, "h-9 max-w-40 bg-white")}
                  type="date"
                  disabled={value.ends.mode !== "on"}
                  value={value.ends.date || ""}
                  onChange={(event) => setEnds({ date: event.target.value })}
                />
              ) : null}
              {mode === "after" ? (
                <input
                  className={cn(inputClass, "h-9 max-w-28 bg-white")}
                  type="number"
                  min="1"
                  disabled={value.ends.mode !== "after"}
                  value={value.ends.occurrences || 1}
                  onChange={(event) =>
                    setEnds({ occurrences: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })
                  }
                />
              ) : null}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-[11.5px] leading-relaxed text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function RoutineForm({
  initial,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: RoutineDraft;
  isNew: boolean;
  onSave: (draft: RoutineDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<RoutineDraft>(initial);
  const valid = draft.label.trim().length > 0;
  const frequencyValue: FrequencySelectValue = draft.recurrence ? "custom" : draft.freq;
  const goalHint =
    draft.goal === "ongoing"
      ? "No goal, keeps running indefinitely."
      : draft.goal === "custom"
        ? "Streak completes when it reaches your target."
        : `Streak completes at ${draft.goal} days.`;

  return (
    <div className="flex flex-col gap-5">
      <Field label="Name" required>
        <input
          autoFocus={isNew}
          className={cn(inputClass, "px-3 py-2.5 text-[15px]")}
          value={draft.label}
          onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          placeholder="e.g. Read for 20 minutes"
        />
      </Field>

      <Field label="Description">
        <textarea
          className={cn(inputClass, "min-h-[84px] resize-y leading-relaxed")}
          value={draft.desc}
          onChange={(event) => setDraft((current) => ({ ...current, desc: event.target.value }))}
          placeholder="Optional, context, what counts, why you're tracking it..."
          rows={3}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Time of day">
          <select
            className={inputClass}
            value={draft.group}
            onChange={(event) =>
              setDraft((current) => ({ ...current, group: event.target.value as RoutineDraft["group"] }))
            }
          >
            {Object.entries(GROUP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Specific time (optional)" hint="Leave empty for anytime.">
          <input
            className={inputClass}
            type="time"
            value={draft.time}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                time: event.target.value,
                remind: event.target.value ? current.remind : false,
              }))
            }
          />
        </Field>
      </div>

      <button
        type="button"
        disabled={!draft.time}
        onClick={() => draft.time && setDraft((current) => ({ ...current, remind: !current.remind }))}
        className={cn(
          "flex items-center gap-2.5 self-start text-[13.5px] text-zinc-900",
          !draft.time && "cursor-not-allowed opacity-45",
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border",
            draft.remind && draft.time ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-white",
          )}
        >
          {draft.remind && draft.time ? <span className="h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-white" /> : null}
        </span>
        Remind me at this time
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Frequency" hint="Days this routine is scheduled.">
          <select
            className={inputClass}
            value={frequencyValue}
            onChange={(event) => {
              const value = event.target.value as FrequencySelectValue;
              setDraft((current) =>
                value === "custom"
                  ? { ...current, freq: "daily", recurrence: current.recurrence || defaultRecurrence() }
                  : { ...current, freq: value, recurrence: null },
              );
            }}
          >
            {frequencyOptions(draft.freq).map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Streak goal" hint={goalHint}>
          <div className="flex gap-2">
            <select
              className={cn(inputClass, "min-w-0 flex-1")}
              value={draft.goal}
              onChange={(event) =>
                setDraft((current) => ({ ...current, goal: event.target.value as RoutineDraft["goal"] }))
              }
            >
              <option value="ongoing">Ongoing (no end)</option>
              <option value="7">7 days</option>
              <option value="21">21 days</option>
              <option value="30">30 days</option>
              <option value="custom">Custom...</option>
            </select>
            {draft.goal === "custom" ? (
              <input
                className={cn(inputClass, "w-20 shrink-0")}
                type="number"
                min="1"
                value={draft.goalDays}
                onChange={(event) => setDraft((current) => ({ ...current, goalDays: event.target.value }))}
                placeholder="Days"
              />
            ) : null}
          </div>
        </Field>
      </div>

      {draft.recurrence ? (
        <Field label="Custom recurrence" hint={formatRecurrenceLabel(draft.recurrence)}>
          <CustomRecurrenceEditor
            value={draft.recurrence}
            onChange={(recurrence) => setDraft((current) => ({ ...current, recurrence }))}
          />
        </Field>
      ) : null}

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(draft)}
          className={cn(
            "h-8 rounded-lg border border-zinc-950 bg-zinc-950 px-3.5 text-[13px] font-medium text-white",
            !valid && "cursor-not-allowed opacity-40",
          )}
        >
          {isNew ? "Create routine" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 rounded-lg px-3 text-[13px] font-medium text-zinc-500 hover:bg-zinc-100"
        >
          Cancel
        </button>
        <span className="flex-1" />
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="h-8 rounded-lg px-3 text-[13px] font-medium text-red-600 hover:bg-red-50"
          >
            Delete routine
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RoutineEditorPage({ state }: { state: RoutinesState }) {
  if (!state.editor) return null;

  const editor = state.editor;
  const item = editor.mode === "edit" ? state.items.find((routine) => routine.id === editor.id) : null;
  const isNew = editor.mode === "new";

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-zinc-50">
      <div className="mx-auto max-w-[620px] px-10 py-8 pb-14">
        <button
          type="button"
          onClick={state.closeEditor}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Routines
        </button>
        <div className="mt-7 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {isNew ? "Routines" : "Edit routine"}
        </div>
        <h1 className="mt-1.5 text-[28px] font-bold tracking-tight text-zinc-950">
          {isNew ? "New routine" : item?.label || "Edit routine"}
        </h1>
        <div className="my-6 h-px bg-zinc-200" />
        <RoutineForm
          initial={routineToDraft(item)}
          isNew={isNew}
          onCancel={state.closeEditor}
          onSave={(draft) => state.saveRoutine(draft, item?.id)}
          onDelete={item ? () => state.deleteRoutine(item.id) : undefined}
        />
      </div>
    </div>
  );
}

function AddRoutineRow({
  group,
  onAdd,
}: {
  group: RoutineGroup["id"];
  onAdd: (group: RoutineGroup["id"], label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (draft.trim()) onAdd(group, draft);
    setDraft("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-2 flex h-[34px] w-[calc(100%+16px)] items-center gap-2.5 rounded-lg px-2 text-left text-[13px] text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <span className="flex w-4 justify-center text-[17px] leading-none">+</span>
        Add routine
      </button>
    );
  }

  return (
    <div className="-mx-2 flex h-[38px] items-center gap-2.5 px-2">
      <span className="h-4 w-4 shrink-0 rounded border border-dashed border-zinc-300" />
      <input
        autoFocus
        value={draft}
        placeholder="New routine..."
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft("");
            setOpen(false);
          }
        }}
        className="min-w-0 flex-1 rounded-md bg-zinc-100 px-2 py-1.5 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400"
      />
      <span className="hidden text-[11px] text-zinc-300 sm:inline">Enter to save</span>
    </div>
  );
}

function RoutineGroupCard({
  group,
  state,
}: {
  group: RoutineGroup;
  state: ReturnType<typeof useRoutinesState>;
}) {
  const scheduled = group.items.filter((item) => isRoutineScheduled(item, 0));
  const done = scheduled.filter((item) => item.done[0]).length;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
      <SectionLabel
        right={
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {done}/{scheduled.length}
          </span>
        }
        className="mb-1"
      >
        {group.label}
      </SectionLabel>
      {group.items.map((item) => (
        <RoutineRow
          key={item.id}
          item={item}
          onToggle={state.toggle}
          onRename={state.rename}
          onRemove={state.remove}
          onEdit={state.openRoutine}
        />
      ))}
      <AddRoutineRow group={group.id} onAdd={state.add} />
    </section>
  );
}

function WeekCell({
  routine,
  day,
  onToggle,
}: {
  routine: Routine;
  day: WeekDay;
  onToggle: (id: string) => void;
}) {
  const scheduled = !day.isFuture && isRoutineScheduled(routine, day.daysAgo);
  const futureScheduled = day.isFuture && isRoutineScheduled(routine, day.daysAgo);

  if (day.isFuture) {
    return (
      <span
        className={cn(
          "h-[18px] w-[18px] rounded-[5px]",
          futureScheduled && "border border-dashed border-zinc-200",
        )}
      />
    );
  }

  if (!scheduled) {
    return <span className="h-1 w-1 rounded-full bg-zinc-300" />;
  }

  if (routine.done[day.daysAgo]) {
    return (
      <button
        type="button"
        onClick={day.isToday ? () => onToggle(routine.id) : undefined}
        className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-zinc-800 bg-zinc-800"
        aria-label={day.isToday ? `Toggle ${routine.label}` : undefined}
      >
        <span className="h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-white" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={day.isToday ? () => onToggle(routine.id) : undefined}
      className={cn(
        "h-[18px] w-[18px] rounded-[5px] border",
        day.isToday ? "border-zinc-300 bg-white hover:border-zinc-500" : "border-zinc-100 bg-zinc-100",
      )}
      aria-label={day.isToday ? `Toggle ${routine.label}` : undefined}
    />
  );
}

function WeekTable({ state }: { state: ReturnType<typeof useRoutinesState> }) {
  const days = weekDays();

  return (
    <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(24,24,27,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="min-w-[620px]">
        <div className="-mx-2 mb-1 flex items-center px-2">
          <span className="flex-1" />
          {days.map((day) => (
            <span key={day.daysAgo} className="flex w-[34px] shrink-0 flex-col items-center gap-px">
              <span className={cn("text-[10px] font-semibold tracking-[0.06em]", day.isToday ? "text-zinc-950" : "text-zinc-500")}>
                {day.label}
              </span>
              <span
                className={cn(
                  "flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[11px] tabular-nums",
                  day.isToday ? "bg-zinc-950 font-bold text-white" : "text-zinc-300",
                )}
              >
                {day.num}
              </span>
            </span>
          ))}
        </div>
        {state.groups.map((group) => (
          <div key={group.id}>
            <SectionLabel className="mb-0 mt-4">{group.label}</SectionLabel>
            {group.items.map((routine) => (
              <div key={routine.id} className="-mx-2 flex h-[38px] items-center rounded-lg px-2 hover:bg-zinc-100">
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate pr-3 text-[14px] text-zinc-900">
                  <span className="truncate">{routine.label}</span>
                  <FreqTag freq={routine.freq} recurrence={routine.recurrence} />
                </span>
                {days.map((day) => (
                  <span key={day.daysAgo} className="flex w-[34px] shrink-0 items-center justify-center">
                    <WeekCell routine={routine} day={day} onToggle={state.toggle} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileRoutineRow({
  item,
  state,
}: {
  item: Routine;
  state: ReturnType<typeof useRoutinesState>;
}) {
  const checked = item.done[0];
  const offToday = !isRoutineScheduled(item, 0);

  return (
    <div
      onClick={() => state.openRoutine(item.id)}
      className={cn(
        "-mx-1 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-1 transition-colors hover:bg-zinc-100",
        checked ? "opacity-55" : offToday ? "opacity-45" : "opacity-100",
      )}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          state.toggle(item.id);
        }}
        className={cn(
          "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] border",
          checked ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-white",
        )}
      >
        {checked ? <span className="h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-white" /> : null}
      </button>
      <span className={cn("min-w-0 flex-1 truncate text-[14px] text-zinc-900", checked && "line-through")}>
        {item.label}
      </span>
      <StreakFlame n={routineStreak(item)} size={12} />
    </div>
  );
}

function MobileRoutines({ state }: { state: ReturnType<typeof useRoutinesState> }) {
  const date = todayLabel();

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-zinc-50 md:hidden">
      <div className="shrink-0 px-4 pb-2 pt-14">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Routines</h1>
          <CountBadge>{state.items.length}</CountBadge>
          <span className="flex-1" />
          <ViewToggle value={state.view} onChange={state.setView} />
        </div>
        <p className="mt-1 text-[12.5px] text-zinc-500 tabular-nums">
          {state.stats.todayDone}/{state.stats.todayTotal} today · {date}
        </p>
        <RoutineError message={state.error} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-1">
        {state.view === "today" ? (
          <div className="flex flex-col gap-2">
            <StatsBanner state={state} />
            {!state.items.length ? <EmptyRoutineNote /> : null}
            {state.groups.map((group) => {
              const scheduled = group.items.filter((item) => isRoutineScheduled(item, 0));
              const done = scheduled.filter((item) => item.done[0]).length;

              return (
                <section key={group.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <SectionLabel
                    right={
                      <span className="text-[11px] text-zinc-500 tabular-nums">
                        {done}/{scheduled.length}
                      </span>
                    }
                    className="mb-1"
                  >
                    {group.label}
                  </SectionLabel>
                  {group.items.map((item) => (
                    <MobileRoutineRow key={item.id} item={item} state={state} />
                  ))}
                  <AddRoutineRow group={group.id} onAdd={state.add} />
                </section>
              );
            })}
          </div>
        ) : (
          <WeekTable state={state} />
        )}
      </div>
    </div>
  );
}

function DesktopRoutines({ state }: { state: ReturnType<typeof useRoutinesState> }) {
  const date = todayLabel();

  return (
    <main className="hidden flex-1 overflow-y-auto md:block">
      <div className="mx-auto max-w-[880px] px-10 py-8 pb-14">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Routines</h1>
          <CountBadge>{state.items.length}</CountBadge>
          <span className="flex-1" />
          <HeaderMeta done={state.stats.todayDone} total={state.stats.todayTotal} dateLabel={date} />
        </div>
        <RoutineError message={state.error} />
        <StatsBanner state={state} />
        <div className="mt-5 flex items-center gap-3">
          <ViewToggle value={state.view} onChange={state.setView} />
          <span className="flex-1" />
          <button
            type="button"
            onClick={state.openNewRoutine}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-950 bg-zinc-950 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={14} strokeWidth={2.1} />
            New routine
          </button>
        </div>
        <div className="mt-3.5 flex flex-col gap-3.5">
          {!state.items.length ? <EmptyRoutineNote /> : null}
          {state.view === "today"
            ? state.groups.map((group) => <RoutineGroupCard key={group.id} group={group} state={state} />)
            : <WeekTable state={state} />}
        </div>
      </div>
    </main>
  );
}

export function RoutinesDashboard({ initialRoutines }: { initialRoutines: Routine[] }) {
  const state = useRoutinesState({ initialItems: initialRoutines, actions: routineActions });

  return (
    <div className="relative flex-1 overflow-hidden">
      <DesktopRoutines state={state} />
      <MobileRoutines state={state} />
      <RoutineEditorPage state={state} />
    </div>
  );
}
