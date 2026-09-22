import { getWalletByAddress } from "@/lib/shared/entities";
import { threatLevelFromRiskLevel } from "@/lib/shared/risk";
import type { ThreatLevel } from "@/lib/security-data";

export const adminSecurityStats = [
  { label: "Threats Detected", value: "1,284", icon: "siren" as const },
  { label: "Critical Threats", value: "82", icon: "flame" as const },
  { label: "Risk Addresses", value: "326", icon: "shield-alert" as const },
  { label: "Blocked Simulations", value: "8,921", icon: "ban" as const },
];

export interface RiskAddressRow {
  address: string;
  level: ThreatLevel;
  category: string;
  lastActivity: string;
}

// 部分风险地址与「钱包与资产安全」模块的核心钱包是同一批地址（例如
// 0x6C0f...F721 = Wallet-005，0x0A5e...9E12 = Wallet-008）。此前这里的风险
// 等级是各自手写的，导致同一个地址在两个页面呈现不一致甚至矛盾的风险判定
// （Wallet-008 已冻结/CRITICAL，这里却曾经标成 medium）。现在改为优先从统一
// 钱包池取 canonical 风险等级，取不到（不在钱包池里的地址）才使用本地兜底值。
const RISK_ADDRESS_SEEDS: RiskAddressRow[] = [
  { address: "0xA1b2...9f3C", level: "critical", category: "资产盗取地址", lastActivity: "3 分钟前" },
  { address: "0x7E4d...11aB", level: "high", category: "钓鱼地址", lastActivity: "18 分钟前" },
  { address: "0x3bC1...44F0", level: "medium", category: "异常转账", lastActivity: "1 小时前" },
  { address: "0x6C0F...F721", level: "high", category: "可疑授权", lastActivity: "2 小时前" },
  { address: "0x0A5E...9E12", level: "medium", category: "资金流向异常", lastActivity: "5 小时前" },
  { address: "0x9F0c...77De", level: "low", category: "监控中", lastActivity: "1 天前" },
];

export const riskAddresses: RiskAddressRow[] = RISK_ADDRESS_SEEDS.map((row) => {
  const wallet = getWalletByAddress(row.address);
  if (!wallet) return row;
  return { ...row, level: threatLevelFromRiskLevel(wallet.riskLevel) };
});

export interface SuspiciousContractRow {
  contract: string;
  riskScore: number;
  interactions: string;
  status: "Blocked" | "Under Review" | "Monitored";
}

export const contractStatusLabel: Record<SuspiciousContractRow["status"], string> = {
  Blocked: "已拦截",
  "Under Review": "审核中",
  Monitored: "监控中",
};

export const suspiciousContracts: SuspiciousContractRow[] = [
  { contract: "0x9A2...71EF", riskScore: 97, interactions: "1,204", status: "Blocked" },
  { contract: "0x8B1...44D0", riskScore: 94, interactions: "862", status: "Blocked" },
  { contract: "0x1D0...5A9F", riskScore: 96, interactions: "540", status: "Blocked" },
  { contract: "0x5E6...90AC", riskScore: 88, interactions: "311", status: "Under Review" },
  { contract: "0x3F7...C812", riskScore: 79, interactions: "205", status: "Monitored" },
];

export interface SimulationCaseRow {
  caseId: string;
  threatType: string;
  risk: ThreatLevel;
  asset: string;
  amount: string;
  status: "Blocked" | "Blocked · Reviewed";
}

export const simulationStatusLabel: Record<SimulationCaseRow["status"], string> = {
  Blocked: "已拦截",
  "Blocked · Reviewed": "已拦截 · 已复核",
};

export const simulationCases: SimulationCaseRow[] = [
  { caseId: "SIM-10281", threatType: "代币盗取风险", risk: "critical", asset: "USDT", amount: "48,520", status: "Blocked" },
  { caseId: "SIM-10277", threatType: "恶意授权风险", risk: "high", asset: "USDC", amount: "31,200", status: "Blocked" },
  { caseId: "SIM-10264", threatType: "钓鱼钱包风险", risk: "high", asset: "ETH", amount: "8.4", status: "Blocked" },
  { caseId: "SIM-10251", threatType: "恶意合约分析", risk: "critical", asset: "DAI", amount: "22,750", status: "Blocked" },
  { caseId: "SIM-10238", threatType: "异常资金流向分析", risk: "medium", asset: "USDT", amount: "67,400", status: "Blocked · Reviewed" },
  { caseId: "SIM-10229", threatType: "可疑兑换分析", risk: "medium", asset: "USDC", amount: "15,900", status: "Blocked" },
];
