export type Area = "work" | "personal" | "family" | "health";

export interface TaskAreaOption {
  id: string;
  key: Area;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  area: Area;
  due?: string | null;
  today: boolean;
  top3?: boolean;
  done: boolean;
  completedAt?: string | null;
  project?: string;
  flag?: string;
  recur?: string;
}

export interface TaskProject {
  id: string;
  name: string;
  area: Area;
  areaId: string | null;
}

export interface YearGoalProject {
  id: string;
  name: string;
  area: Area;
}

export type TaskStatusFilter = "open" | "done" | "all";
export type TaskGroupBy = "project" | "due";

export interface ManagedTask {
  id: string;
  title: string;
  area: Area;
  project: string | null;
  due: string;
  time: string;
  repeat: string;
  priority: number;
  notes: string;
  done: boolean;
  top3?: boolean;
  reminder?: string;
  note?: string;
  createdAt?: string;
  completedAt?: string | null;
}

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
  streak: number;
}

export type RoutineFrequency =
  | "daily"
  | "weekdays"
  | "weekends"
  | "mwf"
  | "weekly_sun"
  | "weekly_mon"
  | "weekly_tue"
  | "weekly_wed"
  | "weekly_thu"
  | "weekly_fri"
  | "weekly_sat";
export type RoutineGroupId = "morning" | "afternoon" | "evening";
export type RoutinesViewMode = "today" | "week";

export interface RoutineRecurrence {
  interval: number;
  unit: "day" | "week" | "month";
  daysOfWeek?: number[];
  ends: {
    mode: "never" | "on" | "after";
    date?: string;
    occurrences?: number;
  };
}

export interface Routine {
  id: string;
  label: string;
  desc?: string;
  group: RoutineGroupId;
  freq: RoutineFrequency;
  recurrence?: RoutineRecurrence | null;
  createdAt?: string;
  time?: string;
  remind?: boolean;
  goal?: "ongoing" | "7" | "21" | "30" | "custom";
  goalDays?: string;
  /** done[k] = completed k days ago (0 = today) */
  done: boolean[];
}

export interface RoutineGroup {
  id: RoutineGroupId;
  label: string;
  items: Routine[];
}

export interface RoutineStats {
  todayDone: number;
  todayTotal: number;
  rate30: number;
  rate7: number;
  /** Last 30 days of daily completion ratio, oldest first */
  spark: number[];
  streak: number;
}

export interface TodayMonthlyService {
  id: string;
  name: string;
  area: Area;
  doneItems: number;
  totalItems: number;
  loggedHours: number;
  monthlyHours: number;
  month: string;
}

export interface StaleProject {
  id: string;
  name: string;
  area: Area;
  daysAgo: number;
  kind: "project" | "retainer";
  openTasks: number;
  reason: "quiet";
  target?: string | null;
  lastActivityAt?: string;
}

export interface YearGoal {
  id: string;
  title: string;
  note: string;
  year: number;
  area?: Area | null;
  project?: YearGoalProject | null;
  isFocus: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResurfaceNote {
  id: string;
  title: string;
  excerpt: string;
  saved: string;
  source: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  calendarName?: string;
  location?: string;
  status: "confirmed" | "tentative" | "cancelled";
  meetLink?: string;
}

export interface CalendarState {
  events: CalendarEvent[];
  connected: boolean;
  error?: string;
}
