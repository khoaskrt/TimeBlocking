import type { Area } from "@/lib/types";

export const AREA_META: Record<Area, { label: string; color: string }> = {
  work: { label: "Work", color: "#3B82F6" },
  personal: { label: "Personal", color: "#10B981" },
  family: { label: "Family", color: "#8B5CF6" },
  health: { label: "Health", color: "#F59E0B" },
};
