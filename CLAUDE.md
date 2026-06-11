@AGENTS.md

# Project Skeleton

```
middleware.ts                    # Next.js middleware (auth session refresh)

app/                             # Next.js App Router — routing only
├── layout.tsx                   # Root layout (fonts, metadata)
├── page.tsx                     # Root redirect → /today
├── globals.css                  # Tailwind theme + CSS custom properties
├── (auth)/                      # Public route group
│   └── login/page.tsx
├── (dashboard)/                 # Protected route group (auth-guarded)
│   └── today/
│       ├── page.tsx             # Server component (auth check, data fetch)
│       └── today-dashboard.tsx  # Client orchestrator (wires state → components)
└── auth/callback/route.ts       # OAuth callback handler

components/
├── shared/                      # Cross-feature presentational primitives
│   ├── checkbox.tsx
│   ├── area-dot.tsx
│   ├── progress-bar.tsx
│   ├── section-label.tsx
│   └── login-button.tsx
├── layout/                      # App shell (sidebar, nav bars)
│   ├── sidebar.tsx
│   └── mobile-tab-bar.tsx
├── today/                       # Feature: Today dashboard
│   ├── *.view.tsx               # Presentation (design-safe)
│   └── *.tsx                    # Container (logic, props mapping)
└── ui/                          # shadcn/ui base components
    └── button.tsx

lib/
├── types/index.ts               # Domain types (Area, Task, RoutineItem, …)
├── constants/areas.ts           # Shared constants (AREA_META)
├── features/today/              # Feature-specific data + state
│   ├── use-today-state.ts       # State hook
│   ├── constants.ts             # TASK_META, ROUTINE_STREAKS, QUOTES
│   └── mock-data.ts             # INITIAL_DATA
├── supabase/                    # Auth & DB infrastructure
│   ├── client.ts, server.ts, middleware.ts, env.ts
├── hooks/                       # Shared hooks (useDebounce, etc. — add as needed)
└── utils.ts                     # cn() utility

supabase/migrations/             # Database migrations
.docs/                           # Product specs, design prompts
```

# File Placement Rules

## Where does this file go?

| What you're adding | Where it goes | Example |
|---|---|---|
| **Domain type or interface** used by 2+ features | `lib/types/index.ts` | `Task`, `Area`, `RoutineItem` |
| **Constant** shared across features | `lib/constants/{name}.ts` | `AREA_META` in `areas.ts` |
| **Constant** used only by one feature | `lib/features/{feature}/constants.ts` | `TASK_META`, `QUOTES` |
| **Mock data / seed data** for a feature | `lib/features/{feature}/mock-data.ts` | `INITIAL_DATA` |
| **State hook** for a feature | `lib/features/{feature}/use-{feature}-state.ts` | `useTodayState` |
| **Shared utility hook** (not feature-specific) | `lib/hooks/{name}.ts` | `useDebounce`, `useMediaQuery` |
| **Utility function** | `lib/utils.ts` (or `lib/utils/{name}.ts` if it grows) | `cn()` |
| **Presentational component** used across features | `components/shared/{name}.tsx` | `RDCheckbox`, `AreaDot` |
| **App shell / navigation** component | `components/layout/{name}.tsx` | `Sidebar`, `MobileTabBar` |
| **Feature component** with logic | `components/{feature}/{name}.tsx` (container) | `top3-section.tsx` |
| **Feature component** presentation-only | `components/{feature}/{name}.view.tsx` | `top3-section.view.tsx` |
| **shadcn/ui base component** | `components/ui/{name}.tsx` | `button.tsx` |
| **Route page** | `app/(group)/{feature}/page.tsx` | Server component only |
| **Route client orchestrator** | `app/(group)/{feature}/{name}.tsx` | `today-dashboard.tsx` |
| **API route** | `app/api/{name}/route.ts` or `app/{path}/route.ts` | `auth/callback/route.ts` |
| **Supabase / infra code** | `lib/supabase/{name}.ts` | `client.ts`, `server.ts` |

## Rules

1. **Route directories contain only Next.js files** — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`. Client components go in `components/`.
2. **Container / View split** — Complex feature components split into `{name}.tsx` (container: logic, state, props mapping) and `{name}.view.tsx` (presentation: JSX + Tailwind only). Simple self-contained components use a single file.
3. **Types live in `lib/types/`**, not scattered in component files. Exception: `ViewProps` interfaces stay in their `.view.tsx` file.
4. **Feature isolation** — Each feature owns `components/{feature}/`, `lib/features/{feature}/`, and `app/(group)/{feature}/`. Cross-feature imports go through `lib/types/`, `lib/constants/`, `components/shared/`, or `components/layout/`.
5. **No business logic in `.view.tsx`** — Views receive data + callbacks via props. State, effects, data transforms, and API calls belong in containers or hooks.
6. **Shared before new** — Before creating a new utility, check if `components/shared/`, `lib/hooks/`, or `lib/utils.ts` already has it.

## Adding a new feature

Follow the pattern:

```
app/(dashboard)/{feature}/
  page.tsx                          # Server component (auth, data)
  {feature}-page.tsx                # Client orchestrator

components/{feature}/
  {section}.tsx                     # Container
  {section}.view.tsx                # Presentation

lib/features/{feature}/
  use-{feature}-state.ts            # State hook
  constants.ts                      # Feature constants
  mock-data.ts                      # Mock data (until DB wired)
```
