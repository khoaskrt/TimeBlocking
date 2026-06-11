# Design Integration Rules

Rules for integrating Claude Design output into this codebase. Read this before pasting any design code.

---

## Integration modes

Claude Design output can be integrated in two modes. Choose the mode from the user's request before editing.

| Mode | Use when | Implementation scope |
|---|---|---|
| **Partial Visual Patch** | The user asks for small refinements: spacing, color, typography, border treatment, icon choice, copy polish, responsive presentation | Presentation-only safe zones |
| **Full UI State Sync** | The user says the latest Claude Design UI is the required state/source of truth, or the design includes new interactions, buttons, sections, workflows, props, state, feature behavior, or data requirements | All affected UI, container, state, type, route, mock data, and feature logic layers |

Default to **Partial Visual Patch** for small design edits. Switch to **Full UI State Sync** only when the user explicitly says the latest Claude Design output is the newest required product state, source of truth, or must be synced into logic/features/functions.

---

## Architecture: Container / View split

Each complex component is split into two files:

| File pattern | Role | Who touches it |
|---|---|---|
| `*.view.tsx` | **Presentation only** — JSX, Tailwind, layout, icons | Design output goes here |
| `*.tsx` (no `.view`) | **Container** — props mapping, local UI state, data transforms | Developer only |

Simple components (`components/shared/*`, `daily-quote.tsx`) are single files — treat them as design-safe.

---

## Safe zones — design CAN modify

- `components/*/*.view.tsx` — presentation files (primary target)
- `components/shared/*.tsx` — shared UI primitives (checkbox, area-dot, progress-bar, section-label)
- `components/today/daily-quote.tsx` — self-contained presentational
- `app/globals.css` — global styles
- Tailwind classes in any view file

---

## Protected zones — design MUST NOT modify

- `lib/features/today/use-today-state.ts` — business state & handlers
- `lib/types/` — domain types
- `lib/constants/` — shared constants
- `lib/features/today/mock-data.ts` — mock data
- `lib/features/today/constants.ts` — today-specific constants
- `app/(dashboard)/*/page.tsx` — server components (auth, data fetching)
- `app/(dashboard)/today/today-dashboard.tsx` — orchestrator (wires state → components)
- Container files (`*.tsx` without `.view` suffix in `components/today/`)
- Any `Props` / `ViewProps` interface definitions

These zones are protected from direct visual-patch design edits. In **Full UI State Sync** mode, the codebase agent may update protected zones when the latest Claude Design state requires new or changed logic, data, props, routes, or feature behavior.

---

## Component contracts

Every view component has a typed props interface. In **Partial Visual Patch** mode, design output **must** implement the existing interface exactly — do not add, remove, or rename props.

Example — `Top3View` expects:
```typescript
interface Top3ViewProps {
  spots: (Task | null)[];
  onToggleTask: (id: string) => void;
  onToggleTop3: (id: string) => void;
}
```

If the request is **Full UI State Sync** and the latest design needs new data or actions, update the container, state hook, and `ViewProps` contract together, then pass the new data/action to the view.

---

## Integration prompt for Claude Design

When implementing a visual-only design into this codebase, use this prompt:

> Implement this design into the `.view.tsx` presentation files only.
> Do NOT modify state hooks, container components, or props interfaces.
> Match the existing component contracts — check each `*ViewProps` interface before editing its view file.
> Run `npx tsc --noEmit` after changes to verify nothing broke.

---

## Partial UI re-integration workflow

Use this workflow when Claude Design is refining an already-implemented UI. Treat the new design as a **visual patch**, not a replacement for the existing code.

### Claude Design must return a change summary

Ask Claude Design to include:

- Components changed
- Elements or sections changed inside each component
- What changed from the previous version to the new version
- Components, sections, interactions, and layout areas that should remain untouched
- Updated code only for the changed presentation parts

### Prompt for visual patches

Use this prompt when asking Claude Design for small refinements:

```text
You are modifying an existing implemented UI. Treat this as a visual patch, not a rewrite.

Keep the current layout, component structure, props, and interactions unchanged unless I explicitly ask otherwise.

Return:
1. A concise list of visual changes made
2. The affected components/sections
3. Any files/components that should remain untouched
4. Updated code only for the changed presentation parts

Do not rename props.
Do not add state.
Do not change data flow.
Do not rewrite unchanged sections.
```

### Codebase agent rules for visual patches

When integrating a revised Claude Design output:

1. Read this file before editing.
2. Identify affected components from Claude Design's change summary.
3. Compare the revised design against the current implementation before editing.
4. Edit only the safe zones needed for the listed visual changes.
5. Preserve existing imports, props interfaces, handlers, keys, accessibility attributes, and component boundaries unless a listed visual change requires a minimal presentation-only adjustment.
6. Leave all unmentioned sections exactly as they are.

Do **not** use a revised design as permission to rewrite the whole view. If the requested change is limited to spacing, color, typography, border treatment, icon choice, copy polish, or responsive presentation, keep the patch equally limited.

### Visual-only boundary

If the request is explicitly a visual patch, stop and report that the change is no longer visual-only if the revised design requires:

- New props, renamed props, or removed props
- New handlers or changed handler signatures
- New state, `useState`, `useEffect`, or business logic in a view file
- Data model, mock data, Supabase, or API changes
- Container, orchestrator, server component, or hook changes

Use this exact message:

> This is no longer a visual-only patch. The design requires data, action, state, or contract changes before it can be implemented safely.

Do **not** stop for this reason when the user has declared the latest Claude Design output as the required product state. In that case, use **Full UI State Sync**.

---

## Full UI State Sync workflow

Use this workflow when the user says the latest Claude Design UI is the newest required codebase state, product state, or source of truth. In this mode, the UI is not only a visual reference; it defines the feature behavior that must be synchronized into the app.

### Claude Design must return a full-sync summary

Ask Claude Design to include:

- Full feature/change summary
- New, changed, removed, or replaced interactions
- Expected behavior for each new or changed control
- Required data, state, actions, handlers, and validation
- Affected components, routes, and files
- Old behavior or UI that should be removed or replaced
- Unrelated areas that should remain untouched

### Prompt for full-sync outputs

Use this prompt when the latest Claude Design UI should become the newest product state:

```text
The latest UI you provide is the source of truth for the codebase implementation.

Return a full-sync handoff, not just visual code.

Include:
1. Full feature/change summary
2. New, changed, removed, or replaced interactions
3. Expected behavior for every new or changed control
4. Required data, state, actions, handlers, and validation
5. Affected components, routes, and files
6. Old behavior or UI that should be removed or replaced
7. Areas that must remain untouched

If a UI element implies a function, state change, filter, mutation, route, or data field, describe that implementation requirement explicitly.
```

### Codebase agent rules for full-sync

When integrating a full-sync Claude Design output:

1. Read this file before editing.
2. Treat the latest Claude Design output as the required state for the affected feature surface.
3. Map each UI change to the implementation layer it needs: view, container, hook, type, mock data, route, server component, or supporting feature logic.
4. Update `.view.tsx` files for presentation and update containers, props, state hooks, data types, mock data, routes, handlers, and feature logic when the design requires them.
5. Preserve unrelated app areas and avoid broad rewrites outside the affected feature surface.
6. Remove or replace old behavior only when the full-sync summary clearly supersedes it.
7. Keep business logic out of `.view.tsx` files unless the component is explicitly a simple self-contained presentational component and the logic is purely local UI presentation.

---

## Adding new features from design

When the design includes new interactions or data not in the current codebase, and the request is a full-sync or feature implementation:

1. Add the handler/state to `lib/features/today/use-today-state.ts`
2. Pass it through the container (`*.tsx`) as a new prop
3. Extend the `ViewProps` interface
4. Then implement the UI in the `.view.tsx`

Never add `useState`, `useEffect`, or business logic directly in a `.view.tsx` file.

---

## Verification after integration

```bash
npx tsc --noEmit          # Type check — catches broken contracts
npm run dev               # Visual check — confirm rendering
```

For partial UI re-integration, also verify:

- Only the components listed in the change summary changed.
- Unmentioned sections still match the previous implementation.
- No protected zones changed.
- Existing interactions still work: toggles, modal open/close, capture save, tabs, checkboxes, and buttons.

For full UI state sync, also verify:

- All new or changed controls have working handlers and expected behavior.
- Required props, state, types, mock data, routes, and feature logic are synchronized with the latest Claude Design state.
- Removed or replaced old behavior no longer appears in the affected feature surface.
- Existing affected workflows still work end to end.

If `tsc` reports errors after a partial visual patch, the design likely changed a prop interface or imported something it should not have. Fix by reverting the contract change, not by changing the container.

If `tsc` reports errors after a full UI state sync, fix the contract across all affected layers so views, containers, hooks, types, and route wiring agree with the latest Claude Design state.
