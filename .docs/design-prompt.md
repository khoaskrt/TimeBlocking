# Design Prompt — TimeBlocking Personal Dashboard

## Project Overview
Personal time management dashboard for a busy professional. Manages tasks, projects, retainer clients, daily routines, and resurfaced notes — all in one place.

**Current state:** Full dashboard with 4 pages (Today, Tasks, Projects, Routines). Supabase backend with Google OAuth. Google Calendar integration live. Two-column editorial layout on Today page with all sections implemented.

---

## Design Direction

**Aesthetic:** Editorial minimalist — Notion meets Linear.
**Feeling:** Clean, distraction-free, high information density without clutter. Generous whitespace, editorial typography.
**Mode:** Light mode primary. Sidebar uses light neutral tones (CSS custom properties, oklch-based). No dark sidebar — the sidebar is clean and light, matching the overall aesthetic.

---

## Color System

Uses CSS custom properties with oklch values in `globals.css`. Key tokens:

```
Background (main):     white
Surface/Cards:         no heavy shadows — subtle h-px bg-zinc-100 dividers
Text primary:          zinc-900
Text secondary:        zinc-500
Text muted:            zinc-400
Section headers:       11px uppercase tracking-wider zinc-400

Sidebar:               oklch custom properties (--sidebar, --sidebar-foreground, etc.)
Sidebar active item:   --sidebar-accent / --sidebar-accent-foreground
Sidebar logo accent:   --sidebar-primary (dark bg, white text)

Area colors (dot badges + inline labels):
  Work:      #3B82F6  (blue-500)
  Personal:  #10B981  (emerald-500)
  Family:    #8B5CF6  (violet-500)
  Health:    #F59E0B  (amber-500)

Status:
  Warning:   amber-500
  Danger:    red-500
  Success:   emerald-500
```

---

## Typography

```
Font family:   Inter (loaded via next/font, var: --font-inter)
Mono:          Geist Mono (loaded via next/font, var: --font-geist-mono)

Header label:      11px  font-semibold  tracking-[0.12em]  uppercase  zinc-400
H1 (page title):   32px  font-semibold  tracking-tight  zinc-900
Clock/meta:        14px  font-medium  zinc-500
Section headers:   11px  ALL CAPS  tracking-wider  zinc-400
Body/tasks:        13-14px  font-normal
Caption:           12px  zinc-400
Sidebar text:      13.5px
```

---

## Layout Structure (Current Implementation)

Two-column desktop layout with collapsible right rail:

```
┌──────────┬────────────────────────────────────┬──────────────┐
│          │  "Today" (11px uppercase label)    │              │
│          │  "Wednesday, June 10" (32px bold)  │  Daily Quote │
│          │  Clock HH:MM (14px, live)          │              │
│ SIDEBAR  ├────────────────────────────────────┤  Routines    │
│ 220px    │  ── divider ──                     │  (blocks +   │
│ light    │  Top 3 for Today                   │  streaks)    │
│ neutral  │  ── divider ──                     │              │
│          │  Calendar (Google Calendar events)  │  Retainers   │
│          │  ── divider ──                     │  (progress)  │
│          │  Today's Tasks + All Tasks         │              │
│          │  (grouped, collapsible)            │  Slipping    │
│          │                                    │              │
│          │                                    │  Resurfacing │
└──────────┴────────────────────────────────────┴──────────────┘
```

**Left column:** `flex-1 max-w-[620px]` — Editorial header → Top 3 → Tasks
**Right rail:** `w-[290px] max-lg:hidden` — Quote → Routines → Retainers → Slipping → Resurfacing
**Dividers:** `h-px bg-zinc-100 my-5`
**Container padding:** `px-5 pt-8 pb-28 sm:px-8 md:px-11 md:pt-9 md:pb-20`
**Gap between columns:** `gap-12`

---

## Sidebar (Desktop — 220px)

Light sidebar with oklch-based custom properties.

**Logo:** 24px rounded-md box with "T" letter + "TimeBlocking" text
**Nav items (with Lucide icons):**
- Today (Home) — active: semibold + accent bg
- Tasks (CheckSquare)
- Routines (Sunrise)
- People (Users)
- Library (BookOpen)

**User section (bottom):**
- Avatar circle with initials (22px)
- User name (truncated)
- Three-dot menu (MoreHorizontal)
- Popup: user name/email + Sign out button

**Nav item specs:**
- `px-2.5 py-[7px] rounded-lg text-[13.5px]`
- Active: `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`
- Inactive: `text-sidebar-foreground/60 hover:bg-sidebar-accent/50`
- Icons: `size={16}`, active `strokeWidth={2}`, inactive `strokeWidth={1.75}`

---

## Today Dashboard Sections (All Implemented)

### 1. Editorial Header
- "Today" label: `text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-400`
- Date: `text-[32px] font-semibold tracking-tight text-zinc-900`
- Live clock: `text-[14px] font-medium text-zinc-500` with Clock icon

### 2. Top 3 for Today (left column)
- Star icon (lucide Star) to pin/unpin tasks
- Max 3 pinned tasks enforced in state
- 3 slots rendered — empty slots show placeholder
- Each row: Star toggle + Checkbox + Task title + Area dot
- Container: `top3-section.tsx` → View: `top3-section.view.tsx`

### 3. Calendar (left column — between Top 3 and Tasks)
- Google Calendar integration — shows today's events
- `CALENDAR · {count}` header with external link icon → Google Calendar
- All-day events: rounded-full pill badges at top (`bg-zinc-100`)
- Timed events: vertical list (HH:MM timestamp + title + optional Meet icon + location)
- "Now" indicator: 7px pulsing emerald dot + `bg-zinc-50 border border-zinc-200` highlight
- Past events: 50% opacity
- "Next up" badge on first event after current
- States: connected+events, empty, not connected, reconnect needed
- Container: `calendar-section.tsx` → View: `calendar-section.view.tsx`
- Custom `@keyframes calPulse` in `globals.css`

### 4. Today's Tasks (left column)
- Grouped by area (Work, Personal, Family, Health)
- Each group: area dot + label header → task rows underneath
- Task row: Checkbox + Title + metadata badges (project, due time, overdue, recurring)
- Completed tasks: collapsible "Completed" section with count
- Completed task style: strikethrough, muted text

### 5. All Tasks (collapsed section, left column)
- Grouped by project name
- Collapsible (chevron toggle per project group)
- Shows tasks NOT due today
- "View all" link per project group

### 6. Daily Quote (right rail)
- BookOpen icon + "Thought for today" label
- Quote text in italic/medium weight
- Author attribution
- Refresh button (RefreshCw icon) cycles through QUOTES array

### 7. Routines (right rail)
- `ROUTINES · {done}/{total}` header with "View all" link
- Three blocks: Morning | Afternoon | Evening
- Each block: checklist items with checkboxes
- Streak badges per item (flame icon + day count)
- Container: `routines-section.tsx` → View: `routines-section.view.tsx`

### 8. Retainers Progress (right rail)
- Each retainer: client name + area dot + progress bar (done/total) + month label
- RefreshCw icon in header
- Compact card layout

### 9. Slipping Projects (right rail)
- Only shows if stale projects exist
- Warning style: "Project Name · Last active X days ago"
- "Review" action per item

### 10. Daily Resurfacing (right rail)
- Note card: title + excerpt (2-line clamp) + "Saved date" + source tag
- "Got it" dismiss button (Check icon)
- Expandable to show full excerpt

---

## Component Architecture

### Container / View Split
Complex components are split:
- `*.view.tsx` — Presentation only (JSX + Tailwind). Design-safe zone.
- `*.tsx` — Container (logic, state, props mapping). Protected from design edits.

### Shared Primitives (`components/shared/`)
- `RDCheckbox` — Custom checkbox (16px, rounded, animated)
- `AreaDot` — Colored circle (8px) + area label text
- `ProgressBar` — Horizontal progress bar with percentage
- `SectionLabel` — Uppercase section header + optional count badge
- `LoginButton` — Google sign-in button

### Domain Types (`lib/types/index.ts`)
```typescript
type Area = "work" | "personal" | "family" | "health"

interface Task {
  id: string; title: string; area: Area;
  due?: string | null; today: boolean;
  top3?: boolean; done: boolean; completedAt?: string; project?: string;
}

interface RoutineItem { id: string; label: string; done: boolean; streak: number; }
interface Routine { id: string; label: string; group: RoutineGroupId; freq: RoutineFrequency; recurrence?: RoutineRecurrence; done: boolean[]; }
interface CalendarEvent { id: string; title: string; startTime: string; endTime: string; allDay: boolean; location?: string; meetLink?: string; status: "confirmed" | "tentative" | "cancelled"; }
interface CalendarState { events: CalendarEvent[]; connected: boolean; error?: string; }
interface TodayMonthlyService { id: string; name: string; area: Area; doneItems: number; totalItems: number; loggedHours: number; monthlyHours: number; month: string; }
interface StaleProject { id: string; name: string; area: Area; daysAgo: number; kind: "project" | "retainer"; openTasks: number; }
interface ResurfaceNote { id: string; title: string; excerpt: string; saved: string; source: string; }
```

---

## Mobile (iPhone) Considerations

- Sidebar hidden on mobile (`hidden md:flex`)
- Bottom tab bar: fixed bottom, 5 tabs (Today, Tasks, Routines, People, Library)
  - `pb-[calc(env(safe-area-inset-bottom)+10px)]` for safe area
  - Icons: 21px, active `strokeWidth={2}`, inactive `strokeWidth={1.7}`
  - Labels: `text-[10px] font-medium`
- Right rail hidden on mobile (`max-lg:hidden`)
- Main content: full-width cards, `px-5 pt-8 pb-28`
- All sections stack vertically in left column

---

## Screens to Design (Priority Order)

### Already designed & implemented:
1. Today Dashboard (desktop) — two-column editorial layout with all sections
2. Today Calendar section — Google Calendar integration (designed via Claude Design)
3. Sidebar navigation (desktop) — light neutral, 220px
4. Mobile: Bottom tab bar
5. Login page
6. Tasks page — task management with filtering/grouping
7. Projects page — project & retainer management
8. Routines page — routine tracking with frequency, streaks, sparklines

### Next to design:
1. Quick Capture modal (Cmd+K / floating + button)
2. People page (retainer clients + cycle view)
3. Library page (notes + resurface scheduling)
4. Mobile: Today Dashboard refinements (right-rail sections stacked below main)
5. Habits page with streak heatmap (future)
6. Project detail page (future)
7. Settings page (calendar timezone, area management)
