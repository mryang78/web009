// Mock data for the "钱包与资产安全分析中心" (Wallet & Asset Security Simulation
// Center) admin module. Everything here is fabricated experience data: fake addresses
// (0xMOCK…/0xSIM…), fake balances, fake risk events. Nothing here connects to a
// real chain, wallet, private key, or RPC endpoint — see the disclaimer banner
// rendered on every page in this module.
//
// 数据来源已统一：本文件不再自行定义钱包身份数据，而是从
// @/lib/shared（全站唯一分析数据源）派生 WalletRow，保证这 8 个钱包与
// /admin/users、/soc/* 等其他页面看到的是完全相同的一份地址/风险数据。

import { mockTokens, mockWallets } from "@/lib/shared/entities";
import { riskLevelFromScore, walletStatusFromRiskLevel } from "@/lib/shared/risk";
import type { ApprovalRiskLevel, WalletNetwork, WalletStatus, WalletType } from "@/lib/shared/types";

export type { ApprovalRiskLevel, WalletNetwork, WalletStatus, WalletType } from "@/lib/shared/types";

export const walletStatusStyle: Record<WalletStatus, string> = {
  正常: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  监控中: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  中风险: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  高风险: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  严重风险: "bg-red-500/10 text-red-600 dark:text-red-400",
  已冻结: "bg-secondary text-muted-foreground",
};

/** @deprecated 保留旧函数名以兼容既有引用；判定逻辑已统一到 @/lib/shared/risk。 */
export function riskLevelOfScore(score: number): WalletStatus {
  return walletStatusFromRiskLevel(riskLevelFromScore(score), score >= 100);
}

export interface WalletRow {
  id: string;
  name: string;
  address: string;
  type: WalletType;
  network: WalletNetwork;
  totalValue: number;
  riskScore: number;
  status: WalletStatus;
  lastActiveAgo: string;
}

/** 派生自 @/lib/shared 的核心 8 个隔离钱包，与全站其他模块共用同一份地址数据。 */
export const walletRows: WalletRow[] = mockWallets
  .filter((w) => w.pool === "core")
  .map((w) => ({
    id: w.id,
    name: w.label,
    address: w.address,
    type: w.walletType,
    network: w.network,
    totalValue: w.totalValueUsd,
    riskScore: w.riskScore,
    status: w.status,
    lastActiveAgo: w.lastActiveAgo,
  }));

export function getWalletById(id: string) {
  return walletRows.find((w) => w.id === id);
}

const assetColors: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  USDT: "#26a17b",
  USDC: "#2775ca",
  SOL: "#9945ff",
};

// 校验：以下 symbol 必须全部存在于统一 Token 目录（@/lib/shared/entities.mockTokens）
// 中，避免出现目录里没有定义的"幽灵代币"。
const ASSET_BREAKDOWN_SEED = [
  { symbol: "BTC", pct: 32, value: 41126.5 },
  { symbol: "ETH", pct: 28, value: 35985.7 },
  { symbol: "USDT", pct: 22, value: 28274.5 },
  { symbol: "USDC", pct: 12, value: 15422.4 },
  { symbol: "SOL", pct: 6, value: 7711.2 },
] as const;

if (process.env.NODE_ENV !== "production") {
  for (const row of ASSET_BREAKDOWN_SEED) {
    if (!mockTokens.some((t) => t.symbol === row.symbol)) {
      throw new Error(`assetBreakdown 引用了统一 Token 目录中不存在的 symbol: ${row.symbol}`);
    }
  }
}

export const assetBreakdown = ASSET_BREAKDOWN_SEED.map((row) => ({
  ...row,
  color: assetColors[row.symbol] ?? "#94a3b8",
}));

export const walletRiskFactors = [
  "可疑授权",
  "异常交互",
  "高风险合约",
  "异常资产流向",
  "关联地址",
];

export interface WalletActivityLogEntry {
  operator: string;
  time: string;
  event: string;
}

export function walletActivityLog(walletId: string): WalletActivityLogEntry[] {
  void walletId;
  return [
    { operator: "安全引擎", time: "6 分钟前", event: "授权风险验证事件" },
    { operator: "安全引擎", time: "18 分钟前", event: "资产风险分析" },
    { operator: "孙安然", time: "1 小时前", event: "风险状态更新" },
    { operator: "孙安然", time: "1 小时前", event: "加入监控" },
    { operator: "安全引擎", time: "3 小时前", event: "资产提取验证" },
    { operator: "安全引擎", time: "3 小时前", event: "威胁拦截" },
  ];
}

// —— 用户资产 ——
export interface UserAssetRow {
  userId: string;
  walletAddress: string;
  assetSymbol: string;
  assetAmount: string;
  assetValue: number;
  riskScore: number;
  lastActiveAgo: string;
  status: WalletStatus;
}

export const userAssetRows: UserAssetRow[] = [
  { userId: "U100281", walletAddress: "0xA2F1...821A", assetSymbol: "USDT", assetAmount: "48,520", assetValue: 48520, riskScore: 82, lastActiveAgo: "2 分钟前", status: "高风险" },
  { userId: "U100264", walletAddress: "0xB8E3...5F3C", assetSymbol: "ETH", assetAmount: "12.82", assetValue: 44580.2, riskScore: 24, lastActiveAgo: "12 分钟前", status: "监控中" },
  { userId: "U100239", walletAddress: "0xC6D7...B7A2", assetSymbol: "BTC", assetAmount: "2.14", assetValue: 143830.6, riskScore: 6, lastActiveAgo: "40 分钟前", status: "正常" },
  { userId: "U100218", walletAddress: "0xD4C9...19DE", assetSymbol: "USDC", assetAmount: "28,500", assetValue: 28500, riskScore: 91, lastActiveAgo: "1 小时前", status: "严重风险" },
  { userId: "U100197", walletAddress: "0xE5B2...C441", assetSymbol: "SOL", assetAmount: "384.2", assetValue: 64920.8, riskScore: 15, lastActiveAgo: "3 小时前", status: "正常" },
  { userId: "U100152", walletAddress: "0xF7A8...7702", assetSymbol: "USDT", assetAmount: "9,120", assetValue: 9120, riskScore: 48, lastActiveAgo: "5 小时前", status: "中风险" },
];

export function getUserAsset(userId: string) {
  return userAssetRows.find((u) => u.userId === userId);
}

export interface UserHolding {
  symbol: string;
  amount: string;
}

export function userHoldings(userId: string): UserHolding[] {
  void userId;
  return [
    { symbol: "USDT", amount: "48,520.00" },
    { symbol: "ETH", amount: "12.82" },
    { symbol: "USDC", amount: "28,500.00" },
  ];
}

export const userAssetHistory = [
  { time: "2 分钟前", event: "USDT 余额减少 1,200", tone: "down" as const },
  { time: "1 小时前", event: "收到 ETH 转入 3.20", tone: "up" as const },
  { time: "昨天", event: "USDC 授权额度变更", tone: "neutral" as const },
];

export const userRiskEvents = [
  { time: "2 分钟前", title: "检测到高额可疑授权", level: "high" as const },
  { time: "1 小时前", title: "资产流向异常地址", level: "critical" as const },
];

// —— 授权记录 ——
// ApprovalRiskLevel 统一为 @/lib/shared 的 ApprovalRiskLevel（与 ThreatLevel 同构，
// 已在文件顶部 import），不再单独声明一套等价的四级风险联合类型。
export type ApprovalStatus = "待处理" | "已处理" | "已忽略";

export interface ApprovalRow {
  id: string;
  time: string;
  userId: string;
  walletAddress: string;
  token: string;
  spender: string;
  amount: string;
  risk: ApprovalRiskLevel;
  status: ApprovalStatus;
}

export const approvalRows: ApprovalRow[] = [
  { id: "APR-10281", time: "10:42", userId: "U100281", walletAddress: "0xDATA...", token: "USDT", spender: "0xCTCT...", amount: "48,520", risk: "high", status: "待处理" },
  { id: "APR-10277", time: "10:12", userId: "U100264", walletAddress: "0xDATA...", token: "ETH", spender: "0xCTCT...", amount: "8.40", risk: "critical", status: "待处理" },
  { id: "APR-10264", time: "09:58", userId: "U100239", walletAddress: "0xDATA...", token: "BTC", spender: "0xCTCT...", amount: "0.42", risk: "medium", status: "已处理" },
  { id: "APR-10251", time: "09:30", userId: "U100218", walletAddress: "0xDATA...", token: "USDC", spender: "0xCTCT...", amount: "28,500", risk: "critical", status: "待处理" },
  { id: "APR-10238", time: "08:47", userId: "U100197", walletAddress: "0xDATA...", token: "SOL", spender: "0xCTCT...", amount: "120", risk: "low", status: "已忽略" },
  { id: "APR-10229", time: "08:15", userId: "U100152", walletAddress: "0xDATA...", token: "USDT", spender: "0xCTCT...", amount: "9,120", risk: "medium", status: "已处理" },
];

export function getApprovalById(id: string) {
  return approvalRows.find((a) => a.id === id);
}

// —— 资产流向图节点（全部为 Mock 地址） ——
export interface AssetFlowNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  level: "critical" | "high" | "medium" | "low" | "safe";
  detail: { asset: string; risk: string; events: string[] };
}

export const assetFlowNodes: AssetFlowNode[] = [
  {
    id: "user-wallet",
    label: "用户钱包",
    sub: "0xDATA...",
    x: 8,
    y: 50,
    level: "safe",
    detail: { asset: "USDT 48,520 · ETH 4.82", risk: "低风险持有地址", events: ["钱包已注册监控", "近 30 天无异常交互"] },
  },
  {
    id: "spender",
    label: "授权对象",
    sub: "0xCTCT-PROTOCOL",
    x: 30,
    y: 20,
    level: "high",
    detail: { asset: "已获授权 USDT 48,520", risk: "高风险合约授权", events: ["检测到异常授权事件", "关联多起风险案例"] },
  },
  {
    id: "mock-contract",
    label: "风险合约",
    sub: "0xMOCK-DRAIN-9F3C",
    x: 52,
    y: 50,
    level: "critical",
    detail: { asset: "经手 USDT 48,520 / ETH 4.82", risk: "已知高风险合约", events: ["合约字节码存在可疑逻辑", "多个受害地址关联"] },
  },
  {
    id: "intermediate",
    label: "中间地址",
    sub: "0xDATA...",
    x: 74,
    y: 20,
    level: "medium",
    detail: { asset: "USDC 12,520 经手", risk: "中风险中转地址", events: ["资金停留时间小于 5 分钟", "疑似洗币中转节点"] },
  },
  {
    id: "destination",
    label: "目标地址",
    sub: "0xANAL...",
    x: 92,
    y: 50,
    level: "critical",
    detail: { asset: "累计接收 USDT 128,520", risk: "已列入风险名单", events: ["关联 12 起分析攻击案例", "已被安全引擎标记拦截"] },
  },
  {
    id: "engine",
    label: "安全引擎",
    sub: "Security Engine",
    x: 52,
    y: 84,
    level: "safe",
    detail: { asset: "—", risk: "拦截并生成安全报告", events: ["实时监控全部资产流向", "本次已触发拦截动作"] },
  },
];

export const assetFlowEdges: { from: string; to: string; label: string }[] = [
  { from: "user-wallet", to: "spender", label: "USDT 48,520" },
  { from: "spender", to: "mock-contract", label: "USDT 48,520" },
  { from: "mock-contract", to: "intermediate", label: "USDC 12,520" },
  { from: "intermediate", to: "destination", label: "ETH 4.82" },
  { from: "mock-contract", to: "engine", label: "监控" },
  { from: "engine", to: "destination", label: "已拦截" },
];

// —— 授权风险验证 / 资产提取验证 流程步骤 ——
export const approvalSimSteps = [
  "检测钱包",
  "识别 Token",
  "识别授权对象",
  "生成授权事件",
  "安全引擎分析",
  "风险评分完成",
];

export const extractionSimSteps = [
  "钱包识别",
  "授权事件验证",
  "风险评分",
  "资产提取验证",
  "安全引擎触发",
  "威胁拦截",
];

export const walletSimulatorSteps = [
  "初始化实时分析",
  "载入钱包",
  "载入用户资产",
  "生成授权事件",
  "分析风险",
  "分析资产流向",
  "安全引擎检测",
  "拦截风险",
  "生成安全报告",
];

export interface SimulationReportData {
  caseId: string;
  userId: string;
  walletAddress: string;
  asset: string;
  amount: string;
  risk: "Critical" | "High" | "Medium";
  result: "Threat Blocked" | "Simulation Completed";
}

export function buildSimulationReport(input: {
  userId: string;
  walletAddress: string;
  asset: string;
  amount: string;
}): SimulationReportData {
  const now = new Date();
  const caseId = `SIM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(
    Math.floor(Math.random() * 900) + 100
  ).padStart(3, "0")}`;
  return {
    caseId,
    userId: input.userId,
    walletAddress: input.walletAddress,
    asset: input.asset,
    amount: input.amount,
    risk: "Critical",
    result: "Threat Blocked",
  };
}

// —— 资产安全概览（后台首页 Dashboard） ——
export const assetSecurityOverview = [
  { label: "隔离钱包", value: "12,821" },
  { label: "分析账户", value: "128,520" },
  { label: "分析资产", value: "$128.5M" },
  { label: "授权事件", value: "8,921" },
  { label: "资产提取验证", value: "1,284" },
  { label: "安全拦截", value: "982" },
];

export const assetRiskTrend = [42, 48, 51, 46, 58, 62, 55, 68, 71, 66, 74, 78, 82, 88];
export const approvalEventTrend = [210, 224, 218, 242, 260, 251, 278, 290, 305, 298, 320, 335, 342, 358];
export const threatEventTrend = [96, 112, 88, 134, 121, 158, 142, 176, 149, 168, 184, 172, 198, 214];
