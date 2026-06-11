# Personal Time Management Dashboard — ReSolve.com

## Context

Greenfield project. Dashboard quản lý thời gian cá nhân giải quyết 4 pain points mà Notion/Apple Notes không làm được:
1. Quick Capture cực nhanh từ iPhone & Mac
2. Một nơi duy nhất cho Work + Personal + Family + Health
3. Quản lý Project (one-time) + Retainer (monthly recurring checklist tự tái tạo)
4. Chống "bỏ quên" — stale project alerts + auto-resurface old notes

**Confirmed choices:** Next.js App Router full-stack, Supabase (Google OAuth), Vercel deployment, Minimalist design (editorial, Notion-style), English UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (full-stack) |
| Language | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui, Inter font |
| Database + Auth | Supabase (PostgreSQL + Google OAuth) |
| Deployment | Vercel (+ Vercel Cron) |
| Icons | Lucide React |

---

## Design System

**Editorial minimalist (Notion meets Linear):**
- Font: Inter (via `next/font`, CSS var `--font-inter`)
- Background: `white` (main content area)
- Sidebar: light neutral (`sidebar` CSS custom property, oklch-based)
- Cards: no heavy shadows — subtle borders, section dividers use `h-px bg-zinc-100`
- Area color badges: colored dots — blue=Work, green=Personal, violet=Family, amber=Health
- Two-column layout on desktop (main + right rail), single-column on mobile
- Color system: CSS custom properties using oklch values in `globals.css`
- Spacing: generous whitespace, editorial feel

**Area colors:**
```
Work:      #3B82F6  (blue-500)
Personal:  #10B981  (emerald-500)
Family:    #8B5CF6  (violet-500)
Health:    #F59E0B  (amber-500)
```

---

## Data Models (Supabase PostgreSQL)

```sql
-- Life areas / contexts
areas (id, name, color[blue|green|purple|orange|...], icon, user_id)

-- Inbox captures
captures (id, content, area_id NULLABLE, processed BOOL, created_at, user_id)

-- Tasks
tasks (id, title, due_date, area_id, project_id NULLABLE, status[todo|done],
       priority[low|medium|high], pinned_top3 BOOL, created_at, user_id)

-- One-time Projects
projects (id, name, description, area_id, status[active|done|paused],
          last_activity_at, start_date, end_date, user_id)

-- Retainers (monthly recurring)
retainers (id, name, client_name, area_id, billing_day, active, user_id)
retainer_templates (id, retainer_id, title, order)
retainer_cycles (id, retainer_id, month INT, year INT, created_at)
retainer_items (id, cycle_id, template_id, title, completed BOOL, completed_at)

-- Routines (daily structured blocks — SEPARATE from tasks)
routines (id, name, time_block[morning|afternoon|evening], area_id, active, order, user_id)
routine_logs (id, routine_id, date DATE, completed BOOL, user_id)

-- Habits (streak-based tracking)
habits (id, name, area_id, frequency[daily|weekly], active, created_at, user_id)
habit_logs (id, habit_id, date DATE, user_id)

-- Notes / Knowledge (for resurfacing)
notes (id, title, content, tags TEXT[], area_id, source_url,
       resurface_interval_days INT DEFAULT 30, last_resurfaced_at, created_at, user_id)
```

**All tables:** RLS policies scoped to `auth.uid() = user_id`.

---

## Current App Structure

```
middleware.ts                     # Next.js middleware (auth session refresh)

app/
├── layout.tsx                    # Root layout (Inter + Geist Mono fonts, metadata)
├── page.tsx                      # Root redirect → /today
├── globals.css                   # Tailwind v4 theme + CSS custom properties (oklch)
├── (auth)/
│   └── login/page.tsx            # Login page with Google sign-in
├── (dashboard)/
│   └── today/
│       ├── page.tsx              # Server component (Supabase auth check → redirect or render)
│       └── today-dashboard.tsx   # Client orchestrator (wires state → all sections)
└── auth/callback/route.ts        # Supabase OAuth callback handler

components/
├── shared/                       # Cross-feature presentational primitives
│   ├── checkbox.tsx              # RDCheckbox
│   ├── area-dot.tsx              # AreaDot (colored dot + label)
│   ├── progress-bar.tsx          # ProgressBar
│   ├── section-label.tsx         # SectionLabel (uppercase header + optional count)
│   └── login-button.tsx          # Google sign-in button
├── layout/                       # App shell
│   ├── sidebar.tsx               # Desktop sidebar (nav + user menu + sign out)
│   └── mobile-tab-bar.tsx        # Mobile bottom tab bar (5 tabs)
├── today/                        # Feature: Today dashboard
│   ├── top3-section.tsx          # Container
│   ├── top3-section.view.tsx     # Presentation
│   ├── task-list.tsx             # Container (Today's Tasks + All Tasks, collapsible)
│   ├── task-list.view.tsx        # Presentation
│   ├── routines-section.tsx      # Container
│   ├── routines-section.view.tsx # Presentation (tabs + streak badges)
│   ├── retainers-section.tsx     # Retainer progress cards
│   ├── slipping-section.tsx      # Stale projects warning
│   ├── resurfacing-section.tsx   # Daily resurface note card
│   └── daily-quote.tsx           # Motivational quote (self-contained)
└── ui/
    └── button.tsx                # shadcn/ui base button

lib/
├── types/index.ts                # Domain types (Area, Task, RoutineItem, Retainer, StaleProject, ResurfaceNote)
├── constants/areas.ts            # AREA_META (label + hex color per area)
├── features/today/
│   ├── use-today-state.ts        # State hook (tasks, routines, toggle handlers)
│   ├── constants.ts              # TASK_META, ROUTINE_STREAKS, QUOTES
│   └── mock-data.ts              # INITIAL_DATA (full mock dataset)
├── supabase/
│   ├── client.ts                 # Browser Supabase client
│   ├── server.ts                 # Server Supabase client
│   ├── middleware.ts             # Auth middleware helper
│   └── env.ts                    # Env var access
├── hooks/                        # Shared hooks (add as needed)
└── utils.ts                      # cn() utility
```

---

## Today Dashboard (`/today`) — Current Layout

Two-column desktop layout with right rail collapsing on mobile (`max-lg:hidden`).

```
┌──────────┬────────────────────────────────────┬──────────────┐
│          │  Header                            │              │
│          │  "Today" label                     │  Daily Quote │
│          │  "Wednesday, June 10"  (32px bold) │              │
│ SIDEBAR  │  Live clock (HH:MM)               │  Routines    │
│ 220px    ├────────────────────────────────────┤  (tabs +     │
│ light    │  Top 3 for Today                   │  streaks)    │
│          │  (starred priority tasks, max 3)   │              │
│          ├────────────────────────────────────┤  Retainers   │
│          │  Today's Tasks                     │  (progress)  │
│          │  (grouped by area, collapsible)    │              │
│          ├────────────────────────────────────┤  Slipping    │
│          │  All Tasks                         │  (stale      │
│          │  (grouped by project, collapsible) │  projects)   │
│          │                                    │              │
│          │                                    │  Resurfacing │
│          │                                    │  (note card) │
└──────────┴────────────────────────────────────┴──────────────┘
                                                 ▲ hidden < lg
```

**Left column** (max-w-620px): Editorial header → Top 3 → Today's Tasks → All Tasks
**Right rail** (w-290px, `max-lg:hidden`): Daily Quote → Routines → Retainers → Slipping → Resurfacing

### Sidebar nav items (current):
- Today (Home icon) — active state
- Tasks (CheckSquare icon)
- Routines (Sunrise icon)
- People (Users icon)
- Library (BookOpen icon)

### Mobile: Bottom tab bar with same 5 nav items, fixed bottom with safe-area-inset.

---

## Current Navigation Structure

| Nav Item | Icon | Route | Status |
|---|---|---|---|
| Today | Home | `/today` | Implemented (mock data) |
| Tasks | CheckSquare | — | Not yet |
| Routines | Sunrise | — | Not yet |
| People | Users | — | Not yet |
| Library | BookOpen | — | Not yet |

---

## Key Logic (Current)

### State management (`use-today-state.ts`)
- `tasks` — full task list with toggle done/top3
- `routines` — morning/afternoon/evening blocks with toggle done
- `toggleTask(id)` — toggle task completion
- `toggleTop3(id)` — pin/unpin from Top 3 (max 3 enforced)
- `toggleRoutine(block, id)` — toggle routine item completion
- Derived: `top3`, `todayTasks`, `otherTasks`

### Mock data (`mock-data.ts`)
- 13 tasks (8 today, 5 other grouped by project)
- 11 routine items across morning/afternoon/evening
- 2 retainers (Lotus Media, Pham & Partners)
- 1 stale project (Portfolio refresh, 12 days ago)
- 1 resurface note (Pricing strategy notes)

---

## Implementation Progress

### Done
1. Project scaffold (Next.js, Tailwind v4, shadcn/ui, Inter font)
2. Supabase auth (Google OAuth, middleware, callback handler)
3. Root layout + redirect (`/` → `/today`)
4. Login page
5. Today Dashboard — full two-column layout with all 7 sections:
   - Editorial header with live clock
   - Top 3 for Today (star-pinned, max 3)
   - Today's Tasks (grouped by area, completed collapsible)
   - All Tasks (grouped by project, collapsible)
   - Daily Quote (right rail)
   - Routines (right rail, tab switcher, streak badges)
   - Retainers Progress (right rail)
   - Slipping Projects (right rail)
   - Daily Resurfacing (right rail)
6. Desktop sidebar + mobile tab bar
7. Container/View component architecture
8. Domain types + mock data + state hook
9. Shared components (checkbox, area-dot, progress-bar, section-label)

### Next steps
1. **DB migrations** — Supabase tables + RLS policies
2. **Wire real data** — Replace mock data with Supabase queries
3. **Quick Capture** — Modal + Cmd+K + floating button
4. **Tasks page** — Full task management (CRUD, filters, area grouping)
5. **Routines page** — Manage routine templates + daily logging
6. **People page** — Retainer clients + cycle management
7. **Library page** — Notes CRUD + resurface scheduling
8. **Cron job** — `/api/cron/daily` for retainer cycles + resurface
9. **Mobile polish** — Responsive refinements, PWA meta for iPhone

---

## Verification

1. `npm run dev` → app loads, redirects to `/login`
2. Google sign-in → land on Today Dashboard at `/today`
3. Top 3 section → can star/unstar tasks, max 3 enforced
4. Task checkboxes → toggle done state, completed tasks collapse
5. Routine tabs → switch morning/afternoon/evening, checkboxes work
6. Sidebar nav → user menu opens, sign out works
7. Mobile → bottom tab bar visible, right rail hidden, layout stacks vertically
8. All sections render with mock data correctly
