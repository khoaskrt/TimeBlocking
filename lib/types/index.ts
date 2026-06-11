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
}

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Retainer {
  id: string;
  client: string;
  area: Area;
  doneItems: number;
  totalItems: number;
  month: string;
}

export interface StaleProject {
  id: string;
  name: string;
  area: Area;
  daysAgo: number;
}

export interface ResurfaceNote {
  id: string;
  title: string;
  excerpt: string;
  saved: string;
  source: string;
}
