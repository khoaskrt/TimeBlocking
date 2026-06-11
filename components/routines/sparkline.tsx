export function Sparkline({
  data,
  height = 44,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const W = 300;
  const H = 44;
  // Emphasize the useful range: map 50%…100% onto the full height.
  const pts = data.map((v, i) => {
    const t = Math.max(0, Math.min(1, (v - 0.5) / 0.5));
    return [(i / Math.max(data.length - 1, 1)) * W, H - 4 - t * (H - 10)] as const;
  });
  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height, display: "block", overflow: "visible" }}
    >
      <path d={`${line} L${W},${H} L0,${H} Z`} className="fill-zinc-100" />
      <path
        d={line}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className="stroke-zinc-900"
      />
      <circle cx={last[0]} cy={last[1]} r={3} className="fill-zinc-900" />
    </svg>
  );
}
