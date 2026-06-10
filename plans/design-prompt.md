# Design Prompt — ReSolve Personal Dashboard

## Project Overview
Design a personal time management dashboard web application. The app helps a busy professional manage tasks, projects, retainer clients, daily routines, habits, and resurface old notes — all in one place.

---

## Design Direction

**Aesthetic:** Minimalist, calm, focus-oriented — like Notion meets Linear.
**Feeling:** Clean, distraction-free, high information density without feeling cluttered.
**Mode:** Light mode primary, with a persistent dark sidebar (like Notion's left nav).

---

## Color Palette

```
Background (main):   #FAFAFA  (zinc-50)
Surface (cards):     #FFFFFF  (white)
Border:              #E4E4E7  (zinc-200)
Text primary:        #18181B  (zinc-900)
Text secondary:      #71717A  (zinc-500)
Text muted:          #A1A1AA  (zinc-400)

Sidebar background:  #18181B  (zinc-900)
Sidebar text:        #F4F4F5  (zinc-100)
Sidebar active item: #27272A  (zinc-800)

Accent (primary):    #3B82F6  (blue-500)  — for buttons, links, focus rings
Accent (hover):      #2563EB  (blue-600)

Area colors (dot badges):
  Work:      #3B82F6  (blue)
  Personal:  #10B981  (emerald)
  Family:    #8B5CF6  (violet)
  Health:    #F59E0B  (amber)
  Other:     #6B7280  (gray)

Status:
  Warning:   #F59E0B  (amber-500)
  Danger:    #EF4444  (red-500)
  Success:   #10B981  (emerald-500)
```

---

## Typography

```
Font family:   Inter (Google Fonts)
Base size:     14px
Line height:   1.5

H1 (page title):   24px  font-semibold
H2 (section):      16px  font-semibold  color: zinc-700
H3 (card title):   14px  font-medium
Body:              14px  font-normal
Caption / meta:    12px  color: zinc-400
```

---

## Layout Structure

```
┌──────────┬──────────────────────────────────────────┐
│          │  [Top bar: page title + Quick Capture +] │
│          │  [Date display]                          │
│ SIDEBAR  ├──────────────────────────────────────────┤
│ 240px    │                                          │
│ dark     │         MAIN CONTENT AREA                │
│          │         max-width: 860px                 │
│          │         centered, padding: 32px          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Sidebar nav items (with Lucide icons):**
- Today (Home icon) — active state: blue text + left border accent
- Inbox (Inbox icon) + badge count
- Projects (FolderOpen icon)
- Retainers (RefreshCw icon)
- Routines (Sunrise icon)
- Habits (Flame icon)
- Notes (BookOpen icon)
- ── divider ──
- Settings (Settings icon)

---

## Screen 1: Today Dashboard

The most important screen. Single-column layout with clearly separated sections.

### Section: Top 3 for Today
- Soft yellow/amber tinted card (`amber-50` bg, `amber-200` border)
- Title: "📌 Top 3 for Today" in small caps or muted label
- 3 task rows with large checkbox, task title, area dot badge
- "Pin a task" empty state with dashed border

### Section: Today's Tasks
- White card, section header "Today's Tasks" + count badge
- Task rows: checkbox | title | area dot | due time (if any)
- Grouped by area (Work · Personal · Family)
- Completed tasks: strikethrough, muted — collapsible

### Section: Routines
- White card, tab switcher: Morning | Afternoon | Evening
- Checklist items per tab with checkbox
- Progress bar at top of card (e.g. "3/5 done")

### Section: All Tasks
- Collapsible section (collapsed by default to save space)
- Shows tasks NOT due today, grouped by project
- Small "↗" link to full task view

### Section: Retainer Progress
- Horizontal card row (or 2-column grid for multiple retainers)
- Each retainer: client name, area dot, progress bar (e.g. "6/10 items"), month label
- Click → goes to `/retainers/[id]`

### Section: Stale Projects
- Only shows if there are stale projects
- Amber warning card: ⚠️ icon + "Project Name · Last active 12 days ago" + "Review →" button
- If none: section is hidden entirely

### Section: Daily Resurface
- Soft purple/lavender tinted card (`violet-50` bg)
- Title: "💡 From Your Notes"
- Note card: title, excerpt (2 lines), date saved, source tag
- "Got it" button (dismiss) + "Open note →" link

---

## Screen 2: Quick Capture Modal

Triggered by floating `+` button or `Cmd+K`.

```
┌─────────────────────────────────────────────┐
│  ✏️  What's on your mind?                    │
│  ┌───────────────────────────────────────┐  │
│  │ Type anything...                      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Work ▾]  [No date ▾]  [⬆ High ▾]         │
│                                    [Save →] │
└─────────────────────────────────────────────┘
```

- Backdrop blur overlay
- Card: white, rounded-2xl, shadow-xl, max-width 520px
- Large textarea (auto-resize, 1–4 lines)
- Bottom row: Area picker (colored dot dropdown) | Date picker | Priority toggle | Save button
- `Esc` closes, `Enter` saves (or `Cmd+Enter` if multiline)
- Floating button: fixed bottom-right, `blue-500` background, white `+` icon, `rounded-full`, `shadow-lg`

---

## Screen 3: Projects List

- Page header: "Projects" + "+ New Project" button (right-aligned)
- Filter tabs: All | Active | Done | Paused
- Area filter chips row (color dots)
- Project cards in a list:
  ```
  ┌──────────────────────────────────────────────┐
  │ ● Work   Project Name              [Active]  │
  │ Last active 2 days ago · 4 tasks open    →   │
  └──────────────────────────────────────────────┘
  ```
- Stale projects: amber left border + ⚠️ indicator
- Empty state: illustration + "Start your first project"

---

## Screen 4: Habits Page

- Grid of habit cards (2 columns on desktop, 1 on mobile)
- Each habit card:
  - Habit name + area dot
  - Streak counter: "🔥 14 days" in large, bold text
  - Mini 4-week streak heatmap (green/gray squares)
  - Today's checkbox: "Mark done today"
- Section below: small "Add Habit" card with dashed border

---

## Component Specs

### Task Row
```
[☐] Task title                    [area dot] [due date]
```
- Height: 40px
- Hover: `zinc-50` bg
- Checkbox: 16px, rounded-sm, blue when checked
- Completed: opacity-50, line-through on title

### Area Dot Badge
- 8px circle, colored per area
- Followed by area name in `zinc-400` text, 12px
- Used consistently in all lists

### Section Header
- Label: 11px ALL CAPS, letter-spacing wider, `zinc-400`
- Optional count badge: `zinc-100` bg, `zinc-600` text, rounded-full, 12px

### Card
- `bg-white border border-zinc-200 rounded-xl p-4`
- No heavy shadows — just border

### Primary Button
- `bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium`

### Destructive/Warning Tag
- `bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-2 py-0.5 text-xs`

---

## Mobile (iPhone) Considerations

- Sidebar collapses to bottom tab bar on mobile (5 tabs: Today, Inbox, Projects, Habits, Notes)
- Quick Capture button: fixed `bottom-20` on mobile (above tab bar)
- All input forms: large touch targets, `text-16px` inputs (prevents iOS zoom)
- Today sections stack vertically, full-width cards

---

## Screens to Design (Priority Order)

1. Today Dashboard (desktop) — most important, hero screen
2. Quick Capture modal
3. Sidebar navigation (desktop)
4. Projects list
5. Retainer detail page (cycle checklist)
6. Habits page with streak heatmap
7. Mobile: Today Dashboard (iPhone)
8. Mobile: Bottom tab bar + Quick Capture
