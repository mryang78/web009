// ---------------------------------------------------------------------------
// 任意地址 / 文本 → 虚构风险画像 的查询工具（全站唯一实现）
//
// 用于"手动输入任意地址查询"等分析交互：无论输入什么内容，返回的都是基于
// 输入文本哈希值确定性生成的虚构隔离数据，不代表、不查询该地址的真实链上
// 状态，也不访问任何真实钱包、区块链节点或第三方 API。
// ---------------------------------------------------------------------------

import { hashStringToSeed, seededRandom } from "./prng";
import { riskLevelFromScore } from "./risk";
import type { RiskLevel, WalletNetwork } from "./types";

export const scanNetworks: WalletNetwork[] = ["Ethereum", "BNB Chain", "Polygon", "Arbitrum", "Solana", "Base"];

export interface MockAddressProfile {
  address: string;
  riskScore: number;
  riskLevel: RiskLevel;
  mockBalance: number;
  mockTokenCount: number;
  network: WalletNetwork;
  flags: string[];
}

const addressFlagPool = [
  "曾与已知钓鱼 DApp 交互（实时分析）",
  "存在未撤销的高额代币授权（实时分析）",
  "24 小时内出现异常转账模式（实时分析）",
  "地址特征与风险名单相似度较高（实时分析）",
  "近期多次与新部署合约交互（实时分析）",
];

/**
 * 根据任意输入文本生成一份确定性的虚构风险画像。
 * 不查询任何真实链上数据 —— 相同输入始终返回相同的 Mock 结果。
 */
export function getMockAddressProfile(input: string): MockAddressProfile {
  const normalized = input.trim();
  const seed = hashStringToSeed(normalized.toLowerCase());
  const rnd = seededRandom(seed);
  const riskScore = Math.floor(rnd() * 100);
  const riskLevel = riskLevelFromScore(riskScore);
  const mockBalance = Math.round(rnd() * 260000 * 100) / 100;
  const mockTokenCount = Math.floor(rnd() * 12) + 1;
  const network = scanNetworks[Math.floor(rnd() * scanNetworks.length)];

  const flagCount = riskScore >= 65 ? 2 + Math.floor(rnd() * 2) : riskScore >= 35 ? 1 : 0;
  const pool = [...addressFlagPool];
  const flags: string[] = [];
  for (let i = 0; i < flagCount && pool.length > 0; i++) {
    const idx = Math.floor(rnd() * pool.length);
    flags.push(pool.splice(idx, 1)[0]);
  }
  if (flags.length === 0) flags.push("未发现 Mock 风险特征匹配");

  return { address: normalized, riskScore, riskLevel, mockBalance, mockTokenCount, network, flags };
}
