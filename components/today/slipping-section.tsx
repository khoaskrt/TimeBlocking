"use client";

import { useState } from "react";
import type { StaleProject } from "@/lib/types";

export interface SlippingSectionProps {
  staleProjects: StaleProject[];
}

export function SlippingSection({ staleProjects }: SlippingSectionProps) {
  const p = staleProjects[0];
  const [reviewed, setReviewed] = useState(false);

  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400">
        Slipping
      </div>
      {reviewed || !p ? (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-zinc-400">
          Nothing slipping right now. Projects that go quiet will surface here.
        </p>
      ) : (
        <div className="mt-2.5">
          <div className="text-[13.5px] font-medium text-zinc-900">{p.name}</div>
          <div className="text-[11px] tracking-[0.05em] uppercase text-zinc-400 mt-0.5">
            quiet for {p.daysAgo} days
          </div>
          <div className="mt-2">
            <button
              onClick={() => setReviewed(true)}
              className="px-2.5 py-1 text-[12px] font-medium border border-zinc-200 rounded-lg bg-white text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
