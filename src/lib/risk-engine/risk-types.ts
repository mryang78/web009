// ---------------------------------------------------------------------------
// Risk Engine —— 类型定义
//
// 目标：把"风险分数从哪里来"从零散的、逐处手写的固定数字（例如某个钱包永远
// riskScore: 97）改造成可追溯的规则计算——一组具名风险因素（Risk Factor）各自
// 贡献一份权重，加总后归一化到 0～100，再统一映射到 SAFE/LOW/MEDIUM/HIGH/
// CRITICAL 五档。同一份输入永远得到同一份输出（确定性，非真随机），但输出是
// "算出来的"，不是写死的常量。
// ---------------------------------------------------------------------------

import type { RiskLevel, SignatureType } from "@/lib/shared/types";

/** 风险因素的完整词表——Approval / Signature / Wallet 三类评估共用同一套 key。 */
export type RiskFactorKey =
  | "unknownDapp"
  | "suspiciousSpender"
  | "unlimitedAllowance"
  | "largeValue"
  | "newContract"
  | "signatureRisk"
  | "permitRisk"
  | "addressRisk"
  | "behaviorRisk";

/** 单个风险因素的计算结果：命中与否、贡献了多少权重、为什么。 */
export interface RiskFactorHit {
  key: RiskFactorKey;
  /** 该因素实际贡献的权重（未命中时为 0，仍然出现在列表里，保证可解释性/可审计）。 */
  weight: number;
  triggered: boolean;
  reason: string;
}

/** 一次完整的风险评估结果：可追溯到每一条 factor，而不是一个孤立的数字。 */
export interface RiskAssessment {
  /** 全部 factor 权重求和后的原始分数（未截断）。 */
  rawScore: number;
  /** normalizeRiskScore() 后落在 0～100 的最终分数。 */
  score: number;
  level: RiskLevel;
  factors: RiskFactorHit[];
}

export interface ApprovalRiskInput {
  requestedAmount: string;
  tokenId: string;
  spenderAddress: string;
  dappId?: string;
  /** 用于 behaviorRisk 确定性抖动的稳定种子；不传则退化为 spenderAddress。 */
  seed?: string;
}

export interface SignatureRiskInput {
  type: SignatureType;
  payloadSummary: string;
  dappId?: string;
  seed?: string;
}

export interface WalletRiskInput {
  walletId: string;
  /** 钱包基础画像（来自 Wallet Engine 的当前状态），用于 addressRisk / behaviorRisk。 */
  totalValueUsd: number;
  /** 当前挂在这个钱包名下、尚未被撤销/拒绝的高风险 Approval / Signature 数量。 */
  highRiskApprovalCount: number;
  highRiskSignatureCount: number;
  /** Asset Engine 给出的、按当前风险状态推算的预计损失金额（用于 largeValue）。 */
  projectedLossUsd: number;
}
