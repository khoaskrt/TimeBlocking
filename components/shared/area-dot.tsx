"use client";

import { AREA_META } from "@/lib/constants/areas";
import type { Area } from "@/lib/types";

export function AreaDot({ area, size = 8, mono = false }: { area: Area; size?: number; mono?: boolean }) {
  const color = mono ? "#A1A1AA" : AREA_META[area]?.color || "#6B7280";
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: color }}
    />
  );
}
