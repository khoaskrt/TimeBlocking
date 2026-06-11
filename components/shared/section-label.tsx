import { cn } from "@/lib/utils";

export function SectionLabel({
  icon,
  children,
  count,
  right,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  count?: number;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 whitespace-nowrap">
        {children}
      </span>
      {count !== undefined && (
        <span className="text-[11px] font-medium px-[7px] py-px rounded-full bg-zinc-100 text-zinc-600">
          {count}
        </span>
      )}
      <span className="flex-1" />
      {right}
    </div>
  );
}
