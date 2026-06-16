@AGENTS.md

# Project Skeleton

```
middleware.ts                    # Next.js middleware (auth session refresh)
proxy.ts                         # Proxy configuration

app/                             # Next.js App Router — routing only
├── layout.tsx                   # Root layout (fonts, metadata)
├── page.tsx                     # Root redirect → /today
├── globals.css                  # Tailwind theme + CSS custom properties + calPulse keyframe
├── (auth)/                      # Public route group
│   └── login/page.tsx
├── (dashboard)/                 # Protected route group (auth-guarded)
│   ├── layout.tsx               # Dashboard shell layout
│   ├── today/
│   │   ├── page.tsx             # Server component (auth, data fetch + calendar fetch)
│   │   ├── loading.tsx          # Suspense fallback
│   │   └── today-dashboard.tsx  # Client orchestrator (wires state → components)
│   ├── tasks/
│   │   ├── page.tsx             # Server component
│   │   ├── loading.tsx
│   │   ├── actions.ts           # Server actions (toggleTaskStatus, setTaskTop3)
│   │   └── tasks-dashboard.tsx  # Client orchestrator
│   ├── projects/
│   │   ├── page.tsx             # Server component
│   │   ├── loading.tsx
│   │   ├── actions.ts           # Server actions
│   │   └── projects-dashboard.tsx
│   └── routines/
│       ├── page.tsx             # Server component
│       ├── loading.tsx
│       ├── actions.ts           # Server actions (toggleRoutineLog)
│       └── routines-dashboard.tsx
└── auth/callback/route.ts       # OAuth callback handler (stores Google refresh token)

components/
├── shared/                      # Cross-feature presentational primitives
│   ├── checkbox.tsx
│   ├── area-dot.tsx
│   ├── progress-bar.tsx
│   ├── section-label.tsx
│   └── login-button.tsx         # Google OAuth with calendar.readonly scope
├── layout/                      # App shell (sidebar, nav bars)
│   ├── dashboard-shell.tsx
│   ├── sidebar.tsx
│   └── mobile-tab-bar.tsx
├── today/                       # Feature: Today dashboard
│   ├── top3-section.tsx / .view.tsx
│   ├── task-list.tsx / .view.tsx
│   ├── routines-section.tsx / .view.tsx
│   ├── calendar-section.tsx / .view.tsx   # Google Calendar integration
│   ├── retainers-section.tsx
│   ├── slipping-section.tsx
│   ├── resurfacing-section.tsx
│   └── daily-quote.tsx
├── tasks/                       # Feature: Task management
│   ├── tasks-dashboard.tsx
│   ├── task-card-group.tsx
│   └── task-detail-panel.tsx
├── projects/                    # Feature: Projects
│   └── projects-dashboard.tsx
├── routines/                    # Feature: Routines
│   ├── routines-dashboard.tsx
│   ├── routine-row.tsx
│   ├── view-toggle.tsx
│   ├── freq-tag.tsx
│   ├── streak-flame.tsx
│   ├── day-squares.tsx
│   └── sparkline.tsx
└── ui/                          # shadcn/ui base components
    └── button.tsx

lib/
├── types/index.ts               # Domain types (Area, Task, CalendarEvent, Routine, …)
├── constants/
│   ├── areas.ts                 # AREA_META
│   └── brand.ts                 # APP_BRAND_NAME, APP_LOGO_INITIAL
├── features/
│   ├── dashboard/
│   │   └── session.ts           # getDashboardSession()
│   ├── today/
│   │   ├── server.ts            # getTodayPayload()
│   │   ├── use-today-state.ts   # State hook
│   │   ├── constants.ts         # TASK_META, QUOTES
│   │   └── mock-data.ts         # INITIAL_DATA
│   ├── calendar/                # Google Calendar integration
│   │   ├── server.ts            # getCalendarEvents() — token refresh + API fetch
│   │   └── data.ts              # normalizeGoogleEvent()
│   ├── tasks/
│   │   ├── server.ts            # Task queries + ensureTaskAreas()
│   │   ├── data.ts              # normalizeTask(), normalizeProjects()
│   │   └── use-tasks-state.ts   # State hook
│   ├── projects/
│   │   ├── server.ts            # getProjectsPayload()
│   │   ├── data.ts              # retainerCycleHours()
│   │   └── use-projects-state.ts
│   └── routines/
│       ├── server.ts            # Routine queries
│       ├── data.ts              # DB type mappings
│       ├── derive.ts            # isScheduled(), routineStreak(), dateAgo()
│       ├── constants.ts         # GROUP_ORDER, HIST_DAYS
│       └── use-routines-state.ts
├── supabase/                    # Auth & DB infrastructure
│   ├── client.ts                # Browser Supabase client
│   ├── server.ts                # Server Supabase client
│   ├── middleware.ts            # Session refresh middleware
│   └── env.ts                   # Environment variable validation
├── hooks/                       # Shared hooks (add as needed)
└── utils.ts                     # cn() utility

supabase/migrations/             # Database migrations (001–011)
.docs/                           # Product specs, design prompts
```

# File Placement Rules

## Where does this file go?

| What you're adding | Where it goes | Example |
|---|---|---|
| **Domain type or interface** used by 2+ features | `lib/types/index.ts` | `Task`, `Area`, `CalendarEvent` |
| **Constant** shared across features | `lib/constants/{name}.ts` | `AREA_META` in `areas.ts` |
| **Constant** used only by one feature | `lib/features/{feature}/constants.ts` | `TASK_META`, `QUOTES` |
| **Mock data / seed data** for a feature | `lib/features/{feature}/mock-data.ts` | `INITIAL_DATA` |
| **State hook** for a feature | `lib/features/{feature}/use-{feature}-state.ts` | `useTodayState` |
| **Server-side data fetching** for a feature | `lib/features/{feature}/server.ts` | `getTodayPayload()`, `getCalendarEvents()` |
| **Data normalization / DB mapping** for a feature | `lib/features/{feature}/data.ts` | `normalizeTask()`, `normalizeGoogleEvent()` |
| **Shared utility hook** (not feature-specific) | `lib/hooks/{name}.ts` | `useDebounce`, `useMediaQuery` |
| **Utility function** | `lib/utils.ts` (or `lib/utils/{name}.ts` if it grows) | `cn()` |
| **Presentational component** used across features | `components/shared/{name}.tsx` | `RDCheckbox`, `AreaDot` |
| **App shell / navigation** component | `components/layout/{name}.tsx` | `Sidebar`, `MobileTabBar` |
| **Feature component** with logic | `components/{feature}/{name}.tsx` (container) | `top3-section.tsx` |
| **Feature component** presentation-only | `components/{feature}/{name}.view.tsx` | `top3-section.view.tsx` |
| **shadcn/ui base component** | `components/ui/{name}.tsx` | `button.tsx` |
| **Route page** | `app/(group)/{feature}/page.tsx` | Server component only |
| **Route client orchestrator** | `app/(group)/{feature}/{name}.tsx` | `today-dashboard.tsx` |
| **Server actions** | `app/(dashboard)/{feature}/actions.ts` | `toggleTaskStatus` |
| **API route** | `app/api/{name}/route.ts` or `app/{path}/route.ts` | `auth/callback/route.ts` |
| **Supabase / infra code** | `lib/supabase/{name}.ts` | `client.ts`, `server.ts` |
| **External API integration** | `lib/features/{feature}/server.ts` | `getCalendarEvents()` |

## Rules

1. **Route directories contain only Next.js files** — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, `actions.ts`. Client components go in `components/`.
2. **Container / View split** — Complex feature components split into `{name}.tsx` (container: logic, state, props mapping) and `{name}.view.tsx` (presentation: JSX + Tailwind only). Simple self-contained components use a single file.
3. **Types live in `lib/types/`**, not scattered in component files. Exception: `ViewProps` interfaces stay in their `.view.tsx` file.
4. **Feature isolation** — Each feature owns `components/{feature}/`, `lib/features/{feature}/`, and `app/(group)/{feature}/`. Cross-feature imports go through `lib/types/`, `lib/constants/`, `components/shared/`, or `components/layout/`.
5. **No business logic in `.view.tsx`** — Views receive data + callbacks via props. State, effects, data transforms, and API calls belong in containers or hooks.
6. **Shared before new** — Before creating a new utility, check if `components/shared/`, `lib/hooks/`, or `lib/utils.ts` already has it.
7. **Server data fetching** — Each feature has `lib/features/{feature}/server.ts` for DB queries and external API calls. Page server components call these, never fetch directly.
8. **External API integrations** — Follow the calendar pattern: `server.ts` for auth + fetch, `data.ts` for response normalization, types in `lib/types/index.ts`.

## Adding a new feature

Follow the pattern:

```
app/(dashboard)/{feature}/
  page.tsx                          # Server component (auth, data)
  loading.tsx                       # Suspense fallback
  actions.ts                        # Server actions (mutations)
  {feature}-dashboard.tsx           # Client orchestrator

components/{feature}/
  {section}.tsx                     # Container
  {section}.view.tsx                # Presentation

lib/features/{feature}/
  server.ts                         # Server-side data fetching
  data.ts                           # Data normalization / DB type mapping
  use-{feature}-state.ts            # State hook
  constants.ts                      # Feature constants
  mock-data.ts                      # Mock data (until DB wired)
```

# Domain Types Reference

```typescript
type Area = "work" | "personal" | "family" | "health"

// Tasks
interface Task { id, title, area, due?, today, top3?, done, completedAt?, project?, flag?, recur? }
interface ManagedTask { id, title, area, project, due, time, repeat, priority, notes, done, top3?, ... }
type TaskStatusFilter = "open" | "done" | "all"
type TaskGroupBy = "project" | "due"

// Routines
interface Routine { id, label, desc?, group, freq, recurrence?, time?, remind?, goal?, done[] }
interface RoutineItem { id, label, done, streak }
type RoutineFrequency = "daily" | "weekdays" | "weekends" | "mwf" | "weekly_sun" | ... | "weekly_sat"
type RoutineGroupId = "morning" | "afternoon" | "evening"
interface RoutineRecurrence { interval, unit, daysOfWeek?, ends }

// Calendar (Google Calendar integration)
interface CalendarEvent { id, title, startTime, endTime, allDay, calendarName?, location?, status, meetLink? }
interface CalendarState { events, connected, error? }

// Projects & Retainers
interface TodayMonthlyService { id, name, area, doneItems, totalItems, loggedHours, monthlyHours, month }
interface StaleProject { id, name, area, daysAgo, kind, openTasks, reason, target?, lastActivityAt? }

// Other
interface ResurfaceNote { id, title, excerpt, saved, source }
```

# Google Calendar Integration

The app integrates with Google Calendar via Supabase OAuth + Google Calendar REST API.

**Auth flow:**
1. `login-button.tsx` requests `calendar.readonly` scope with `access_type: "offline", prompt: "consent"`
2. `auth/callback/route.ts` captures `provider_refresh_token` and stores in `user_google_tokens` table
3. `lib/features/calendar/server.ts` refreshes access token and fetches today's events

**Data flow:**
- `today/page.tsx` calls `getCalendarEvents()` in parallel with `getTodayPayload()`
- Returns `CalendarState { events, connected, error? }`
- Calendar section renders in left column between Top 3 and Tasks

**Environment variables required:**
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- Google Calendar API must be enabled in Google Cloud Console

**Database:** `user_google_tokens` table (migration 010) with RLS policies

# Database Migrations

| # | File | Purpose |
|---|------|---------|
| 001 | `initial_schema.sql` | Base tables (tasks, routines, projects, areas) |
| 002 | `rls_policies.sql` | Row-level security |
| 003 | `task_ui_fields.sql` | Task UI enhancements |
| 004 | `routine_ui_fields.sql` | Routine UI enhancements |
| 005 | `navigation_performance_indexes.sql` | Performance indexes |
| 006 | `projects_work_dashboard.sql` | Projects dashboard |
| 007 | `entry_lifecycle.sql` | Entry lifecycle |
| 008 | `project_retainer_cycles.sql` | Retainer cycles |
| 009 | `task_completed_at.sql` | Task completedAt field |
| 010 | `user_google_tokens.sql` | Google Calendar refresh tokens |
| 011 | `routine_recurrence.sql` | Routine recurrence schema |
