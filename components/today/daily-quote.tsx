"use client";

import { useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { QUOTES } from "@/lib/features/today/constants";
import { SectionLabel } from "@/components/shared/section-label";

export function DailyQuote() {
  const [qi, setQi] = useState(0);
  const q = QUOTES[qi];

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
      <SectionLabel
        icon={<BookOpen size={13} strokeWidth={2} className="text-zinc-400" />}
        right={
          <span
            onClick={() => setQi((qi + 1) % QUOTES.length)}
            className="inline-flex items-center gap-1 text-[11.5px] text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors"
          >
            <RefreshCw size={12} strokeWidth={2} />
          </span>
        }
      >
        Daily quote
      </SectionLabel>
      <div className="text-[28px] leading-none font-bold text-zinc-300 mt-3 font-serif">&ldquo;</div>
      <p className="text-sm leading-relaxed text-zinc-900 font-[450] italic mt-0.5">
        {q.text}
      </p>
      <div className="mt-2.5 text-[11.5px] font-medium tracking-[0.04em] text-zinc-400">
        — {q.author}
      </div>
    </div>
  );
}
