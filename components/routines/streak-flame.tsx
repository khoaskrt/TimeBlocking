import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakFlame({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[3px] min-w-[30px] justify-end text-amber-500">
      <Flame size={size} strokeWidth={2} />
      <span
        className={cn(
          "text-[12px] font-semibold tabular-nums",
          n > 0 ? "text-zinc-500" : "text-zinc-300",
        )}
      >
        {n}
      </span>
    </span>
  );
}
