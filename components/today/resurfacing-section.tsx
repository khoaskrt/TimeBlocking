"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ResurfaceNote } from "@/lib/types";

export interface ResurfacingSectionProps {
  note: ResurfaceNote;
}

export function ResurfacingSection({ note }: ResurfacingSectionProps) {
  const [resurfaced, setResurfaced] = useState(false);

  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400">
        Resurfacing
      </div>
      {resurfaced ? (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-zinc-400">
          Cleared. One note, quote, or idea rotates here daily.
        </p>
      ) : (
        <div className="mt-2.5 border border-zinc-200 rounded-[10px] p-3.5">
          <div className="text-[13.5px] font-semibold text-zinc-900">{note.title}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 line-clamp-2">
            {note.excerpt}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {[note.source, "Pricing"].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold tracking-[0.07em] uppercase text-zinc-500 border border-zinc-200 rounded-[5px] px-[7px] py-0.5"
              >
                {tag}
              </span>
            ))}
            <span className="flex-1" />
            <span
              onClick={() => setResurfaced(true)}
              className="text-[10px] font-semibold tracking-[0.07em] uppercase text-zinc-900 inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Check size={10} strokeWidth={2.5} /> Clear
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
