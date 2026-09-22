// ---------------------------------------------------------------------------
// 全链路分析平台 ——分析数据（分析用，全部为虚构内容）
//
// 数据来源已统一：DApp / Token / 攻击场景 / 钱包池 / 风险徽章样式等此前在本
// 文件内独立维护的数据，现在统一从 @/lib/shared（全站唯一分析数据源）派生，
// 与 /admin 后台、/lab/security 等模块共享同一份数据，不再各自维护重复副本。
// ---------------------------------------------------------------------------
import {
  attackScenarios as sharedAttackScenarios,
  mockAlerts,
  mockDApps,
  mockThreatEvents,
  mockTokens,
  mockWallets,
  getWalletById,
  getDAppById,
} from "@/lib/shared/entities";
import { riskBadgeClass, riskDotClass, riskLevelFromScore } from "@/lib/shared/risk";
import type {
  SimulationStatus,
  SocDApp,
  SocToken,
  ApprovalSimulation,
  ApprovalType,
  AttackScenario,
  SecurityAlert,
  SecurityRule,
  ThreatActivityRow,
  AttackDistributionSlice,
} from "./types";

export { riskBadgeClass, riskDotClass, riskLevelFromScore };

export const statusBadgeClass: Record<SimulationStatus, string> = {
  Pending: "bg-slate-500/15 text-muted-foreground border-slate-500/30",
  Simulated: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Blocked: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Failed: "bg-slate-500/15 text-muted-foreground border-slate-500/30",
  Detected: "bg-red-500/15 text-red-400 border-red-500/30",
};

// —— DApp（分析恶意 / 高风险 DApp 库）—— 派生自 @/lib/shared/entities.mockDApps
export const socDApps: SocDApp[] = mockDApps.map((d) => ({
  id: d.id,
  name: d.name,
  domain: d.domain,
  category: d.category,
  riskLevel: d.riskLevel,
  contract: d.contractAddress,
  status: d.status,
}));

// —— Token —— 派生自 @/lib/shared/entities.mockTokens（与 /admin 资产分布共用同一份代币目录）
export const socTokens: SocToken[] = mockTokens
  .filter((t) => ["USDT", "USDC", "ETH", "WBTC", "SMNX", "ADC"].includes(t.symbol))
  .map((t) => ({
    id: t.id,
    name: t.name,
    symbol: t.symbol,
    decimals: t.decimals,
    mockPrice: t.mockPriceUsd,
    totalSupply: t.totalSupply,
    riskLevel: t.riskLevel,
  }));

// —— Approval Simulation 预设场景 ——
export const approvalPresets: Record<ApprovalType, Omit<ApprovalSimulation, "id" | "owner">> = {
  "Limited Approval": {
    token: "USDT", spender: "0xSPENDER-SAFE-1120", currentAllowance: "0", requestedAmount: "500",
    type: "Limited Approval", riskLevel: "SAFE", dapp: "官方 DEX（示例）", chain: "Ethereum",
  },
  "Large Approval": {
    token: "USDT", spender: "0xSPENDER-YIELD-4402", currentAllowance: "0", requestedAmount: "50,000",
    type: "Large Approval", riskLevel: "MEDIUM", dapp: "YieldVault", chain: "Ethereum",
  },
  "Unlimited Approval": {
    token: "USDT", spender: "0xSPENDER-SWAP-9F3C", currentAllowance: "0", requestedAmount: "Unlimited (2^256-1)",
    type: "Unlimited Approval", riskLevel: "HIGH", dapp: "MockSwap", chain: "Ethereum",
  },
  "Suspicious Spender": {
    token: "USDT", spender: "0xMOCK-DRAIN-9F3C", currentAllowance: "0", requestedAmount: "Unlimited (2^256-1)",
    type: "Suspicious Spender", riskLevel: "CRITICAL", dapp: "LuckyAirdrop", chain: "Ethereum",
  },
};

// —— 攻击案例库（Attack Library）—— 派生自 @/lib/shared/entities.attackScenarios，
// 与攻击链分析器（/soc/attack-chain）、历史分析记录共用同一份"攻击手法"定义，
// 不再各自维护一份互相无法关联的攻击场景列表。
export const attackScenarios: AttackScenario[] = sharedAttackScenarios;


// —— 安全规则引擎 ——
export const securityRules: SecurityRule[] = [
  { id: "RULE-001", name: "超额授权检测", condition: "Allowance > Threshold", action: "Risk = HIGH", enabled: true },
  { id: "RULE-002", name: "未知 DApp 授权检测", condition: "Unknown DApp + Approval", action: "Risk = CRITICAL", enabled: true },
  { id: "RULE-003", name: "可疑 Spender 检测", condition: "Suspicious Spender", action: "Risk = HIGH", enabled: true },
  { id: "RULE-004", name: "大额转账检测", condition: "Large Transfer Simulation", action: "Trigger Alert", enabled: true },
];

// —— 安全告警（Alerts）—— 派生自 @/lib/shared/entities.mockAlerts，wallet/dapp/token
// 字段通过 walletId/dappId/tokenId 从统一钱包池 / DApp 库 / Token 目录解析，
// 不再手写与其他页面对不上的孤立地址（此前这里的 0x7A3f...92F1 等地址与
// /admin 钱包池毫无关联，现已统一指向真正的核心钱包地址）。
const tokenSymbolById = new Map(mockTokens.map((t) => [t.id, t.symbol]));

export const securityAlerts: SecurityAlert[] = mockAlerts.map((a) => ({
  id: a.id,
  level: a.level,
  title: a.title,
  detail: a.detail,
  wallet: a.walletId ? (getWalletById(a.walletId)?.address ?? "-") : "-",
  dapp: a.dappId ? (getDAppById(a.dappId)?.name ?? "-") : "-",
  token: a.tokenId ? (tokenSymbolById.get(a.tokenId) ?? "-") : "-",
  time: a.time,
  read: a.read,
}));

// —— Threat Activity（Dashboard 表格）—— 派生自 @/lib/shared/entities.mockThreatEvents，
// 与「运营后台 → 安全中心 → 风险地址」（admin-security-data.ts）共用同一份
// 威胁事件源，不再各自维护互不关联的列表。
export const threatActivity: ThreatActivityRow[] = mockThreatEvents.map((t) => ({
  time: t.detectedAt,
  threatLevel: t.riskLevel,
  attackType: t.category,
  wallet: t.walletId ? (getWalletById(t.walletId)?.address ?? "-") : "-",
  dapp: t.dappId ? (getDAppById(t.dappId)?.name ?? "-") : "-",
  token: "-",
  status: t.status,
}));

// —— Attack Distribution（Dashboard 环形图）——
export const attackDistribution: AttackDistributionSlice[] = [
  { category: "Phishing", count: 32 },
  { category: "Fake DApp", count: 24 },
  { category: "Malicious Approval", count: 21 },
  { category: "Permit Abuse", count: 14 },
  { category: "Signature Scam", count: 11 },
  { category: "Transaction Manipulation", count: 8 },
  { category: "Address Poisoning", count: 6 },
];

// —— Dashboard 顶部统计 ——
export const socStats = [
  { label: "Total Wallets", value: "12,821" },
  { label: "Active Simulations", value: "36" },
  { label: "Detected Threats", value: "1,284" },
  { label: "Critical Threats", value: "82" },
  { label: "Suspicious DApps", value: "18" },
  { label: "Token Approvals", value: "8,921" },
  { label: "Active Alerts", value: "5" },
  { label: "Simulated Assets", value: "$128.5M" },
  { label: "Attack Attempts", value: "2,406" },
  { label: "Blocked Attacks", value: "982" },
];

// ---------------------------------------------------------------------------
// 自动扫描模块 —— 扩展 Mock 钱包池 + 手动地址查询分析
//
// 重要：以下数据全部由本地确定性生成，不查询、不连接任何真实钱包、真实区块链
// 节点、区块浏览器或第三方 API。"手动查询任意地址"功能同理 —— 无论用户输入
// 什么内容，返回的都是基于输入文本哈希值生成的虚构隔离数据，不代表该地址的
// 真实链上状态。生成算法与"手动地址查询"逻辑已统一收敛到
// @/lib/shared/prng 与 @/lib/shared/lookup，本文件不再维护独立实现。
// ---------------------------------------------------------------------------

export interface ScanWallet {
  id: string;
  name: string;
  address: string;
  network: string;
  totalValue: number;
  riskScore: number;
}

/**
 * 自动扫描模块使用的扩展 Mock 钱包池（36 个）—— 派生自
 * @/lib/shared/entities.mockWallets 中 pool === "extended" 的部分，与核心 8
 * 个隔离钱包（wallet-01..08）共用同一套生成算法与风险判定，不再是相互独立的
 * 两份数据。
 */
export const autoScanWalletPool: ScanWallet[] = mockWallets
  .filter((w) => w.pool === "extended")
  .map((w) => ({
    id: w.id,
    name: w.label,
    address: w.address,
    network: w.network,
    totalValue: w.totalValueUsd,
    riskScore: w.riskScore,
  }));

export type { MockAddressProfile } from "@/lib/shared/lookup";
export { getMockAddressProfile } from "@/lib/shared/lookup";
