// ---------------------------------------------------------------------------
// Risk Engine —— 钱包层面的聚合风险评估（risk-engine.ts）
//
// 与同目录的 factors.ts 的分工：factors.ts 是不依赖任何其它 Engine 的纯规则
// 计算层，Approval/Signature Engine 直接从那里导入 compute*RiskFactors() 来
// 给自己的记录评分（见 approval-engine.ts / signature-engine.ts）。本文件是
// 更上层的聚合入口——读取 Wallet / Asset / Approval / Signature 四个 Engine
// 的"当前真实状态"，把它们汇总成一份钱包层面的风险评估，因此依赖它们（这也是
// 为什么这两层要拆开文件：避免 Approval/Signature Engine → Risk Engine →
// Approval/Signature Engine 的循环依赖）。
// ---------------------------------------------------------------------------

import { calculateProjectedLoss } from "@/lib/asset-engine";
import { getApprovalsByWallet } from "@/lib/approval-engine";
import { getSignaturesByWallet } from "@/lib/signature-engine";
import { getWalletState } from "@/lib/wallet-engine";
import type { RiskLevel } from "@/lib/shared/types";
import { assessWalletRiskFactors } from "./factors";
import type { RiskAssessment } from "./risk-types";

const HIGH_RISK_LEVELS: readonly RiskLevel[] = ["HIGH", "CRITICAL"];

/**
 * 汇总某个钱包"当前真实分析状态"下的风险：有多少笔高风险 Approval/Signature
 * 挂在它名下、按当前持仓风险等级推算出的预计影响金额有多大。全部来自 Wallet /
 * Asset / Approval / Signature Engine 的真实（实时分析）状态，不凭空编数字。
 */
export function assessWalletRisk(walletId: string): RiskAssessment {
  const wallet = getWalletState(walletId);
  const approvals = getApprovalsByWallet(walletId);
  const signatures = getSignaturesByWallet(walletId);

  const highRiskApprovalCount = approvals.filter((a) => HIGH_RISK_LEVELS.includes(a.riskLevel)).length;
  const highRiskSignatureCount = signatures.filter((s) => HIGH_RISK_LEVELS.includes(s.riskLevel)).length;

  const riskOrder: Record<RiskLevel, number> = { SAFE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  const worstRiskLevel: RiskLevel = [...approvals, ...signatures].reduce<RiskLevel>(
    (worst, record) => (riskOrder[record.riskLevel] > riskOrder[worst] ? record.riskLevel : worst),
    "SAFE"
  );

  const projectedLossUsd = calculateProjectedLoss({ walletId, riskLevel: worstRiskLevel });

  return assessWalletRiskFactors({
    walletId,
    totalValueUsd: wallet.totalValueUsd,
    highRiskApprovalCount,
    highRiskSignatureCount,
    projectedLossUsd,
  });
}
