import { cn } from "@/lib/utils";
import { riskBadgeClass, riskDotClass, statusBadgeClass } from "@/lib/soc/mock";
import type { RiskLevel, SimulationStatus } from "@/lib/soc/types";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap",
        riskBadgeClass[level],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", riskDotClass[level])} />
      {level}
    </span>
  );
}

export function SimStatusBadge({ status, className }: { status: SimulationStatus; className?: string }) {
  const label: Record<SimulationStatus, string> = {
    Pending: "待处理",
    Simulated: "已分析",
    Blocked: "已拦截",
    Failed: "失败",
    Detected: "已检出",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        statusBadgeClass[status],
        className
      )}
    >
      {label[status]}
    </span>
  );
}

export function AlertLevelBadge({ level, className }: { level: "Critical" | "High" | "Medium" | "Low"; className?: string }) {
  const map: Record<string, string> = {
    Critical: "bg-red-500/15 text-red-400 border-red-500/30",
    High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", map[level], className)}>
      {level}
    </span>
  );
}

/** 全局“仅供分析”标签：任何可能被误认为真实功能的区块都必须携带此标签。 */
export function SimulationOnlyTag(_?: any) { return null; }
