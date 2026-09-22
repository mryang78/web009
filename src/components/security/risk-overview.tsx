import { riskCategories, riskScore, threatLevelStyle } from "@/lib/security-data";
import { cn } from "@/lib/utils";

const R = 54;
const CIRC = 2 * Math.PI * R;

export function RiskOverview() {
  const pct = riskScore.value / riskScore.max;
  const offset = CIRC * (1 - pct);
  const style = threatLevelStyle[riskScore.level];

  return (
    <section id="threat-overview" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">风险总览</h2>
        <span className="text-xs text-foreground0">Threat Overview</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/65 p-6">
          <div className="relative size-32">
            <svg viewBox="0 0 128 128" className="size-32 -rotate-90">
              <circle cx="64" cy="64" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/8" />
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                className={style.text}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
                {riskScore.value}
              </span>
              <span className="text-[11px] text-foreground0">/ {riskScore.max}</span>
            </div>
          </div>
          <span
            className={cn(
              "mt-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
              style.bg,
              style.text
            )}
          >
            {style.label.toUpperCase()}
          </span>
          <p className="mt-1 text-[11px] text-foreground0">风险评分</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/65 p-5 sm:p-6">
          <p className="text-xs font-medium text-foreground0">风险分类标签</p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {riskCategories.map((c) => {
              const s = threatLevelStyle[c.level];
              return (
                <span
                  key={c.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
                    s.bg,
                    s.text,
                    "border-border/70"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", s.dot)} />
                  {c.label}
                </span>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-foreground0">
            以上分类为安全分析标签，基于实时数据生成，用于分析风险归类能力，不代表真实链上判定结果。
          </p>
        </div>
      </div>
    </section>
  );
}
