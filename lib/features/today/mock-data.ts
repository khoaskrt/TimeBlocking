import type { Area, RoutineItem, Retainer, StaleProject, ResurfaceNote } from "@/lib/types";

// Tasks now come from Supabase (lib/features/today/server.ts).
// Sections below stay mocked until their features are wired to the DB.
export const INITIAL_DATA = {
  routines: {
    morning: [
      { id: "r1", label: "Review calendar", done: true },
      { id: "r2", label: "Clear inbox to zero", done: true },
      { id: "r3", label: "Set Top 3 for today", done: true },
      { id: "r4", label: "Stretch 10 minutes", done: false },
      { id: "r5", label: "Deep work block (90 min)", done: false },
    ],
    afternoon: [
      { id: "r6", label: "Walk after lunch", done: false },
      { id: "r7", label: "Client follow-ups", done: false },
      { id: "r8", label: "Review task inbox", done: false },
    ],
    evening: [
      { id: "r9", label: "Plan tomorrow", done: false },
      { id: "r10", label: "Read 20 minutes", done: false },
      { id: "r11", label: "Screens off by 22:30", done: false },
    ],
  } satisfies Record<string, RoutineItem[]>,
  retainers: [
    { id: "rt1", client: "Lotus Media", area: "work" as Area, doneItems: 6, totalItems: 10, month: "June" },
    { id: "rt2", client: "Pham & Partners", area: "work" as Area, doneItems: 3, totalItems: 8, month: "June" },
  ] satisfies Retainer[],
  staleProjects: [
    { id: "sp1", name: "Portfolio refresh", area: "personal" as Area, daysAgo: 12 },
  ] satisfies StaleProject[],
  resurface: {
    id: "n1",
    title: "Pricing strategy notes",
    excerpt: "Anchor on value, not hours. Offer three tiers so the middle one feels obvious. Revisit rates every two cycles…",
    saved: "Saved Mar 14",
    source: "Meeting",
  } satisfies ResurfaceNote,
};
