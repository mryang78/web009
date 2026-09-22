// ---------------------------------------------------------------------------
// Risk Engine —— 纯规则计算层（factors.ts）
//
// 本文件只依赖 @/lib/shared，不依赖 Wallet/Asset/Approval/Signature 四个
// Engine——这是刻意的分层：Approval Engine / Signature Engine 需要在自己的
// analyzeApproval() / analyzeSignature() 里调用这里的 compute*RiskFactors()
// 来算出风险，如果本文件反过来 import 它们就会构成循环依赖。真正需要读取
// "钱包当前挂了多少个高风险 Approval/Signature" 这类跨 Engine 聚合数据的
// assessWalletRisk()，放在同目录的 risk-engine.ts（更上层）里。
//
// 统一等级换算：0～100 → SAFE/LOW/MEDIUM/HIGH/CRITICAL 的判定复用全站唯一
// 实现 @/lib/shared/risk 的 riskLevelFromScore()，不再造第四套风险分档。
// ---------------------------------------------------------------------------

import { getDAppById, getTokenById } from "@/lib/shared/entities";
import { riskLevelFromScore } from "@/lib/shared/risk";
import { hashStringToSeed, seededRandom } from "@/lib/shared/prng";
import type { RiskLevel } from "@/lib/shared/types";
import type {
  ApprovalRiskInput,
  RiskAssessment,
  RiskFactorHit,
  RiskFactorKey,
  SignatureRiskInput,
  WalletRiskInput,
} from "./risk-types";

/** 可疑地址/合约的关键词特征库（Mock 场景里用于命中"仿冒/骗局"风格的字符串）。 */
const SUSPICIOUS_ADDRESS_PATTERN = /drain|scam|phish|fake|hack|steal|吸血|骗局|钓鱼/i;
/** 签名 payload 摘要里出现这些字样，视为"这次签名本身在要求危险的权限"。 */
const SUSPICIOUS_PAYLOAD_PATTERN = /drain|setapprovalforall|transferfrom|清空|全部资产|批量转账|授权全部/i;

function isUnlimitedAmount(amount: string): boolean {
  return /unlimited/i.test(amount) || amount.includes("2^256");
}

function parseAmount(amount: string): number {
  return Number(amount.replace(/[^0-9.]/g, ""));
}

/** dapp 是否被判定为"看起来是新部署/未经审计的合约"——确定性伪随机，同一个 dapp 永远得到同一个结论。 */
function looksLikeNewContract(contractAddress: string): boolean {
  const rnd = seededRandom(hashStringToSeed(`newContract:${contractAddress}`));
  return rnd() < 0.3;
}

/** behaviorRisk：一份很小的、确定性的"行为异常基线抖动"，代表"综合行为模式"这类不落在其他具名因素里的信号。 */
function behaviorJitter(seed: string): number {
  const rnd = seededRandom(hashStringToSeed(`behavior:${seed}`));
  return Math.round(rnd() * 4);
}

function hit(key: RiskFactorKey, weight: number, reason: string): RiskFactorHit {
  return { key, weight, triggered: weight > 0, reason };
}

/** Approval 请求的风险因素分解。 */
export function computeApprovalRiskFactors(input: ApprovalRiskInput): RiskFactorHit[] {
  const dapp = input.dappId ? getDAppById(input.dappId) : undefined;
  const token = getTokenById(input.tokenId);
  const unlimited = isUnlimitedAmount(input.requestedAmount);
  const amountNumber = parseAmount(input.requestedAmount);

  const spenderWeight = (() => {
    switch (dapp?.riskLevel) {
      case "CRITICAL":
        return 58;
      case "HIGH":
        return 30;
      case "MEDIUM":
        return 12;
      default:
        return 0;
    }
  })();

  const factors: RiskFactorHit[] = [
    hit("unlimitedAllowance", unlimited ? 30 : 0, unlimited ? "请求额度为 Unlimited / 2^256，属于最高危险的授权范式" : "请求额度为有限额度"),
    hit(
      "unknownDapp",
      dapp ? 0 : 18,
      dapp ? `发起方为已知 DApp「${dapp.name}」` : "无法识别发起授权请求的 DApp（未提供 dappId）"
    ),
    hit(
      "suspiciousSpender",
      spenderWeight,
      dapp
        ? `spender 关联 DApp「${dapp.name}」风险等级为 ${dapp.riskLevel}`
        : "未提供 dapp 上下文，无法判定 spender 背景"
    ),
    hit(
      "largeValue",
      !unlimited && Number.isFinite(amountNumber) && amountNumber >= 10000 ? 15 : 0,
      !unlimited && Number.isFinite(amountNumber) && amountNumber >= 10000
        ? `请求金额 ${amountNumber.toLocaleString("en-US")} 超过大额阈值 10,000`
        : "请求金额未超过大额阈值"
    ),
    hit(
      "newContract",
      dapp && looksLikeNewContract(dapp.contractAddress) ? 10 : 0,
      dapp && looksLikeNewContract(dapp.contractAddress) ? "关联合约地址呈现「近期新部署 / 未经审计」特征" : "未检出新合约特征"
    ),
    hit("signatureRisk", 0, "Approval 请求不涉及链下签名"),
    hit("permitRisk", 0, "Approval 请求不是 Permit 签名"),
    hit(
      "addressRisk",
      SUSPICIOUS_ADDRESS_PATTERN.test(input.spenderAddress) ? 10 : 0,
      SUSPICIOUS_ADDRESS_PATTERN.test(input.spenderAddress)
        ? `spender 地址「${input.spenderAddress}」命中可疑关键词特征`
        : "spender 地址未命中可疑关键词特征"
    ),
    hit("behaviorRisk", behaviorJitter(input.seed ?? input.spenderAddress), "综合行为模式基线抖动（确定性，非随机噪声）"),
  ];

  if (token && (token.riskLevel === "CRITICAL" || token.riskLevel === "HIGH") && spenderWeight < 30) {
    factors[2] = hit(
      "suspiciousSpender",
      Math.max(spenderWeight, 22),
      `Token「${token.symbol}」自身风险等级为 ${token.riskLevel}，叠加计入 spender/资产背景风险`
    );
  }

  return factors;
}

/** Signature / Permit 请求的风险因素分解。 */
export function computeSignatureRiskFactors(input: SignatureRiskInput): RiskFactorHit[] {
  const dapp = input.dappId ? getDAppById(input.dappId) : undefined;
  const isPermit = input.type === "Permit (EIP-2612)";
  const payloadSuspicious = SUSPICIOUS_PAYLOAD_PATTERN.test(input.payloadSummary);

  const spenderWeight = (() => {
    switch (dapp?.riskLevel) {
      case "CRITICAL":
        return 58;
      case "HIGH":
        return 30;
      case "MEDIUM":
        return 12;
      default:
        return 0;
    }
  })();

  return [
    hit("unlimitedAllowance", 0, "签名请求不直接携带 Approval 额度概念"),
    hit(
      "unknownDapp",
      dapp ? 0 : 18,
      dapp ? `发起方为已知 DApp「${dapp.name}」` : "无法识别发起签名请求的 DApp（未提供 dappId）"
    ),
    hit(
      "suspiciousSpender",
      spenderWeight,
      dapp
        ? `签名请求关联 DApp「${dapp.name}」风险等级为 ${dapp.riskLevel}`
        : "未提供 dapp 上下文，无法判定发起方背景"
    ),
    hit("largeValue", 0, "签名请求不直接携带金额概念"),
    hit(
      "newContract",
      dapp && looksLikeNewContract(dapp.contractAddress) ? 10 : 0,
      dapp && looksLikeNewContract(dapp.contractAddress) ? "关联合约地址呈现「近期新部署 / 未经审计」特征" : "未检出新合约特征"
    ),
    hit(
      "signatureRisk",
      payloadSuspicious ? 20 : 0,
      payloadSuspicious ? "签名内容摘要命中「清空资产 / 批量授权」类危险关键词" : "签名内容摘要未见危险关键词"
    ),
    hit("permitRisk", isPermit ? 10 : 0, isPermit ? "签名类型为 Permit (EIP-2612)，可在链下直接换取代币授权" : "签名类型不是 Permit"),
    hit(
      "addressRisk",
      dapp && SUSPICIOUS_ADDRESS_PATTERN.test(dapp.contractAddress) ? 10 : 0,
      dapp && SUSPICIOUS_ADDRESS_PATTERN.test(dapp.contractAddress)
        ? `关联合约地址「${dapp.contractAddress}」命中可疑关键词特征`
        : "关联合约地址未命中可疑关键词特征"
    ),
    hit("behaviorRisk", behaviorJitter(input.seed ?? `${input.type}:${input.payloadSummary}`), "综合行为模式基线抖动（确定性，非随机噪声）"),
  ];
}

/** Wallet 层面的粗粒度风险因素分解——聚合当前挂在这个钱包名下的高风险 Approval/Signature 数量与预计损失。 */
export function computeWalletRiskFactors(input: WalletRiskInput): RiskFactorHit[] {
  return [
    hit(
      "unlimitedAllowance",
      Math.min(30, input.highRiskApprovalCount * 15),
      input.highRiskApprovalCount > 0
        ? `钱包名下有 ${input.highRiskApprovalCount} 笔高风险 Approval 记录`
        : "钱包名下没有高风险 Approval 记录"
    ),
    hit(
      "signatureRisk",
      Math.min(30, input.highRiskSignatureCount * 15),
      input.highRiskSignatureCount > 0
        ? `钱包名下有 ${input.highRiskSignatureCount} 笔高风险 Signature 记录`
        : "钱包名下没有高风险 Signature 记录"
    ),
    hit(
      "largeValue",
      input.projectedLossUsd > 0 ? Math.min(25, Math.round((input.projectedLossUsd / Math.max(input.totalValueUsd, 1)) * 25)) : 0,
      input.projectedLossUsd > 0
        ? `当前攻击路径下的预计影响金额约 $${input.projectedLossUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}（Projected，非真实资金损失）`
        : "当前没有被风险标记的资产异动"
    ),
    hit("unknownDapp", 0, "钱包层面评估不单独判定 DApp 来源"),
    hit("suspiciousSpender", 0, "钱包层面评估不单独判定 spender"),
    hit("newContract", 0, "钱包层面评估不单独判定合约新旧"),
    hit("permitRisk", 0, "钱包层面评估不单独判定签名类型"),
    hit("addressRisk", 0, "钱包层面评估不单独判定地址特征"),
    hit("behaviorRisk", behaviorJitter(input.walletId), "综合行为模式基线抖动（确定性，非随机噪声）"),
  ];
}

/** 把一组 factor 的权重求和，截断到 0～100。 */
export function normalizeRiskScore(factors: RiskFactorHit[]): { rawScore: number; score: number } {
  const rawScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  return { rawScore, score };
}

/** 0～100 的分数 → 五档风险等级。全站唯一实现的直接复用，不新造判定标准。 */
export function riskLevelForScore(score: number): RiskLevel {
  return riskLevelFromScore(score);
}

function toAssessment(factors: RiskFactorHit[]): RiskAssessment {
  const { rawScore, score } = normalizeRiskScore(factors);
  return { rawScore, score, level: riskLevelForScore(score), factors };
}

export function assessApprovalRisk(input: ApprovalRiskInput): RiskAssessment {
  return toAssessment(computeApprovalRiskFactors(input));
}

export function assessSignatureRisk(input: SignatureRiskInput): RiskAssessment {
  return toAssessment(computeSignatureRiskFactors(input));
}

export function assessWalletRiskFactors(input: WalletRiskInput): RiskAssessment {
  return toAssessment(computeWalletRiskFactors(input));
}
