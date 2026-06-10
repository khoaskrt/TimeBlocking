# Personal Time Management Dashboard — ReSolve.com

## Context

Greenfield project. Bạn cần một dashboard quản lý thời gian cá nhân giải quyết 4 pain points mà Notion/Apple Notes không làm được:
1. Quick Capture cực nhanh từ iPhone & Mac
2. Một nơi duy nhất cho Work + Personal + Family + Habits
3. Quản lý Project (one-time) + Retainer (monthly recurring checklist tự tái tạo)
4. Chống "bỏ quên" — stale project alerts + auto-resurface old notes

**Confirmed choices:** Next.js full-stack, Supabase (Google OAuth), Vercel deployment, Minimalist design (Notion-style), English UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (full-stack) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui, Inter font |
| Database + Auth | Supabase (PostgreSQL + Google OAuth) |
| Deployment | Vercel (+ Vercel Cron) |
| Icons | Lucide React |

---

## Design System

**Notion-style minimalist:**
- Font: Inter
- Background: `zinc-50` (light) / `zinc-950` (dark)
- Sidebar: `zinc-900` dark always (like Notion's dark sidebar)
- Cards: white with `border border-zinc-200`, no heavy shadows
- Area color badges: soft colored dots (blue=Work, green=Personal, purple=Family, orange=Health)
- Dark mode toggle available
- Spacing: generous padding, lots of whitespace

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

## App Structure

```
app/
├── (auth)/
│   ├── login/page.tsx            — Google sign-in only
│   └── auth/callback/route.ts    — Supabase OAuth callback
├── (dashboard)/
│   ├── layout.tsx                — Sidebar + Quick Capture button (Cmd+K)
│   ├── page.tsx                  — TODAY view
│   ├── inbox/page.tsx            — Capture inbox (process captures)
│   ├── projects/
│   │   ├── page.tsx              — Projects list (with stale badges)
│   │   └── [id]/page.tsx         — Project detail + tasks
│   ├── retainers/
│   │   ├── page.tsx              — Retainer clients list
│   │   └── [id]/page.tsx         — Cycle checklist + template editor
│   ├── routines/page.tsx         — Manage routine templates
│   ├── habits/page.tsx           — Habit tracker + streak heatmap
│   └── notes/page.tsx            — Notes + resurface queue
└── api/
    └── cron/daily/route.ts       — Daily automation (retainer cycles + resurface)
```

---

## Today Dashboard (`/`) — Section Layout

```
┌─────────────────────────────────────────────┐
│  📌 TOP 3 FOR TODAY                          │
│  3 pinned/priority tasks (editable)          │
├─────────────────────────────────────────────┤
│  ✅ TODAY'S TASKS  (due today + overdue)     │
│  Grouped by area, checkbox to complete       │
├─────────────────────────────────────────────┤
│  🌅 ROUTINES                                 │
│  Tabs: Morning | Afternoon | Evening         │
│  Checkbox list per block                     │
├─────────────────────────────────────────────┤
│  📋 ALL TASKS  (excludes today's tasks)      │
│  Flat list, collapsible, filter by area      │
├─────────────────────────────────────────────┤
│  📦 RETAINER PROGRESS  (this month)          │
│  Progress bar per retainer                   │
├─────────────────────────────────────────────┤
│  ⚠️  STALE PROJECTS                          │
│  Warning cards, last activity X days ago    │
├─────────────────────────────────────────────┤
│  💡 DAILY RESURFACE  (1–2 notes)             │
│  Note card + "Got it" dismiss button         │
└─────────────────────────────────────────────┘
```

---

## Key Logic

### Quick Capture
- Floating `+` button (fixed bottom-right) + `Cmd+K` shortcut → modal
- Single line input → saves to `captures` table (area optional)
- Mobile: large touch target, minimal fields

### Retainer Auto-Cycle (Cron, daily at 00:01)
```
For each active retainer where no cycle exists for current month:
  → INSERT retainer_cycles (retainer_id, current month/year)
  → For each retainer_template: INSERT retainer_items (copy title)
```

### Stale Project Detection
```sql
SELECT * FROM projects
WHERE status = 'active'
  AND last_activity_at < NOW() - INTERVAL '7 days'
```
Any task completion or note linked to a project updates `last_activity_at`.

### Note Resurfacing (Cron, daily)
```
Find notes WHERE last_resurfaced_at < NOW() - resurface_interval_days
Today view shows up to 2 of these
"Got it" click → UPDATE last_resurfaced_at = NOW()
```

### Top 3 For Today
- User manually pins tasks via `pinned_top3 = true` toggle
- Max 3 pinned at once (enforced in UI)
- Auto-suggestions: overdue high-priority tasks shown as "Add to Top 3?" prompt

---

## Implementation Order

1. **Scaffold** — `create-next-app`, shadcn init, Supabase client
2. **Auth** — Google OAuth via Supabase, middleware route protection
3. **DB migrations** — All tables + RLS policies in Supabase
4. **Layout** — Sidebar (dark), main area (light), responsive mobile
5. **Today Dashboard** — Sections 1–7 wired to real data
6. **Quick Capture** — Modal + Cmd+K + floating button
7. **Projects** — CRUD + stale detection
8. **Retainers** — Template editor + cycle view
9. **Routines** — Morning/Afternoon/Evening management + daily logging
10. **Habits** — Streak calculation + heatmap calendar
11. **Notes** — CRUD + resurface scheduling
12. **Cron** — `/api/cron/daily` for retainer cycles + resurface
13. **Mobile polish** — Responsive, PWA meta for iPhone home screen

---

## Verification

1. `npm run dev` → app loads, redirects to `/login`
2. Google sign-in → land on Today Dashboard
3. `Cmd+K` → Quick Capture modal opens, saves to Captures
4. Create Project + complete a task → `last_activity_at` updates, stale warning disappears
5. Create Retainer with template → POST `/api/cron/daily` manually → cycle + items created
6. Check habit 3 days in a row → streak shows "3" 
7. Add note with `resurface_interval_days=1` → run cron → appears in Daily Resurface
8. Open on iPhone Safari → layout is usable, capture works with thumb
9. Supabase dashboard → confirm data scoped per `user_id`
