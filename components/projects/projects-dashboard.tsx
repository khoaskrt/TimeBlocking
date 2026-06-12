"use client";

import { useState } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { RDCheckbox } from "@/components/shared/checkbox";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionLabel } from "@/components/shared/section-label";
import { AREA_META } from "@/lib/constants/areas";
import { PROJECT_COLORS, type ProjectEntry, type ProjectFormDraft, type ProjectTemplate } from "@/lib/features/projects/data";
import {
  daysLeft,
  formatHours,
  formatProjectDate,
  parseDuration,
  projectHours,
  projectPercent,
  type ProjectsState,
  useProjectsState,
} from "@/lib/features/projects/use-projects-state";
import { cn } from "@/lib/utils";

function CountBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">{children}</span>;
}

function Button({
  children,
  icon,
  variant = "secondary",
  size = "md",
  disabled,
  onClick,
  className,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-7 px-2.5" : "h-8 px-3.5",
        variant === "primary" && "border border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "secondary" && "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Dot({ color, size = 9 }: { color: string; size?: number }) {
  return <span className="shrink-0 rounded-full" style={{ width: size, height: size, backgroundColor: color }} />;
}

function Pill({ children, icon, dark }: { children: React.ReactNode; icon?: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium tabular-nums",
        dark ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-500",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function entryArea(entries: ProjectEntry[], entry: ProjectEntry) {
  if (entry.type === "area") return null;
  return entries.find((item) => item.id === entry.areaId && item.type === "area") || null;
}

function rowMeta(entries: ProjectEntry[], entry: ProjectEntry) {
  const bits: string[] = [];
  if (entry.type === "area") {
    const count = entries.filter((item) => item.type === "project" && item.areaId === entry.id).length;
    const open = entry.tasks.filter((task) => !task.done).length;
    bits.push("Area", `${count} ${count === 1 ? "project" : "projects"}`);
    if (open) bits.push(`${open} open ${open === 1 ? "task" : "tasks"}`);
    return bits;
  }

  const area = entryArea(entries, entry);
  if (area) bits.push(area.name);
  if (entry.engagement === "retainer") {
    bits.push(`${formatHours(projectHours(entry))} / ${formatHours(entry.monthly)} this month`);
  } else {
    bits.push(`${formatHours(projectHours(entry))} logged`);
    if (entry.milestones.length) bits.push(`${entry.milestones.filter((item) => item.done).length}/${entry.milestones.length} milestones`);
    if (entry.target) bits.push(`Target ${formatProjectDate(entry.target)}`);
  }
  return bits;
}

function listGroups(entries: ProjectEntry[], grouping: "status" | "area") {
  const projects = entries.filter((entry) => entry.type === "project");
  const areas = entries.filter((entry) => entry.type === "area");

  if (grouping === "area") {
    const groups = areas
      .map((area) => ({ id: area.id, label: area.name, items: projects.filter((project) => project.areaId === area.id) }))
      .filter((group) => group.items.length);
    const none = projects.filter((project) => !project.areaId);
    if (none.length) groups.push({ id: "none", label: "No area", items: none });
    groups.push({ id: "areas", label: "Areas", items: areas });
    return groups;
  }

  return [
    { id: "active", label: "Active projects", items: projects.filter((project) => project.engagement === "project") },
    { id: "retainers", label: "Retainers", items: projects.filter((project) => project.engagement === "retainer") },
    { id: "areas", label: "Areas", items: areas },
  ];
}

function ProjectRow({ entry, state, mobile = false }: { entry: ProjectEntry; state: ProjectsState; mobile?: boolean }) {
  const meta = rowMeta(state.entries, entry);
  const isRetainer = entry.engagement === "retainer";

  return (
    <button
      type="button"
      onClick={() => state.openEntry(entry.id)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-zinc-100",
        mobile ? "min-h-[52px] px-1.5 py-1" : "-mx-2 px-2 py-2.5",
      )}
    >
      <Dot color={entry.color} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium text-zinc-950">{entry.name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-zinc-400">{meta.join(" | ")}</span>
      </span>
      {entry.type === "project" ? (
        isRetainer ? (
          <span className="hidden w-14 sm:block">
            <ProgressBar value={projectHours(entry)} max={entry.monthly || 1} />
          </span>
        ) : (
          <span className="text-[12px] font-semibold tabular-nums text-zinc-500">{projectPercent(entry)}%</span>
        )
      ) : null}
      {isRetainer ? <Pill icon={<RefreshCw size={10} strokeWidth={2} />}>Retainer</Pill> : null}
      <ChevronRight size={15} strokeWidth={2} className="text-zinc-300" />
    </button>
  );
}

function ProjectsList({ state, mobile = false }: { state: ProjectsState; mobile?: boolean }) {
  const [grouping, setGrouping] = useState<"status" | "area">("status");
  const groups = listGroups(state.entries, grouping);

  return (
    <div className={cn("mx-auto w-full max-w-[880px]", mobile ? "px-4 pb-28 pt-14" : "px-10 py-8 pb-14")}>
      <div className="flex items-center gap-3">
        <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Projects</h1>
        <CountBadge>{state.entries.length}</CountBadge>
        <span className="flex-1" />
        {!mobile ? (
          <span className="text-[12.5px] tabular-nums text-zinc-400">
            {state.activeProjects.length} active | {state.entries.length} total
          </span>
        ) : null}
        <Button variant="secondary" icon={<BookOpen size={14} strokeWidth={2} />} onClick={state.openTemplates} className="hidden sm:inline-flex">
          Templates
        </Button>
        <Button variant="primary" icon={<Plus size={14} strokeWidth={2.2} />} onClick={() => state.openNew("project")}>
          {mobile ? null : "New project"}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
          {(["status", "area"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGrouping(item)}
              className={cn(
                "h-7 rounded-md px-3 text-[12px] font-semibold capitalize transition-colors",
                grouping === item ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <Button variant="secondary" icon={<Plus size={14} strokeWidth={2} />} onClick={() => state.openNew("area")}>
          New area
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-7">
        {groups.map((group) => (
          <section key={group.id}>
            <SectionLabel count={group.items.length}>{group.label}</SectionLabel>
            <div className={cn("mt-2", mobile && "rounded-[14px] border border-zinc-200 bg-white px-3 py-1")}>
              {group.items.map((entry) => (
                <ProjectRow key={entry.id} entry={entry} state={state} mobile={mobile} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400 hover:text-zinc-800"
    >
      <ChevronLeft size={14} strokeWidth={2} />
      {children}
    </button>
  );
}

function StatStrip({ entry }: { entry: ProjectEntry }) {
  const hours = projectHours(entry);
  const pct = projectPercent(entry);
  const left = daysLeft(entry.target);

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-[112px]">
        <div className="text-[24px] font-bold tracking-tight text-zinc-950">{formatHours(hours)}</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">{entry.quoted ? `of ${formatHours(entry.quoted)} quoted` : "logged"}</div>
      </div>
      <div className="hidden h-10 w-px bg-zinc-100 sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-bold tracking-tight text-zinc-950">{pct}%</span>
          <span className="text-[11.5px] text-zinc-400">weighted milestone progress</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={pct} max={100} />
        </div>
      </div>
      <div className="hidden h-10 w-px bg-zinc-100 sm:block" />
      <div className="min-w-[112px] sm:text-right">
        <div className="text-[24px] font-bold tracking-tight text-zinc-950">{entry.target ? formatProjectDate(entry.target) : "-"}</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">
          {entry.target && left !== null ? (left >= 0 ? `${left} days left` : `${Math.abs(left)} days overdue`) : "no target date"}
        </div>
      </div>
    </div>
  );
}

function CycleCard({ entry }: { entry: ProjectEntry }) {
  const done = entry.checklist.filter((item) => item.done).length;
  const hours = projectHours(entry);

  return (
    <div className="mt-5 grid gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 sm:grid-cols-[160px_1fr_1fr] sm:items-center sm:gap-6">
      <div>
        <div className="text-[17px] font-bold tracking-tight text-zinc-950">June cycle</div>
        <div className="mt-0.5 text-[11.5px] text-zinc-400">Resets Jul 1, history preserved</div>
      </div>
      <div>
        <div className="text-[17px] font-bold tabular-nums text-zinc-950">
          {done}/{entry.checklist.length} <span className="text-[11.5px] font-medium text-zinc-400">checklist</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={done} max={entry.checklist.length || 1} />
        </div>
      </div>
      <div>
        <div className="text-[17px] font-bold tabular-nums text-zinc-950">
          {formatHours(hours)} <span className="text-[11.5px] font-medium text-zinc-400">of {formatHours(entry.monthly)}</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={hours} max={entry.monthly || 1} />
        </div>
      </div>
    </div>
  );
}

function InlineAdd({ label, placeholder, onCommit }: { label: string; placeholder: string; onCommit: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const commit = () => {
    if (value.trim()) onCommit(value.trim());
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-2 flex h-9 w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 text-left text-[13px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Plus size={14} strokeWidth={2} />
        {label}
      </button>
    );
  }

  return (
    <div className="-mx-2 flex min-h-10 items-center gap-2 rounded-lg px-2">
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        className="h-8 min-w-0 flex-1 rounded-md bg-zinc-100 px-2.5 text-[13.5px] text-zinc-950 outline-none"
      />
      <span className="text-[11px] text-zinc-300">Enter</span>
    </div>
  );
}

function DetailSection({
  label,
  count,
  right,
  note,
  children,
}: {
  label: string;
  count?: number;
  right?: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0">
      <SectionLabel count={count} right={right}>
        {label}
      </SectionLabel>
      {note ? <p className="mt-1 text-[11.5px] text-zinc-400">{note}</p> : null}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ColorPicker({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Color</span>
      {PROJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Set color ${color}`}
          onClick={() => state.setColor(entry.id, color)}
          className={cn("h-[18px] w-[18px] rounded-full", entry.color === color && "ring-2 ring-zinc-950 ring-offset-2")}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function MilestonesSection({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const [editing, setEditing] = useState<string | null>(null);
  const pct = projectPercent(entry);

  return (
    <DetailSection
      label="Milestones"
      right={<span className="text-[11.5px] font-semibold tabular-nums text-zinc-500">{pct}%</span>}
    >
      <ProgressBar value={pct} max={100} />
      <div className="mt-2">
        {entry.milestones.map((milestone) =>
          editing === milestone.id ? (
            <MilestoneEditor
              key={milestone.id}
              milestone={milestone}
              onCancel={() => setEditing(null)}
              onDelete={() => {
                state.removeMilestone(entry.id, milestone.id);
                setEditing(null);
              }}
              onSave={(label, weight) => {
                state.updateMilestone(entry.id, milestone.id, { label, weight });
                setEditing(null);
              }}
            />
          ) : (
            <div
              key={milestone.id}
              className={cn(
                "-mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-2 transition-colors hover:bg-zinc-100",
                milestone.done && "opacity-55",
              )}
            >
              <RDCheckbox checked={milestone.done} onChange={() => state.toggleMilestone(entry.id, milestone.id)} />
              <span className={cn("min-w-0 flex-1 truncate text-[14px] text-zinc-950", milestone.done && "line-through")}>
                {milestone.label}
              </span>
              <Pill>weight {milestone.weight}</Pill>
              <Button variant="ghost" size="sm" onClick={() => setEditing(milestone.id)}>
                Edit
              </Button>
            </div>
          ),
        )}
        <AddMilestone entry={entry} state={state} />
      </div>
    </DetailSection>
  );
}

function MilestoneEditor({
  milestone,
  onSave,
  onCancel,
  onDelete,
}: {
  milestone: { label: string; weight: number };
  onSave: (label: string, weight: number) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(milestone.label);
  const [weight, setWeight] = useState(String(milestone.weight));

  return (
    <div className="-mx-2 my-1 flex flex-wrap items-center gap-2 rounded-lg bg-zinc-100 px-2 py-2">
      <input
        autoFocus
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        className="h-8 min-w-[220px] flex-1 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] outline-none focus:border-zinc-950"
      />
      <span className="text-[11px] text-zinc-400">weight</span>
      <input
        value={weight}
        onChange={(event) => setWeight(event.target.value.replace(/\D/g, ""))}
        className="h-8 w-14 rounded-md border border-zinc-200 bg-white px-2 text-center text-[13px] outline-none focus:border-zinc-950"
      />
      <Button variant="primary" size="sm" onClick={() => onSave(label.trim() || milestone.label, Math.max(1, Number.parseInt(weight, 10) || milestone.weight))}>
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="ghost" size="sm" icon={<Trash2 size={13} strokeWidth={2} />} onClick={onDelete} />
    </div>
  );
}

function AddMilestone({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [weight, setWeight] = useState("10");

  const add = () => {
    if (label.trim()) state.addMilestone(entry.id, label.trim(), Math.max(1, Number.parseInt(weight, 10) || 10));
    setLabel("");
    setWeight("10");
    setOpen(false);
  };

  if (!open) return <InlineAdd label="Add milestone" placeholder="Add milestone..." onCommit={(value) => state.addMilestone(entry.id, value, 10)} />;

  return (
    <div className="-mx-2 flex min-h-11 items-center gap-2 rounded-lg px-2">
      <input
        autoFocus
        value={label}
        placeholder="Add milestone..."
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") add();
          if (event.key === "Escape") setOpen(false);
        }}
        className="h-8 min-w-0 flex-1 rounded-md bg-zinc-100 px-2.5 text-[13.5px] outline-none"
      />
      <span className="text-[11px] text-zinc-400">weight</span>
      <input
        value={weight}
        onChange={(event) => setWeight(event.target.value.replace(/\D/g, ""))}
        className="h-8 w-12 rounded-md bg-zinc-100 px-2 text-center text-[13px] outline-none"
      />
      <Button variant="secondary" size="sm" onClick={add}>
        Add
      </Button>
    </div>
  );
}

function TasksSection({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const open = entry.tasks.filter((task) => !task.done).length;

  return (
    <DetailSection label="Open tasks" count={open} note="Linked-task behavior is represented locally in this prototype surface.">
      {entry.tasks.length ? (
        entry.tasks.map((task) => (
          <div key={task.id} className={cn("-mx-2 flex min-h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-zinc-100", task.done && "opacity-55")}>
            <RDCheckbox checked={task.done} onChange={() => state.toggleTask(entry.id, task.id)} />
            <span className={cn("min-w-0 flex-1 truncate text-[14px] text-zinc-950", task.done && "line-through")}>{task.title}</span>
            {task.due ? (
              <span className="inline-flex items-center gap-1 text-[12px] text-zinc-400">
                <Calendar size={12} strokeWidth={2} />
                {task.due}
              </span>
            ) : null}
          </div>
        ))
      ) : (
        <p className="py-2 text-[12.5px] italic text-zinc-400">No open tasks.</p>
      )}
      <InlineAdd label="Add task" placeholder="Add task..." onCommit={(value) => state.addTask(entry.id, value)} />
    </DetailSection>
  );
}

function TemplateMenu({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <Button variant="ghost" size="sm" icon={<BookOpen size={13} strokeWidth={2} />} onClick={() => setOpen((value) => !value)}>
        Load template
      </Button>
      {open ? (
        <>
          <button type="button" aria-label="Close template menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-60 overflow-hidden rounded-[10px] border border-zinc-200 bg-white shadow-lg">
            {state.templates.map((template) => (
              <button
                type="button"
                key={template.id}
                onClick={() => {
                  state.loadTemplate(entry.id, template.id);
                  setOpen(false);
                }}
                className="flex min-h-9 w-full items-center gap-2 px-3 text-left text-[13px] text-zinc-800 hover:bg-zinc-50"
              >
                <span className="min-w-0 flex-1 truncate">{template.name}</span>
                {template.monthly ? <RefreshCw size={12} strokeWidth={2} className="text-zinc-400" /> : null}
                <span className="text-[11px] text-zinc-400">{template.items.length}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </span>
  );
}

function ChecklistSection({ entry, state, retainer = false }: { entry: ProjectEntry; state: ProjectsState; retainer?: boolean }) {
  const done = entry.checklist.filter((item) => item.done).length;
  const [mode, setMode] = useState<"once" | "monthly">(retainer ? "monthly" : "once");

  return (
    <DetailSection
      label={retainer ? "Monthly checklist" : "Checklist"}
      right={
        <span className="inline-flex items-center gap-2">
          {entry.checklist.length ? <span className="text-[11px] tabular-nums text-zinc-400">{done}/{entry.checklist.length}</span> : null}
          <TemplateMenu entry={entry} state={state} />
        </span>
      }
      note={retainer ? "Monthly items reload at the start of the next cycle, with history preserved." : "Granular sub-steps that do not need to be full tasks."}
    >
      {entry.checklist.length ? (
        entry.checklist.map((item) => (
          <div key={item.id} className={cn("-mx-2 flex min-h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-zinc-100", item.done && "opacity-55")}>
            <RDCheckbox checked={item.done} onChange={() => state.toggleCheck(entry.id, item.id)} />
            <span className={cn("min-w-0 flex-1 truncate text-[14px] text-zinc-950", item.done && "line-through")}>{item.label}</span>
            {item.recurring ? <Pill icon={<RefreshCw size={10} strokeWidth={2} />}>Monthly</Pill> : null}
            <Button variant="ghost" size="sm" icon={<X size={13} strokeWidth={2} />} onClick={() => state.removeCheck(entry.id, item.id)} />
          </div>
        ))
      ) : (
        <p className="py-2 text-[12.5px] italic leading-relaxed text-zinc-400">No checklist yet. Load a template or add a custom item.</p>
      )}
      <div className="-mx-2 mt-1 flex min-h-10 items-center gap-2 px-2">
        <Plus size={14} strokeWidth={2} className="text-zinc-400" />
        <input
          placeholder="Add a checklist item..."
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.currentTarget.value.trim()) {
              state.addCheck(entry.id, event.currentTarget.value.trim(), mode === "monthly");
              event.currentTarget.value = "";
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-md bg-zinc-100 px-2.5 text-[13.5px] outline-none"
        />
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
          {(["once", "monthly"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn("h-7 rounded-md px-2.5 text-[12px] font-medium capitalize", mode === item ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </DetailSection>
  );
}

function ActivitySection({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const [kind, setKind] = useState<"work" | "update">("work");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("");
  const parsed = parseDuration(duration);
  const valid = note.trim() && (kind === "update" || parsed !== null);

  const log = () => {
    if (!valid) return;
    state.logActivity(entry.id, { kind, note: note.trim(), hours: kind === "work" ? parsed || 0 : 0 });
    setNote("");
    setDuration("");
  };

  return (
    <DetailSection label="Activity" count={entry.activity.length}>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
          {(["work", "update"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={cn("h-7 rounded-md px-3 text-[12px] font-semibold capitalize", kind === item ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500")}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            placeholder={kind === "work" ? "What did you work on?" : "Status note, decision, blocker..."}
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && log()}
            className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] outline-none focus:border-zinc-950"
          />
          {kind === "work" ? (
            <input
              value={duration}
              placeholder="1h30m"
              onChange={(event) => setDuration(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && log()}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-center text-[13px] outline-none focus:border-zinc-950 sm:w-20"
            />
          ) : null}
          <Button variant="primary" onClick={log} disabled={!valid}>
            Log
          </Button>
        </div>
        {kind === "work" ? <p className="mt-2 text-[11px] text-zinc-400">Use durations like 1h30m, 45m, or 1.5.</p> : null}
      </div>

      <div className="mt-3">
        {entry.activity.length ? (
          entry.activity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 border-b border-zinc-100 py-2.5 last:border-b-0">
              <span className="w-28 shrink-0 pt-0.5 text-[11.5px] tabular-nums text-zinc-400">{activity.when}</span>
              <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-zinc-800">{activity.note}</span>
              {activity.kind === "work" ? <Pill dark>{formatHours(activity.hours)}</Pill> : <Pill>Update</Pill>}
            </div>
          ))
        ) : (
          <p className="py-2 text-[12.5px] italic text-zinc-400">No activity yet.</p>
        )}
      </div>
    </DetailSection>
  );
}

function HistorySection({ entry }: { entry: ProjectEntry }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!entry.history?.length) return null;

  return (
    <DetailSection label="History" count={entry.history.length} note="Each month's checklist and hours are archived when the cycle resets.">
      {entry.history.map((month) => {
        const done = month.items.filter((item) => item.done).length;
        const expanded = open === month.month;

        return (
          <div key={month.month} className="border-b border-zinc-100 last:border-b-0">
            <button type="button" onClick={() => setOpen(expanded ? null : month.month)} className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 text-left hover:bg-zinc-100">
              {expanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
              <span className="flex-1 text-[14px] font-medium text-zinc-950">{month.month}</span>
              <span className="text-[12px] tabular-nums text-zinc-400">{done}/{month.items.length} checklist | {formatHours(month.hours)}</span>
            </button>
            {expanded ? (
              <div className="pb-3 pl-6">
                {month.items.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex min-h-8 items-center gap-2 text-[13px] text-zinc-500">
                    {item.done ? <Check size={13} strokeWidth={2.4} /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />}
                    {item.label}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </DetailSection>
  );
}

function AreaBody({ entry, state }: { entry: ProjectEntry; state: ProjectsState }) {
  const projects = state.entries.filter((project) => project.type === "project" && project.areaId === entry.id);

  return (
    <>
      <ColorPicker entry={entry} state={state} />
      <DetailSection label="In this area" count={projects.length}>
        {projects.map((project) => (
          <ProjectRow key={project.id} entry={project} state={state} />
        ))}
      </DetailSection>
      <TasksSection entry={entry} state={state} />
      <ChecklistSection entry={entry} state={state} />
      <ActivitySection entry={entry} state={state} />
    </>
  );
}

function EntryDetail({ state, mobile = false }: { state: ProjectsState; mobile?: boolean }) {
  const entry = state.selectedEntry;
  if (!entry) return null;

  const area = entryArea(state.entries, entry);
  const isRetainer = entry.engagement === "retainer";
  const eyebrow = entry.type === "area" ? "Area | ongoing" : `${area?.name || "No area"}${isRetainer ? " | Retainer" : ""}`;
  const right = isRetainer ? "June cycle | resets Jul 1" : entry.target ? `Target ${formatProjectDate(entry.target)}` : "";

  return (
    <div className={cn("mx-auto w-full max-w-[880px]", mobile ? "px-4 pb-28 pt-14" : "px-10 py-8 pb-14")}>
      <BackButton onClick={state.backToList}>All projects</BackButton>
      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">{eyebrow}</div>
        <div className="mt-1.5 flex items-start gap-3">
          <Dot color={entry.color} size={11} />
          <h1 className={cn("min-w-0 flex-1 font-bold leading-tight tracking-tight text-zinc-950", mobile ? "text-[22px]" : "text-[28px]")}>
            {entry.name}
          </h1>
          {right && !mobile ? <span className="pt-1 text-[12.5px] text-zinc-400">{right}</span> : null}
        </div>
        {entry.desc ? <p className="mt-2 max-w-[65ch] text-[13.5px] leading-relaxed text-zinc-600">{entry.desc}</p> : null}
      </div>

      {entry.type === "area" ? (
        <AreaBody entry={entry} state={state} />
      ) : isRetainer ? (
        <>
          <ColorPicker entry={entry} state={state} />
          <CycleCard entry={entry} />
          <ChecklistSection entry={entry} state={state} retainer />
          <TasksSection entry={entry} state={state} />
          <ActivitySection entry={entry} state={state} />
          <HistorySection entry={entry} />
        </>
      ) : (
        <>
          <ColorPicker entry={entry} state={state} />
          <StatStrip entry={entry} />
          <MilestonesSection entry={entry} state={state} />
          <TasksSection entry={entry} state={state} />
          <ChecklistSection entry={entry} state={state} />
          <ActivitySection entry={entry} state={state} />
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-zinc-400">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13.5px] text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950";

function Choice({ active, title, sub, onClick }: { active: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[10px] border bg-white px-3.5 py-3 text-left transition-colors hover:bg-zinc-50",
        active ? "border-zinc-950 ring-1 ring-zinc-950" : "border-zinc-200",
      )}
    >
      <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.07em]", active ? "text-zinc-950" : "text-zinc-400")}>
        {title}
      </span>
      <span className="mt-1 block text-[13px] leading-snug text-zinc-600">{sub}</span>
    </button>
  );
}

function NewProject({ state, mobile = false }: { state: ProjectsState; mobile?: boolean }) {
  const [draft, setDraft] = useState<ProjectFormDraft>({
    type: state.route.view === "new" ? state.route.type || "project" : "project",
    engagement: "project",
    name: "",
    desc: "",
    area: "work",
    areaId: "",
    color: PROJECT_COLORS[0],
    start: "",
    target: "",
    quoted: "",
    monthly: "4",
    templateId: "",
  });

  const set = <K extends keyof ProjectFormDraft>(key: K, value: ProjectFormDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const isProject = draft.type === "project";
  const isRetainer = isProject && draft.engagement === "retainer";
  const valid = draft.name.trim().length > 0;

  return (
    <div className={cn("mx-auto w-full max-w-[640px]", mobile ? "px-4 pb-28 pt-14" : "px-10 py-8 pb-14")}>
      <BackButton onClick={state.backToList}>Projects</BackButton>
      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Capture</div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-zinc-950">New {isProject ? (isRetainer ? "retainer" : "project") : "area"}</h1>
      </div>

      <Field label="Type">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Choice active={isProject} title="Project" sub="Finite outcome, milestones, target date" onClick={() => set("type", "project")} />
          <Choice active={!isProject} title="Area" sub="Ongoing context, no finish line" onClick={() => set("type", "area")} />
        </div>
      </Field>

      <Field label="Name (required)">
        <input autoFocus className={inputClass} value={draft.name} placeholder={isProject ? "e.g. Fetter Pools SEO Project" : "e.g. Hill Media Group"} onChange={(event) => set("name", event.target.value)} />
      </Field>
      <Field label="Description">
        <textarea className={cn(inputClass, "min-h-20 resize-y")} value={draft.desc} placeholder="Optional. What does done look like?" onChange={(event) => set("desc", event.target.value)} />
      </Field>

      {isProject ? (
        <Field label="Engagement" hint={isRetainer ? "Retainers use monthly hours, recurring checklist items, and preserved history." : undefined}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Choice active={!isRetainer} title="Project" sub="Bounded, milestones, target date" onClick={() => set("engagement", "project")} />
            <Choice active={isRetainer} title="Retainer" sub="Ongoing, monthly hours, checklist" onClick={() => set("engagement", "retainer")} />
          </div>
        </Field>
      ) : null}

      {isProject ? (
        <Field label="Area">
          <select className={inputClass} value={draft.areaId} onChange={(event) => set("areaId", event.target.value)}>
            <option value="">(none)</option>
            {state.areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Life area">
          <select className={inputClass} value={draft.area} onChange={(event) => set("area", event.target.value as ProjectFormDraft["area"])}>
            {Object.entries(AREA_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </Field>
      )}

      {isProject && !isRetainer ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Start date">
            <input className={inputClass} type="date" value={draft.start} onChange={(event) => set("start", event.target.value)} />
          </Field>
          <Field label="Target date">
            <input className={inputClass} type="date" value={draft.target} onChange={(event) => set("target", event.target.value)} />
          </Field>
        </div>
      ) : null}

      {isProject && !isRetainer ? (
        <Field label="Quoted hours" hint="Optional, decimal OK. Logged work counts against this.">
          <input className={cn(inputClass, "w-44")} value={draft.quoted} placeholder="optional" onChange={(event) => set("quoted", event.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
      ) : null}

      {isRetainer ? (
        <Field label="Monthly hours" hint="Logged work fills this bar every month.">
          <input className={cn(inputClass, "w-44")} value={draft.monthly} onChange={(event) => set("monthly", event.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
      ) : null}

      {isProject ? (
        <Field label="Checklist template" hint="Loads template steps into the project checklist.">
          <select className={inputClass} value={draft.templateId} onChange={(event) => set("templateId", event.target.value)}>
            <option value="">(none)</option>
            {state.templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name} - {template.items.length} items{template.monthly ? " - monthly" : ""}</option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label="Color">
        <div className="flex flex-wrap gap-2 pt-1">
          {PROJECT_COLORS.map((color) => (
            <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => set("color", color)} className={cn("h-5 w-5 rounded-full", draft.color === color && "ring-2 ring-zinc-950 ring-offset-2")} style={{ backgroundColor: color }} />
          ))}
        </div>
      </Field>

      <div className="mt-7 flex items-center gap-2 border-t border-zinc-100 pt-5">
        <Button variant="primary" icon={<Plus size={14} strokeWidth={2} />} disabled={!valid} onClick={() => valid && state.createEntry(draft)}>
          Create {isProject ? (isRetainer ? "retainer" : "project") : "area"}
        </Button>
        <Button variant="ghost" onClick={state.backToList}>Cancel</Button>
      </div>
    </div>
  );
}

function TemplateCard({ template, state }: { template: ProjectTemplate; state: ProjectsState }) {
  const [open, setOpen] = useState(template.id === "tpl-web");

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-[52px] w-full items-center gap-2.5 px-4 text-left hover:bg-zinc-50">
        {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-zinc-950">{template.name}</span>
        {template.monthly ? <Pill icon={<RefreshCw size={10} strokeWidth={2} />}>Monthly</Pill> : null}
        <Pill>{template.items.length} items</Pill>
        <Button variant="ghost" size="sm" icon={<X size={13} strokeWidth={2} />} onClick={() => state.removeTemplate(template.id)} />
      </button>
      {open ? (
        <div className="border-t border-zinc-100 px-4 py-3 pl-10">
          {template.items.map((item, index) => (
            <div key={`${item}-${index}`} className="-mx-2 flex min-h-8 items-center gap-2 rounded-lg px-2 hover:bg-zinc-100">
              <span className="h-3.5 w-3.5 rounded border border-zinc-300" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-zinc-800">{item}</span>
              <Button variant="ghost" size="sm" icon={<X size={12} strokeWidth={2} />} onClick={() => state.removeTemplateItem(template.id, index)} />
            </div>
          ))}
          <InlineAdd label="Add item" placeholder="Add item..." onCommit={(value) => state.addTemplateItem(template.id, value)} />
        </div>
      ) : null}
    </div>
  );
}

function TemplatesPage({ state, mobile = false }: { state: ProjectsState; mobile?: boolean }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [monthly, setMonthly] = useState(false);

  const create = () => {
    if (!name.trim()) return;
    state.addTemplate(name.trim(), monthly);
    setName("");
    setMonthly(false);
    setCreating(false);
  };

  return (
    <div className={cn("mx-auto w-full max-w-[760px]", mobile ? "px-4 pb-28 pt-14" : "px-10 py-8 pb-14")}>
      <BackButton onClick={state.backToList}>Projects</BackButton>
      <div className="mt-5 flex items-center gap-3">
        <h1 className="text-[24px] font-bold tracking-tight text-zinc-950">Checklist templates</h1>
        <CountBadge>{state.templates.length}</CountBadge>
        <span className="flex-1" />
        <Button variant="primary" icon={<Plus size={14} strokeWidth={2} />} onClick={() => setCreating(true)}>
          New template
        </Button>
      </div>
      <p className="mt-2 max-w-[65ch] text-[13px] leading-relaxed text-zinc-500">Reusable checklists. Load one into any project or retainer instead of recreating the steps.</p>

      {creating ? (
        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center">
          <input autoFocus value={name} placeholder="Template name..." onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && create()} className={inputClass} />
          <label className="inline-flex items-center gap-2 text-[13px] text-zinc-600">
            <input type="checkbox" checked={monthly} onChange={(event) => setMonthly(event.target.checked)} />
            Monthly
          </label>
          <Button variant="primary" onClick={create} disabled={!name.trim()}>Create</Button>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        {state.templates.map((template) => (
          <TemplateCard key={template.id} template={template} state={state} />
        ))}
      </div>
    </div>
  );
}

function ProjectsContent({ state, mobile }: { state: ProjectsState; mobile: boolean }) {
  if (state.route.view === "entry") return <EntryDetail state={state} mobile={mobile} />;
  if (state.route.view === "new") return <NewProject state={state} mobile={mobile} />;
  if (state.route.view === "templates") return <TemplatesPage state={state} mobile={mobile} />;
  return <ProjectsList state={state} mobile={mobile} />;
}

export function ProjectsDashboard() {
  const state = useProjectsState();

  return (
    <>
      <div className="hidden flex-1 overflow-y-auto bg-zinc-50 md:block">
        <ProjectsContent state={state} mobile={false} />
      </div>
      <div className="flex min-h-dvh flex-1 flex-col bg-zinc-50 md:hidden">
        <ProjectsContent state={state} mobile />
      </div>
    </>
  );
}
