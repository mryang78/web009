// 管理后台内展示 SOC 风险等级 / 案例风险等级时使用的浅色模式徽章样式
// （与 /soc 下面向前台的深色 RiskBadge 视觉体系区分，但复用同一套 RiskLevel 语义）。
import type { RiskLevel } from "@/lib/soc/types";

export const adminRiskBadgeClass: Record<RiskLevel, string> = {
  SAFE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  LOW: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export const adminAlertLevelBadgeClass: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-600 dark:text-red-400",
  High: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};
