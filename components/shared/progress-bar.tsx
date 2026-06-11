export function ProgressBar({
  value,
  max,
  height = 4,
}: {
  value: number;
  max: number;
  height?: number;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="rounded-full bg-zinc-100 overflow-hidden w-full" style={{ height }}>
      <div
        className="h-full rounded-full bg-zinc-900 transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
