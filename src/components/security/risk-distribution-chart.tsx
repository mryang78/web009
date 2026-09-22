import { riskDistribution, threatLevelStyle } from "@/lib/security-data";
import { cn } from "@/lib/utils";

const R = 60;
const CIRC = 2 * Math.PI * R;
const DOT_COLOR: Record<string, string> = {
  critical: "stroke-red-500",
  high: "stroke-orange-500",
  medium: "stroke-amber-500",
  low: "stroke-sky-500",
};

function withOffsets(segments: typeof riskDistribution) {
  let cumulative = 0;
  return segments.map((seg) => {
    const frac = seg.value / 100;
    const dash = frac * CIRC;
    const offset = -(cumulative * CIRC);
    cumulative += frac;
    return { ...seg, dash, offset };
  });
}

export function RiskDistributionChart() {
  const segments = withOffsets(riskDistribution);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">风险等级分布</h2>
        <span className="text-xs text-foreground0">Risk Distribution</span>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 rounded-2xl border border-border/70 bg-card/65 p-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        <div className="relative mx-auto size-40 shrink-0">
          <svg viewBox="0 0 144 144" className="size-40 -rotate-90">
            <circle cx="72" cy="72" r={R} fill="none" stroke="currentColor" strokeWidth="16" className="text-white/6" />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx="72"
                cy="72"
                r={R}
                fill="none"
                strokeWidth="16"
                strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                strokeDashoffset={seg.offset}
                className={DOT_COLOR[seg.level]}
                stroke="currentColor"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">100%</span>
            <span className="text-[11px] text-foreground0">已分析</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {riskDistribution.map((seg) => {
            const s = threatLevelStyle[seg.level];
            return (
              <div key={seg.label} className="flex items-center gap-2.5">
                <span className={cn("size-2.5 shrink-0 rounded-full", s.dot)} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground/90">{seg.label}</div>
                  <div className="font-mono text-xs tabular-nums text-foreground0">{seg.value}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
