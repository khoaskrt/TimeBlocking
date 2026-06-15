import type { ResurfaceNote } from "@/lib/types";

// Tasks and routines now come from Supabase.
// Sections below stay mocked until their features are wired to the DB.
export const INITIAL_DATA = {
  resurface: {
    id: "n1",
    title: "Pricing strategy notes",
    excerpt: "Anchor on value, not hours. Offer three tiers so the middle one feels obvious. Revisit rates every two cycles…",
    saved: "Saved Mar 14",
    source: "Meeting",
  } satisfies ResurfaceNote,
};
