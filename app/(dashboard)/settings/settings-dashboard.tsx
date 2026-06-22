"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  FolderCheck,
  Layers3,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { SidebarUser } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type ThemeMode = "system" | "light" | "dark";
type WeekStart = "monday" | "sunday";
type CalendarState = "connected" | "reconnect" | "disconnected";

type AreaDraft = {
  key: "work" | "personal" | "family" | "health";
  name: string;
  color: string;
  active: boolean;
};

type TemplateDraft = {
  id: string;
  name: string;
  monthly: boolean;
  items: string[];
};

const TIMEZONES = ["Asia/Ho_Chi_Minh", "Asia/Singapore", "Asia/Bangkok", "UTC", "America/Los_Angeles"];
const AREA_COLORS = ["blue", "green", "purple", "orange", "red", "pink", "gray"];
const PRIORITIES = [
  { value: "1", label: "1 Urgent" },
  { value: "2", label: "2 High" },
  { value: "3", label: "3 Medium" },
  { value: "4", label: "4 Low" },
];

const INITIAL_AREAS: AreaDraft[] = [
  { key: "work", name: "Work", color: "blue", active: true },
  { key: "personal", name: "Personal", color: "green", active: true },
  { key: "family", name: "Family", color: "purple", active: true },
  { key: "health", name: "Health", color: "orange", active: true },
];

const INITIAL_TEMPLATES: TemplateDraft[] = [
  { id: "launch", name: "Project launch", monthly: false, items: ["Brief", "Milestones", "First delivery"] },
  { id: "retainer", name: "Monthly service", monthly: true, items: ["Report", "Maintenance", "Client note"] },
];

const COLOR_SWATCH: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
  pink: "bg-pink-500",
  gray: "bg-zinc-500",
};

function initials(name: string, email: string) {
  const source = name.trim() || email.trim() || "T";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-3 focus:ring-zinc-200/70 disabled:bg-zinc-50 disabled:text-zinc-400",
        props.className,
      )}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-3 focus:ring-zinc-200/70",
        props.className,
      )}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      title={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[22px] w-10 rounded-full border transition",
        checked ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-zinc-100",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-[16px] -translate-y-1/2 rounded-full bg-white shadow-sm transition",
          checked ? "left-[20px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid rounded-lg border border-zinc-200 bg-zinc-100 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 rounded-[7px] px-2 text-[13px] font-medium transition",
            option.value === value ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  icon,
  title,
  eyebrow,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">{icon}</div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-zinc-400">{eyebrow}</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-zinc-950">{title}</h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SaveBanner({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const content = {
    dirty: { icon: <Circle size={14} />, text: "Unsaved local changes", className: "border-amber-200 bg-amber-50 text-amber-700" },
    saving: { icon: <RefreshCw size={14} className="animate-spin" />, text: "Saving preview state", className: "border-blue-200 bg-blue-50 text-blue-700" },
    saved: { icon: <Check size={14} />, text: "Saved in this preview", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    error: { icon: <AlertCircle size={14} />, text: "Preview save failed. Try again.", className: "border-rose-200 bg-rose-50 text-rose-700" },
  }[state];

  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium", content.className)}>
      {content.icon}
      {content.text}
    </div>
  );
}

export function SettingsDashboard({ user }: { user: SidebarUser }) {
  const [displayName, setDisplayName] = useState(user.name);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [weekStart, setWeekStart] = useState<WeekStart>("monday");
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [defaultArea, setDefaultArea] = useState("work");
  const [defaultPriority, setDefaultPriority] = useState("4");
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [calendarState, setCalendarState] = useState<CalendarState>("connected");
  const [areas, setAreas] = useState(INITIAL_AREAS);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const activeAreaCount = areas.filter((area) => area.active).length;
  const monthlyTemplates = templates.filter((template) => template.monthly).length;

  const statusText = useMemo(() => {
    if (calendarState === "connected") return "Connected to Google Calendar";
    if (calendarState === "reconnect") return "Reconnect required";
    return "Not connected";
  }, [calendarState]);

  function markDirty() {
    setSaveState("dirty");
  }

  function savePreview() {
    setSaveState("saving");
    window.setTimeout(() => {
      setSaveState(Math.random() > 0.12 ? "saved" : "error");
    }, 650);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  function addTemplate() {
    setTemplates((current) => [
      ...current,
      {
        id: `template-${Date.now()}`,
        name: "New template",
        monthly: false,
        items: ["First step"],
      },
    ]);
    markDirty();
  }

  function updateTemplate(id: string, patch: Partial<TemplateDraft>) {
    setTemplates((current) => current.map((template) => (template.id === id ? { ...template, ...patch } : template)));
    markDirty();
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-zinc-50 px-4 pb-28 pt-5 md:px-7 md:pb-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400">
              <Settings size={14} />
              Workspace settings
            </div>
            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-zinc-950 md:text-[30px]">Settings</h1>
            <p className="mt-1 max-w-[620px] text-[14px] leading-6 text-zinc-500">
              Tune account details, planning defaults, integrations, and reusable project setup.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SaveBanner state={saveState} />
            <Button onClick={savePreview} disabled={saveState === "saving"} className="h-9">
              {saveState === "saving" ? <RefreshCw data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}
              Save changes
            </Button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5">
            <Section icon={<User size={17} />} eyebrow="Account" title="Profile">
              <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-950 text-[18px] font-bold text-white">
                  {initials(displayName, user.email)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Display name</FieldLabel>
                    <TextInput
                      value={displayName}
                      onChange={(event) => {
                        setDisplayName(event.target.value);
                        markDirty();
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Email</FieldLabel>
                    <TextInput value={user.email} disabled />
                  </div>
                </div>
              </div>
            </Section>

            <Section icon={<Clock3 size={17} />} eyebrow="Preferences" title="Planning defaults">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel>Timezone</FieldLabel>
                  <SelectInput
                    value={timezone}
                    onChange={(event) => {
                      setTimezone(event.target.value);
                      markDirty();
                    }}
                  >
                    {TIMEZONES.map((item) => <option key={item}>{item}</option>)}
                  </SelectInput>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Week starts on</FieldLabel>
                  <Segment
                    value={weekStart}
                    options={[
                      { value: "monday", label: "Monday" },
                      { value: "sunday", label: "Sunday" },
                    ]}
                    onChange={(value) => {
                      setWeekStart(value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Theme</FieldLabel>
                  <Segment
                    value={theme}
                    options={[
                      { value: "system", label: "System" },
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ]}
                    onChange={(value) => {
                      setTheme(value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Default area</FieldLabel>
                    <SelectInput
                      value={defaultArea}
                      onChange={(event) => {
                        setDefaultArea(event.target.value);
                        markDirty();
                      }}
                    >
                      {areas.map((area) => <option key={area.key} value={area.key}>{area.name}</option>)}
                    </SelectInput>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Priority</FieldLabel>
                    <SelectInput
                      value={defaultPriority}
                      onChange={(event) => {
                        setDefaultPriority(event.target.value);
                        markDirty();
                      }}
                    >
                      {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </SelectInput>
                  </div>
                </div>
              </div>
            </Section>

            <Section icon={<Palette size={17} />} eyebrow="Workspace" title="Areas">
              <div className="grid gap-3">
                {areas.map((area) => (
                  <div key={area.key} className={cn("grid gap-3 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]", !area.active && "bg-zinc-50 opacity-70")}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("size-3 rounded-full", COLOR_SWATCH[area.color])} />
                      <TextInput
                        value={area.name}
                        onChange={(event) => {
                          setAreas((current) => current.map((item) => item.key === area.key ? { ...item, name: event.target.value } : item));
                          markDirty();
                        }}
                        className="min-w-0"
                      />
                    </div>
                    <SelectInput
                      value={area.color}
                      onChange={(event) => {
                        setAreas((current) => current.map((item) => item.key === area.key ? { ...item, color: event.target.value } : item));
                        markDirty();
                      }}
                    >
                      {AREA_COLORS.map((color) => <option key={color}>{color}</option>)}
                    </SelectInput>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="text-[13px] text-zinc-500">{area.active ? "Active" : "Inactive"}</span>
                      <Toggle
                        checked={area.active}
                        label={`${area.name} active`}
                        onChange={(checked) => {
                          setAreas((current) => current.map((item) => item.key === area.key ? { ...item, active: checked } : item));
                          markDirty();
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={<FolderCheck size={17} />} eyebrow="Projects" title="Checklist templates">
              <div className="flex flex-col gap-3">
                {templates.length ? (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <TextInput
                          value={template.name}
                          onChange={(event) => updateTemplate(template.id, { name: event.target.value })}
                        />
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className={cn("rounded-full px-2 py-1 text-[12px] font-medium", template.monthly ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-500")}>
                            {template.monthly ? "Monthly" : "Project"}
                          </span>
                          <Toggle checked={template.monthly} label="Monthly template" onChange={(checked) => updateTemplate(template.id, { monthly: checked })} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setTemplates((current) => current.filter((item) => item.id !== template.id));
                              markDirty();
                            }}
                            title="Delete template"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.items.map((item) => (
                          <span key={item} className="rounded-full border border-zinc-200 px-2.5 py-1 text-[12px] text-zinc-500">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center">
                    <Layers3 className="mx-auto text-zinc-300" size={24} />
                    <p className="mt-2 text-[14px] font-semibold text-zinc-800">No templates yet</p>
                    <p className="mt-1 text-[13px] text-zinc-400">Create a reusable checklist for recurring project work.</p>
                  </div>
                )}
                <Button type="button" variant="outline" onClick={addTemplate} className="self-start">
                  <Plus data-icon="inline-start" />
                  Add template
                </Button>
              </div>
            </Section>
          </div>

          <aside className="flex flex-col gap-5">
            <Section icon={<CalendarDays size={17} />} eyebrow="Integrations" title="Google Calendar">
              <div className="space-y-4">
                <div className={cn(
                  "rounded-lg border px-3 py-2.5",
                  calendarState === "connected" && "border-emerald-200 bg-emerald-50",
                  calendarState === "reconnect" && "border-amber-200 bg-amber-50",
                  calendarState === "disconnected" && "border-zinc-200 bg-zinc-50",
                )}>
                  <div className="flex items-start gap-2">
                    {calendarState === "connected" ? <ShieldCheck className="mt-0.5 text-emerald-600" size={16} /> : <AlertCircle className="mt-0.5 text-amber-600" size={16} />}
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">{statusText}</p>
                      <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">Calendar preview uses mock connection state in Phase 1.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-900">Show calendar on Today</p>
                    <p className="mt-0.5 text-[12px] text-zinc-400">Turns off event fetching later.</p>
                  </div>
                  <Toggle
                    checked={calendarEnabled}
                    label="Calendar enabled"
                    onChange={(checked) => {
                      setCalendarEnabled(checked);
                      markDirty();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant={calendarState === "connected" ? "outline" : "default"}
                    onClick={() => {
                      setCalendarState("connected");
                      markDirty();
                    }}
                  >
                    <RefreshCw data-icon="inline-start" />
                    {calendarState === "reconnect" ? "Reconnect" : "Connect calendar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCalendarState("disconnected");
                      markDirty();
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </Section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400">
                <Sparkles size={14} />
                Preview summary
              </div>
              <div className="mt-4 grid gap-2">
                {[
                  `${activeAreaCount} active areas`,
                  `${templates.length} templates, ${monthlyTemplates} monthly`,
                  `Week starts ${weekStart}`,
                  `Theme follows ${theme}`,
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-[13px] text-zinc-600">
                    <span>{item}</span>
                    <ChevronRight size={14} className="text-zinc-300" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-zinc-400">Session</p>
                  <h2 className="mt-1 text-[15px] font-semibold text-zinc-950">Signed in as {displayName || user.name}</h2>
                  <p className="mt-1 text-[13px] text-zinc-400">{user.email}</p>
                </div>
              </div>
              <Button type="button" variant="destructive" className="mt-4 w-full" onClick={() => void signOut()}>
                <LogOut data-icon="inline-start" />
                Sign out
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
