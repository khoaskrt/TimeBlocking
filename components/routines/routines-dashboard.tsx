"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock, Flame } from "lucide-react";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar, type SidebarUser } from "@/components/layout/sidebar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionLabel } from "@/components/shared/section-label";
import { useRoutinesState } from "@/lib/features/routines/use-routines-state";
import { isScheduled, routineStreak, todayLabel, weekDays, type WeekDay } from "@/lib/features/routines/derive";
import type { Routine, RoutineGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DaySquares } from "./day-squares";
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
  const scheduled = group.items.filter((item) => isScheduled(item.freq, 0));
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
  const scheduled = !day.isFuture && isScheduled(routine.freq, day.daysAgo);
  const futureScheduled = day.isFuture && isScheduled(routine.freq, day.daysAgo);

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
                  <FreqTag freq={routine.freq} />
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
  const offToday = !isScheduled(item.freq, 0);

  return (
    <div
      className={cn(
        "-mx-1 flex min-h-11 items-center gap-2.5 rounded-lg px-1 transition-colors hover:bg-zinc-100",
        checked ? "opacity-55" : offToday ? "opacity-45" : "opacity-100",
      )}
    >
      <button
        type="button"
        onClick={() => state.toggle(item.id)}
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
      <DaySquares routine={item} days={7} size={6} />
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
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-1">
        {state.view === "today" ? (
          <div className="flex flex-col gap-2">
            <StatsBanner state={state} />
            {state.groups.map((group) => {
              const scheduled = group.items.filter((item) => isScheduled(item.freq, 0));
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
        <StatsBanner state={state} />
        <div className="mt-5 flex items-center gap-3">
          <ViewToggle value={state.view} onChange={state.setView} />
          <span className="flex-1" />
          <span className="text-[11.5px] text-zinc-400">
            {state.view === "today" ? "Check off as you go, stats update live" : "This week, Monday to Sunday"}
          </span>
        </div>
        <div className="mt-3.5 flex flex-col gap-3.5">
          {state.view === "today"
            ? state.groups.map((group) => <RoutineGroupCard key={group.id} group={group} state={state} />)
            : <WeekTable state={state} />}
        </div>
      </div>
    </main>
  );
}

export function RoutinesDashboard({ user }: { user: SidebarUser }) {
  const state = useRoutinesState();

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 font-[family-name:var(--font-inter)]">
      <Sidebar active="routines" user={user} />
      <DesktopRoutines state={state} />
      <MobileRoutines state={state} />
      <MobileTabBar active="routines" />
    </div>
  );
}
