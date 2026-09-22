// ---------------------------------------------------------------------------
// 统一风险等级换算 —— 全站唯一的 RiskLevel ⇄ 旧版标签 转换实现
//
// 历史上项目里出现过三套独立的风险标签系统（WalletStatus 中文六级 / RiskLevel
// 大写英文五级 / ThreatLevel 小写英文四级），彼此没有换算关系，导致同一个
// "高风险"概念在不同页面渲染成不一样的文案和颜色。本文件把 RiskLevel 定为
// 唯一的规范（canonical）等级，其余标签一律通过这里的函数与它互相换算，
// 不再各自维护独立的判定逻辑。
// ---------------------------------------------------------------------------

import type { ApprovalRiskLevel, RiskLevel, ThreatLevel, WalletStatus } from "./types";

/** 统一的"评分 → 风险等级"判定，全站唯一实现。 */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  if (score >= 15) return "LOW";
  return "SAFE";
}

const WALLET_STATUS_TO_RISK: Record<WalletStatus, RiskLevel> = {
  正常: "SAFE",
  监控中: "LOW",
  中风险: "MEDIUM",
  高风险: "HIGH",
  严重风险: "CRITICAL",
  已冻结: "CRITICAL",
};
export function riskLevelFromWalletStatus(status: WalletStatus): RiskLevel {
  return WALLET_STATUS_TO_RISK[status];
}

const RISK_TO_WALLET_STATUS: Record<RiskLevel, WalletStatus> = {
  SAFE: "正常",
  LOW: "监控中",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "严重风险",
};
/** frozen=true 用于表达"已冻结"这一 CRITICAL 之外的特殊终态。 */
export function walletStatusFromRiskLevel(level: RiskLevel, frozen = false): WalletStatus {
  if (frozen) return "已冻结";
  return RISK_TO_WALLET_STATUS[level];
}

const THREAT_TO_RISK: Record<ThreatLevel, RiskLevel> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};
export function riskLevelFromThreatLevel(level: ThreatLevel): RiskLevel {
  return THREAT_TO_RISK[level];
}

const RISK_TO_THREAT: Record<RiskLevel, ThreatLevel> = {
  SAFE: "low",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};
export function threatLevelFromRiskLevel(level: RiskLevel): ThreatLevel {
  return RISK_TO_THREAT[level];
}

export function approvalRiskFromRiskLevel(level: RiskLevel): ApprovalRiskLevel {
  return threatLevelFromRiskLevel(level);
}
export function riskLevelFromApprovalRisk(level: ApprovalRiskLevel): RiskLevel {
  return riskLevelFromThreatLevel(level);
}

export const riskLevelLabelZh: Record<RiskLevel, string> = {
  SAFE: "安全",
  LOW: "低风险",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "严重风险",
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  SAFE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  LOW: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const riskDotClass: Record<RiskLevel, string> = {
  SAFE: "bg-emerald-400",
  LOW: "bg-sky-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-400",
  CRITICAL: "bg-red-400",
};
