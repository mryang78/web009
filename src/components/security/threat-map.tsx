import { mapCenter, mapNodes, threatLevelStyle } from "@/lib/security-data";
import { cn } from "@/lib/utils";

const DOT_FILL: Record<string, string> = {
  critical: "fill-red-500",
  high: "fill-orange-500",
  medium: "fill-amber-500",
  low: "fill-sky-500",
};

function pos(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 200 + radius * Math.cos(rad), y: 160 + radius * Math.sin(rad) };
}

export function ThreatMap() {
  return (
    <section id="threat-map" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">威胁关系图谱</h2>
        <span className="text-xs text-foreground0">Threat Map</span>
      </div>

      <div className="glass-panel relative mt-5 overflow-hidden rounded-2xl security-grid">
        <svg viewBox="0 0 400 320" className="h-[340px] w-full sm:h-[380px]">
          {mapNodes.map((n) => {
            const p = pos(n.angle, 120);
            return (
              <line
                key={n.id}
                x1={200}
                y1={160}
                x2={p.x}
                y2={p.y}
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 5"
                className="text-white/15"
              />
            );
          })}

          {mapNodes.map((n) => {
            const p = pos(n.angle, 120);
            return (
              <circle key={`${n.id}-dot`} r="3" className={DOT_FILL[n.level]}>
                <animateMotion
                  dur={`${3.2 + (Math.abs(n.angle) % 3) * 0.4}s`}
                  repeatCount="indefinite"
                  path={`M200,160 L${p.x},${p.y}`}
                />
              </circle>
            );
          })}

          <circle cx="200" cy="160" r="30" className="fill-red-500/15 stroke-red-500/40" strokeWidth="1" />
          <circle cx="200" cy="160" r="30" className="fill-none stroke-red-500/30">
            <animate attributeName="r" values="30;42;30" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" />
          </circle>

          {mapNodes.map((n) => {
            const p = pos(n.angle, 120);
            return (
              <g key={`${n.id}-node`}>
                <circle cx={p.x} cy={p.y} r="16" className="fill-[#0b0d14] stroke-white/12" strokeWidth="1" />
                <circle cx={p.x} cy={p.y} r="4" className={DOT_FILL[n.level]} />
              </g>
            );
          })}
        </svg>

        {mapNodes.map((n) => {
          const p = pos(n.angle, 120);
          const leftPct = (p.x / 400) * 100;
          const topPct = (p.y / 320) * 100;
          const s = threatLevelStyle[n.level];
          return (
            <span
              key={`${n.id}-label`}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className={cn(
                "pointer-events-none absolute -translate-x-1/2 translate-y-[14px] rounded-full border border-border/70 bg-popover/90 px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap",
                s.text
              )}
            >
              {n.label}
            </span>
          );
        })}

        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-red-500/30 bg-popover/95 px-3 py-1.5 text-center text-[11.5px] font-semibold text-red-400">
          {mapCenter}
        </span>
      </div>
      <p className="mt-3 text-xs text-foreground0">
        节点关系基于分析数据构建，用于分析资金与地址关联分析能力，不代表真实链上数据。
      </p>
    </section>
  );
}
