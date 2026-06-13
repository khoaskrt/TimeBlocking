import type { Area, Retainer, StaleProject, ResurfaceNote } from "@/lib/types";

// Tasks and routines now come from Supabase.
// Sections below stay mocked until their features are wired to the DB.
export const INITIAL_DATA = {
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
