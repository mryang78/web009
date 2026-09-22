export function Sparkline({
  data,
  className,
  color = "stroke-primary",
}: {
  data: number[];
  className?: string;
  color?: string;
}) {
  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <polygon points={areaPoints} className="fill-primary/8" />
      <polyline points={points} fill="none" strokeWidth="2" className={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MiniBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  return (
    <div className={className}>
      <div className="flex h-full items-end gap-0.5">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[1px] bg-primary/50"
            style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
