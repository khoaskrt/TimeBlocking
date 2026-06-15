# TimeBlocking — Full Project Audit Report

**Generated:** 2026-06-15

---

## 1. Project Overview

**TimeBlocking** is a personal productivity dashboard built with **Next.js 16 (App Router)**, **TypeScript**, **Supabase** (PostgreSQL + Google OAuth), and **Tailwind CSS v4**. It solves four pain points: quick capture, unified inbox across life areas (Work/Personal/Family/Health), project + retainer management, and anti-stale-project alerts with note resurfacing.

**Tech Stack:** Next.js 16.2.9 · React 19 · Supabase SSR · Tailwind v4 · shadcn/ui (base-nova) · Lucide icons · Vercel deployment target

---

## 2. Page Inventory & Function

| Route | Type | Function |
|---|---|---|
| `/` | Server redirect | Redirects to `/today` |
| `/login` | Server + client | Google OAuth login, redirects authenticated users to `/today` |
| `/auth/callback` | API route | Exchanges OAuth code for Supabase session |
| `/today` | Server → Client | Daily dashboard: Top 3, tasks, routines, retainers, slipping projects, quotes |
| `/tasks` | Server → Client | Full task CRUD with filters (status/project/area), grouping (due/project), detail panel |
| `/projects` | Server → Client | Areas & projects management: milestones, checklists, templates, activity log, retainer tracking |
| `/routines` | Server → Client | Routine management: create/edit/delete, daily/weekly views, streak tracking, stats |

---

## 3. Authentication & Middleware Flow

```
Request → middleware.ts → lib/supabase/middleware.ts (updateSession)
  ├─ No session + not /login or /auth/* → redirect /login
  ├─ Has session + on /login → redirect /today
  └─ Otherwise → pass through with refreshed cookies
```

- **OAuth provider:** Google via Supabase
- **Session refresh:** Every request via middleware cookie sync
- **Dashboard guard:** `app/(dashboard)/layout.tsx` calls `getDashboardSession()` which throws if no user
- **Session helper:** `lib/features/dashboard/session.ts` returns `{ supabase, userId, user: { name, email } }`

---

## 4. Frontend Architecture

### 4.1 Component Pattern: Container / View Split

Every feature follows this pattern:

| Layer | File | Responsibility |
|---|---|---|
| **Server page** | `app/(dashboard)/*/page.tsx` | Auth check, data fetch, Suspense boundary |
| **Client orchestrator** | `*-dashboard.tsx` | Wires state hook → section components |
| **Container** | `components/*/name.tsx` | Logic, state, callbacks, data transforms |
| **View** | `components/*/name.view.tsx` | Pure JSX + Tailwind, no state/logic |

### 4.2 State Hooks (one per feature)

**`useTodayState`** — `lib/features/today/use-today-state.ts`
- State: `tasks`, `routines`, derived `top3`, `todayTasks`, `otherTasks`, `error`
- Actions: `toggleTask`, `toggleTop3`, `toggleRoutine` (all optimistic with rollback)

**`useTasksState`** — `lib/features/tasks/use-tasks-state.ts`
- State: `tasks`, `visible` (filtered), `groups` (grouped), filters (`status`, `project`, `area`, `query`, `groupBy`), `selectedId`, `expanded`, `isPending`
- Actions: `toggleTask`, `openTask`, `openNewTask`, `saveTask`, `deleteTask`, `closeTask`
- Grouping: by due date (overdue → today → upcoming → no date) or by project

**`useRoutinesState`** — `lib/features/routines/use-routines-state.ts`
- State: `items`, `groups` (morning/afternoon/evening), `view` (today/week), `editor`, `error`, `stats`
- Actions: `toggle`, `rename`, `remove`, `add`, `saveRoutine`, `openNewRoutine`, `openRoutine`, `closeEditor`
- Stats: `rate30`, `rate7`, `streak`, `todayDone`, `todayTotal`, `spark` (30-day array)

**`useProjectsState`** — `lib/features/projects/use-projects-state.ts`
- State: `entries`, `templates`, `route` (list/entry/new/templates), `selectedEntry`, derived `areas`, `activeProjects`, `isPending`
- 15+ actions: CRUD for entries, milestones, checklist items, templates, tasks, activity

### 4.3 Component Inventory (34 files)

| Directory | Count | Key Components |
|---|---|---|
| `components/layout/` | 3 | `DashboardShell`, `Sidebar` (with sign-out), `MobileTabBar` |
| `components/today/` | 10 | `Top3Section` (.view), `TaskList` (.view), `RoutinesSection` (.view), `DailyQuote`, `RetainersSection`, `SlippingSection`, `ResurfacingSection` |
| `components/tasks/` | 3 | `TasksDashboard`, `TaskCardGroup`, `TaskDetailPanel` (with TaskForm) |
| `components/projects/` | 1 (1200+ lines) | `ProjectsDashboard` with inline sub-components: `ProjectsList`, `EntryDetail`, `NewProject`, `MilestonesSection`, `TasksSection`, `ChecklistSection`, `ActivitySection`, `TemplatesPage` |
| `components/routines/` | 7 | `RoutinesDashboard` (700+ lines), `RoutineRow`, `RoutineForm`, `DaySquares`, `FreqTag`, `StreakFlame`, `Sparkline`, `ViewToggle` |
| `components/shared/` | 5 | `RDCheckbox`, `AreaDot`, `ProgressBar`, `SectionLabel`, `LoginButton` |
| `components/ui/` | 1 | `Button` (shadcn/ui with CVA variants) |

---

## 5. Backend Logic (Server Actions & Data Fetching)

### 5.1 Server Data Fetchers

| Function | Location | Tables Queried | Returns |
|---|---|---|---|
| `getTodayPayload` | `lib/features/today/server.ts` | tasks, routines, routine_logs | `{ dateLabel, tasks, routines }` |
| `getTasksPayload` | `lib/features/tasks/server.ts` | areas, projects, tasks | `{ tasks, areas, projects }` |
| `getRoutinesPayload` | `lib/features/routines/server.ts` | routines, routine_logs (36-day window) | `Routine[]` with done arrays |
| `getProjectsPayload` | `lib/features/projects/server.ts` | 8 tables in parallel | `{ entries, templates }` with all children |
| `ensureTaskAreas` | `lib/features/tasks/server.ts` | areas (upsert) | Ensures 4 default areas exist |

All fetchers include **schema migration fallbacks** — they try modern column names first, fall back to legacy if columns are missing (error codes `42703`, `PGRST204`).

### 5.2 Server Actions

**Tasks** — `app/(dashboard)/tasks/actions.ts`

| Action | Mutation | Revalidates |
|---|---|---|
| `createTask` | INSERT tasks | /tasks, /today, /projects |
| `updateTask` | UPDATE tasks | /tasks, /today, /projects |
| `toggleTaskStatus` | UPDATE status | /tasks, /today, /projects |
| `setTaskTop3` | UPDATE pinned_top3 | /tasks, /today, /projects |
| `deleteTask` | DELETE tasks | /tasks, /today, /projects |

**Routines** — `app/(dashboard)/routines/actions.ts`

| Action | Mutation | Revalidates |
|---|---|---|
| `createRoutine` | INSERT routines | /routines, /today |
| `updateRoutine` | UPDATE routines | /routines, /today |
| `renameRoutine` | UPDATE name | /routines, /today |
| `deleteRoutine` | UPDATE active=false | /routines, /today |
| `toggleRoutineLog` | UPSERT routine_logs | /routines, /today |
| `quickCreateRoutine` | INSERT with defaults | /routines, /today |

**Projects** — `app/(dashboard)/projects/actions.ts`

| Action | Mutation | Revalidates |
|---|---|---|
| `createEntry` | INSERT areas/projects | /projects (+/tasks, /today if task-related) |
| `setColor` | UPDATE ui_color | /projects |
| `setEntryStatus` | UPDATE status | /projects |
| `deleteEntry` | DELETE/UPDATE status | /projects |
| `addMilestone` | INSERT project_milestones | /projects |
| `updateMilestone` | UPDATE project_milestones | /projects |
| `removeMilestone` | DELETE project_milestones | /projects |
| `addCheck` | INSERT project_checklist_items | /projects |
| `toggleCheck` | UPDATE completed | /projects |
| `removeCheck` | DELETE project_checklist_items | /projects |
| `addTask` | INSERT tasks | /projects, /tasks, /today |
| `toggleTask` | UPDATE task status | /projects, /tasks, /today |
| `logActivity` | INSERT project_activity | /projects |
| `loadTemplate` | Bulk INSERT checklist items | /projects |
| Template CRUD (4 actions) | INSERT/DELETE templates + items | /projects |

---

## 6. Database Schema (18 Tables)

### 6.1 Entity-Relationship Diagram

```
auth.users
  ├─→ areas ──────────────┬─→ tasks ←── projects
  │     │                  │     │           │
  │     │                  │     │           ├─→ project_milestones
  │     │                  │     │           ├─→ project_checklist_items
  │     │                  │     │           └─→ project_activity
  │     │                  │     │
  │     ├─→ captures       │     └─→ notes
  │     ├─→ retainers ─────┤
  │     │     ├─→ retainer_templates
  │     │     └─→ retainer_cycles ──→ retainer_items
  │     │
  │     ├─→ routines ──→ routine_logs
  │     └─→ habits ────→ habit_logs
  │
  ├─→ project_checklist_templates ──→ project_checklist_template_items
  └─→ notes
```

### 6.2 Core Tables

| Table | Key Columns | Relationships |
|---|---|---|
| **areas** | id, user_id, key, name, color, ui_color, status | Parent of tasks, projects, captures, routines, habits, retainers, notes |
| **tasks** | id, user_id, title, notes, due_date, due_time, area_id, project_id, status (todo/done), priority (1-4), pinned_top3, repeat, reminder, note_id | FK → areas, projects, notes |
| **projects** | id, user_id, name, description, area_id, status (active/done/paused), project_kind (project/retainer), start_date, end_date, quoted_hours, monthly_hours, ui_color, sort_order, last_activity_at | FK → areas |
| **routines** | id, user_id, name, description, time_block (morning/afternoon/evening), frequency (daily/weekdays/mwf), routine_time, remind, goal, goal_days, order, active | FK → areas |
| **routine_logs** | id, user_id, routine_id, date, completed | FK → routines; UNIQUE(routine_id, date) |
| **project_milestones** | id, user_id, project_id, label, weight, completed, order | FK → projects |
| **project_checklist_items** | id, user_id, project_id, label, completed, recurring, cycle_id, order | FK → projects |
| **project_activity** | id, user_id, project_id, kind (work/update), note, hours, created_at | FK → projects |
| **project_checklist_templates** | id, user_id, name, monthly | — |
| **project_checklist_template_items** | id, template_id, label, order | FK → templates |
| **captures** | id, user_id, content, area_id, processed | FK → areas |
| **retainers** | id, user_id, name, client_name, area_id, billing_day, active | FK → areas |
| **retainer_cycles** | id, retainer_id, month, year; UNIQUE(retainer_id, month, year) | FK → retainers |
| **retainer_items** | id, cycle_id, template_id, title, completed | FK → retainer_cycles, retainer_templates |
| **habits** | id, user_id, name, area_id, frequency, active | FK → areas |
| **habit_logs** | id, user_id, habit_id, date; UNIQUE(habit_id, date) | FK → habits |
| **notes** | id, user_id, title, content, tags[], area_id, source_url, resurface_interval_days, last_resurfaced_at | FK → areas |

### 6.3 Security

- **RLS enabled on all 18 tables**
- Direct tables: `auth.uid() = user_id` policy
- Child tables (retainer_templates, retainer_items, template_items): join-based ownership check
- **Trigger:** `task_updates_project_activity` — auto-updates `projects.last_activity_at` on task INSERT/UPDATE

### 6.4 Key Indexes (18)

Performance indexes on: `tasks(user_id, status, due_date)`, `tasks(pinned_top3)`, `projects(user_id, kind, status, last_activity_at)`, `routine_logs(user_id, date)`, `project_activity(project_id, created_at DESC)`, and more.

---

## 7. Cross-Page Synchronization

### 7.1 Revalidation Matrix

| Action On | Revalidates | Why |
|---|---|---|
| **Task toggle/create/update/delete** | `/tasks`, `/today`, `/projects` | Tasks appear on Today (top3, task list) and Projects (task section) |
| **Task top3 pin/unpin** | `/tasks`, `/today`, `/projects` | Top 3 section on Today, task list on Tasks |
| **Routine toggle** | `/routines`, `/today` | Routine completion shows on Today's routine section |
| **Routine create/edit/delete** | `/routines`, `/today` | Routine list on both pages |
| **Project create/delete/status** | `/projects` only | Projects page self-contained (areas also affect task dropdowns but revalidation doesn't cover /tasks) |
| **Project task add/toggle** | `/projects`, `/tasks`, `/today` | Project tasks visible on all three pages |
| **Milestone/checklist/activity** | `/projects` only | Internal to project detail view |
| **Template CRUD** | `/projects` only | Templates only used within projects |
| **Area color/status** | `/projects` only | **Gap:** area changes don't revalidate /tasks or /today |

### 7.2 Data Flow Diagram

```
/today (read-only aggregation)
  ├─ Tasks (from DB via getTodayPayload)
  │   ├── Top 3: tasks WHERE pinned_top3 = true
  │   ├── Today: tasks WHERE due_date = today AND NOT top3
  │   └── Other: remaining open tasks
  ├─ Routines (from DB via getTodayPayload)
  │   └── Grouped by time_block, with today's logs
  ├─ Retainers (MOCK DATA - not yet from DB)
  ├─ Slipping Projects (MOCK DATA - not yet from DB)
  └─ Resurfacing Note (MOCK DATA - not yet from DB)

/tasks (full CRUD)
  ├─ Reads: areas, projects, tasks (via getTasksPayload)
  ├─ Writes: createTask, updateTask, deleteTask, toggleTaskStatus, setTaskTop3
  └─ Revalidates: /tasks + /today + /projects

/routines (full CRUD)
  ├─ Reads: routines + 36-day routine_logs (via getRoutinesPayload)
  ├─ Writes: createRoutine, updateRoutine, deleteRoutine, toggleRoutineLog, renameRoutine
  └─ Revalidates: /routines + /today

/projects (full CRUD)
  ├─ Reads: 8 tables in parallel (via getProjectsPayload)
  ├─ Writes: 15+ actions (entries, milestones, checklists, templates, tasks, activity)
  └─ Revalidates: /projects (+ /tasks + /today for task-related actions only)
```

### 7.3 Optimistic Update Pattern

All state hooks follow the same pattern:
1. **Optimistic update** — immediately mutate local state
2. **Server action call** — execute mutation via `"use server"` function
3. **On success** — replace optimistic data with server response
4. **On failure** — rollback to previous state, set `error` message
5. **Revalidation** — Next.js `revalidatePath()` ensures other pages get fresh data on next navigation

### 7.4 Shared Data Dependencies

| Shared Entity | Used By | Implication |
|---|---|---|
| **Areas** | Today, Tasks, Projects, Routines | Area colors/names appear everywhere; `ensureTaskAreas()` auto-creates defaults |
| **Tasks** | Today (top3 + task list), Tasks (full CRUD), Projects (project tasks) | Task mutations must revalidate all three |
| **Routines** | Today (routine section), Routines (full CRUD) | Routine log toggle on Today must sync to Routines page |
| **Projects** | Projects (full CRUD), Tasks (project filter/group) | Project names appear in task grouping |

---

## 8. Identified Gaps & Observations

| # | Finding | Severity | Detail |
|---|---|---|---|
| 1 | **Mock data still in use** | Medium | Retainers, slipping projects, and resurfacing on `/today` use `lib/features/today/mock-data.ts` instead of DB queries |
| 2 | **Area color change doesn't propagate** | Low | `setColor` only revalidates `/projects`, not `/tasks` or `/today` where `AreaDot` renders the color |
| 3 | **No captures/inbox page** | Medium | `captures` table exists in DB but no route or UI implements it |
| 4 | **No notes/library page** | Medium | `notes` table exists but no route implements the resurfacing feature |
| 5 | **No people/retainers page** | Medium | Retainer tables exist but no dedicated route; mock data on Today |
| 6 | **Habits unused** | Low | `habits` and `habit_logs` tables exist but no feature references them |
| 7 | **Projects dashboard is monolithic** | Low | `components/projects/projects-dashboard.tsx` is 1200+ lines in a single file; candidates for extraction |
| 8 | **Migration 005 is empty** | Info | `005_navigation_performance_indexes.sql` contains only the character 'c' |
| 9 | **Schema fallback complexity** | Low | Server fetchers have dual-path code for legacy vs modern column names; may accumulate tech debt |
| 10 | **No error boundary** | Low | No `error.tsx` files exist in any route directory |
