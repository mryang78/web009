import { analysisResult } from "@/lib/security-data";

const rows: [string, string][] = [
  ["威胁类型", analysisResult.threatType],
  ["严重程度", analysisResult.severity],
  ["置信度", analysisResult.confidence],
  ["受影响资产", analysisResult.affectedAsset],
  ["分析金额", analysisResult.simulatedAmount],
  ["攻击途径", analysisResult.attackVector],
  ["检测方式", analysisResult.detection],
];

export function AnalysisResult() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">安全分析结果</h2>
        <span className="text-xs text-foreground0">Analysis Summary</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card/65">
        <dl className="divide-y divide-white/[0.06]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-[13px] text-foreground0">{label}</dt>
              <dd
                className={
                  label === "严重程度"
                    ? "font-mono text-[13px] font-semibold text-red-400"
                    : "font-mono text-[13px] font-medium text-foreground/90"
                }
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
