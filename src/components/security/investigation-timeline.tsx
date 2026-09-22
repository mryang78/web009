import { Search, ShieldAlert, Ban, CheckCircle2 } from "lucide-react";
import { analysisResult } from "@/lib/security-data";

const steps = [
  {
    label: "已检测",
    time: "22:39:52",
    icon: ShieldAlert,
    tone: "text-red-400 bg-red-500/10 border-red-500/25",
    detail: `${analysisResult.threatType} 由实时引擎自动识别`,
  },
  {
    label: "调查中",
    time: "22:40:08",
    icon: Search,
    tone: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    detail: `关联地址与合约行为交叉分析 · 置信度 ${analysisResult.confidence}`,
  },
  {
    label: "已拦截",
    time: "22:40:41",
    icon: Ban,
    tone: "text-orange-400 bg-orange-500/10 border-orange-500/25",
    detail: `拦截 ${analysisResult.simulatedAmount} 资产提取验证`,
  },
  {
    label: "已归档",
    time: "22:41:15",
    icon: CheckCircle2,
    tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    detail: "案例归档，生成安全报告草稿",
  },
];

export function InvestigationTimeline() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">调查时间线</h2>
        <span className="text-xs text-foreground0">Investigation Timeline · 案例编号 #SIM-10281</span>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card/65 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative flex sm:flex-col sm:items-center sm:text-center">
                <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${s.tone}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="sm:mt-1">
                    <div className="font-mono text-[11px] text-foreground0">{s.time}</div>
                    <div className="text-[13px] font-semibold text-foreground">{s.label}</div>
                    <p className="mt-0.5 max-w-[160px] text-[11.5px] leading-relaxed text-foreground0">{s.detail}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute top-[18px] left-9 hidden h-px w-[calc(100%-1rem)] bg-accent/60 sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
