// ---------------------------------------------------------------------------
// 统一 Simulation Data Model —— 类型定义（Mock-only，纯分析安全研究平台）
//
// 本文件是全站"钱包 / 资产 / Token / DApp / 授权 / 签名 / 威胁 / 告警 / 交易 /
// 攻击场景 / 分析任务"相关类型的唯一定义来源（Single Source of Truth）。
// 历史遗留文件（lib/security-data.ts、lib/admin-security-data.ts、
// lib/admin/wallet-security-data.ts、lib/soc/types.ts 等）通过
// `export type { X } from "@/lib/shared/types"` 的方式复用这里的定义，
// 不再各自重新声明，避免"同一个概念多套类型"的问题。
//
// 重要：本文件下的一切（地址、余额、交易哈希、攻击场景、分析任务）均为虚构
//分析数据的类型描述，不代表、不查询、不连接任何真实钱包、真实区块链、
// 真实 RPC、真实签名或真实资产转移。
// ---------------------------------------------------------------------------

/** 全站统一风险等级（五级，大写英文）。所有模块的风险判定最终都归一到这五档。 */
export type RiskLevel = "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** 运营后台历史使用的中文六级钱包状态标签（展示用，映射自 RiskLevel）。 */
export type WalletStatus = "正常" | "监控中" | "中风险" | "高风险" | "严重风险" | "已冻结";

/** /lab/security 模块历史使用的四级英文风险标签（展示用，映射自 RiskLevel）。 */
export type ThreatLevel = "critical" | "high" | "medium" | "low";

/** 授权风险等级与 ThreatLevel 同构，直接复用同一个联合类型，不再重复定义。 */
export type ApprovalRiskLevel = ThreatLevel;

export type WalletType = "普通钱包" | "智能钱包" | "交易所钱包" | "测试钱包";
export type WalletNetwork = "Ethereum" | "BNB Chain" | "Polygon" | "Arbitrum" | "Solana" | "Base";

export type SimulationStatus = "Pending" | "Simulated" | "Blocked" | "Failed" | "Detected";

export type DAppCategory =
  | "Fake Airdrop"
  | "Fake Claim"
  | "Fake Mint"
  | "Fake Staking"
  | "Fake Bridge"
  | "Fake Swap"
  | "Fake Giveaway"
  | "Fake Presale"
  | "Fake Revoke"
  | "Malicious Approval"
  | "Suspicious Contract"
  | "Fake Token Migration"
  | "Generic Wallet 体验";

export type ApprovalType = "Limited Approval" | "Large Approval" | "Unlimited Approval" | "Suspicious Spender";

// —— 核心实体 ---------------------------------------------------------------

/** 统一 Mock 钱包：全站"钱包 / 用户资产地址"概念的唯一数据源。 */
export interface MockWallet {
  id: string;
  label: string;
  address: string;
  network: WalletNetwork;
  walletType: WalletType;
  totalValueUsd: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: WalletStatus;
  lastActiveAgo: string;
  /** core = 运营后台原始 8 个隔离钱包；extended = 自动扫描扩展池（36 个）。 */
  pool: "core" | "extended";
  /** 关联的后台分析用户 ID（如存在），用于打通 /admin/users 与钱包数据。 */
  linkedUserId?: string;
}

export interface MockToken {
  id: string;
  symbol: string;
  name: string;
  network: WalletNetwork;
  decimals: number;
  mockPriceUsd: number;
  totalSupply: string;
  riskLevel: RiskLevel;
}

export interface MockAssetHolding {
  walletId: string;
  tokenId: string;
  amount: number;
  valueUsd: number;
}

export interface MockDApp {
  id: string;
  name: string;
  domain: string;
  category: DAppCategory;
  riskLevel: RiskLevel;
  contractAddress: string;
  status: "Active" | "Disabled";
}

export interface MockApproval {
  id: string;
  walletId?: string;
  tokenId?: string;
  dappId?: string;
  ownerAddress: string;
  spenderAddress: string;
  tokenSymbol: string;
  allowance: string;
  type: ApprovalType;
  riskLevel: RiskLevel;
  status: "待处理" | "已处理" | "已忽略";
  createdAt: string;
}

export type SignatureType = "Personal Sign" | "Typed Data (EIP-712)" | "Permit (EIP-2612)";

export interface MockSignature {
  id: string;
  walletId?: string;
  dappId?: string;
  type: SignatureType;
  riskLevel: RiskLevel;
  summary: string;
  createdAt: string;
}

export interface MockThreatEvent {
  id: string;
  category: string;
  riskLevel: RiskLevel;
  walletId?: string;
  dappId?: string;
  description: string;
  detectedAt: string;
  status: SimulationStatus;
}

export interface MockAlert {
  id: string;
  level: "Critical" | "High" | "Medium" | "Low";
  title: string;
  detail: string;
  walletId?: string;
  dappId?: string;
  tokenId?: string;
  ruleId?: string;
  time: string;
  read: boolean;
}

export interface MockTransaction {
  id: string;
  hash: string;
  fromWalletId?: string;
  toAddress: string;
  tokenId?: string;
  amountLabel: string;
  method: string;
  gas: string;
  status: SimulationStatus;
  timestamp: string;
}

export interface AttackChainStep {
  step: number;
  action: string;
  component: string;
  risk: RiskLevel;
  status: SimulationStatus;
}

/** 攻击"手法 / 技术"定义 —— 描述一类攻击的通用链路，不绑定具体钱包实例。 */
export interface AttackScenario {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  description: string;
  attackVector: string;
  riskLevel: RiskLevel;
  chain: AttackChainStep[];
  detectionLogic: string;
  recommendation: string;
}

export type SimulationRunStatus = "running" | "blocked" | "completed" | "failed";

export interface SimulationEvent {
  id: string;
  runId: string;
  timestamp: string;
  stepIndex: number;
  title: string;
  riskLevel: RiskLevel;
  status: SimulationStatus;
}

/**
 * 一次"分析任务" —— 把某个 AttackScenario（攻击手法）应用到某个具体
 * MockWallet（目标钱包）/ MockDApp / MockToken 上产生的分析实例。
 * 这是 Attack 案例页面与 SOC 态势看板之间此前缺失的关联点：
 * 两边此前各自维护互不相关的数据，现在都可以引用同一个 SimulationRun。
 */
export interface SimulationRun {
  id: string;
  attackScenarioId: string;
  walletId?: string;
  dappId?: string;
  tokenId?: string;
  destinationAddress: string;
  txHash: string;
  amountLabel: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: SimulationRunStatus;
  startedAt: string;
  completedAt?: string;
  events: SimulationEvent[];
}
