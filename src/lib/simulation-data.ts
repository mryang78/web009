import { findWalletByAddressFragment } from "@/lib/shared/entities";

export interface ThreatScenario {
  id: string;
  index: string;
  name: string;
  nameZh: string;
  targetWallet: string;
  balance: { usdt: string; eth: string };
  assets: string[];
  contract: string;
  riskScore: number;
  asset: string;
  amount: string;
  destinationWallet: string;
  txHash: string;
  method: string;
  gas: string;
  /**
   * 关联到 @/lib/shared/entities.attackScenarios 中的攻击手法定义 —— 此前
   * Attack 分析页面与 SOC 攻击案例库使用的是两套完全独立、互相无法关联的数据，
   * 这个字段是本次数据层梳理新增的关联点。
   */
  attackScenarioId?: string;
  /** 关联到 @/lib/shared/entities.mockWallets 中的目标钱包 id（如能匹配到）。 */
  walletId?: string;
}

const SCENARIO_SEEDS: Omit<ThreatScenario, "walletId">[] = [
  {
    id: "malicious-approval",
    index: "01",
    name: "Malicious Approval",
    nameZh: "恶意授权风险",
    targetWallet: "0x4F2...C918",
    balance: { usdt: "62,140 USDT", eth: "5.31 ETH" },
    assets: ["BTC", "ETH", "USDT", "USDC"],
    contract: "0x8B1...44D0",
    riskScore: 94,
    asset: "USDC",
    amount: "31,200 USDC",
    destinationWallet: "0x6C0...F721",
    txHash: "0xEVENT-ANALYSIS",
    method: "approve()",
    gas: "0.94 ETH",
    attackScenarioId: "atk-unlimited-approval",
  },
  {
    id: "token-drain",
    index: "02",
    name: "Token Drain",
    nameZh: "资产提取验证",
    targetWallet: "0x71D...A82F",
    balance: { usdt: "128,520 USDT", eth: "12.52 ETH" },
    assets: ["BTC", "ETH", "USDT", "USDC", "SOL"],
    contract: "0x9A2...71EF",
    riskScore: 97,
    asset: "USDT",
    amount: "48,520 USDT",
    destinationWallet: "0x3D8...2841",
    txHash: "0xEVENT-ANALYSIS",
    method: "transferFrom()",
    gas: "1.82 ETH",
    attackScenarioId: "atk-fake-airdrop",
  },
  {
    id: "phishing-wallet",
    index: "03",
    name: "Phishing Wallet",
    nameZh: "钓鱼钱包交互分析",
    targetWallet: "0x2A7...B103",
    balance: { usdt: "19,860 USDT", eth: "3.08 ETH" },
    assets: ["ETH", "USDT", "NFT"],
    contract: "0x5E6...90AC",
    riskScore: 91,
    asset: "ETH",
    amount: "8.4 ETH",
    destinationWallet: "0x7F1...D630",
    txHash: "0xEVENT-ANALYSIS",
    method: "signTypedData()",
    gas: "0.41 ETH",
    attackScenarioId: "atk-signature-phishing",
  },
  {
    id: "malicious-contract",
    index: "04",
    name: "Malicious Contract",
    nameZh: "恶意合约交互分析",
    targetWallet: "0x9C4...E255",
    balance: { usdt: "84,300 USDT", eth: "7.19 ETH" },
    assets: ["ETH", "USDT", "USDC", "DAI"],
    contract: "0x1D0...5A9F",
    riskScore: 96,
    asset: "DAI",
    amount: "22,750 DAI",
    destinationWallet: "0x8E4...1C36",
    txHash: "0xEVENT-ANALYSIS",
    method: "execute()",
    gas: "1.14 ETH",
    attackScenarioId: "atk-transaction-manipulation",
  },
  {
    id: "abnormal-fund-flow",
    index: "05",
    name: "Abnormal Fund Flow",
    nameZh: "异常资金流向分析",
    targetWallet: "0x6B8...F407",
    balance: { usdt: "156,900 USDT", eth: "18.66 ETH" },
    assets: ["BTC", "ETH", "USDT", "SOL"],
    contract: "0x3F7...C812",
    riskScore: 88,
    asset: "USDT",
    amount: "67,400 USDT",
    destinationWallet: "0x0A5...9E12",
    txHash: "0xEVENT-ANALYSIS",
    method: "multiSend()",
    gas: "2.05 ETH",
    attackScenarioId: "atk-abnormal-fund-flow",
  },
  {
    id: "suspicious-swap",
    index: "06",
    name: "Suspicious Swap",
    nameZh: "异常兑换行为分析",
    targetWallet: "0x5D1...7A44",
    balance: { usdt: "41,220 USDT", eth: "4.77 ETH" },
    assets: ["ETH", "USDT", "USDC"],
    contract: "0x2C9...B061",
    riskScore: 85,
    asset: "USDC",
    amount: "15,900 USDC",
    destinationWallet: "0x4B3...D590",
    txHash: "0xEVENT-ANALYSIS",
    method: "swapExactTokens()",
    gas: "0.67 ETH",
    attackScenarioId: "atk-suspicious-swap",
  },
];

// 把每个场景的 targetWallet 与统一钱包池按地址前缀匹配，能匹配上的场景就获得
// 一个真实的 walletId，从而把"这次分析打在哪个 Mock 钱包上"变得可追溯 ——
// 此前这里只是一段孤立的截断地址字符串，与钱包安全模块完全无法关联。
export const scenarios: ThreatScenario[] = SCENARIO_SEEDS.map((seed) => ({
  ...seed,
  walletId: findWalletByAddressFragment(seed.targetWallet)?.id,
}));

export function getScenarioById(id: string | undefined) {
  return scenarios.find((s) => s.id === id) ?? scenarios[1];
}

export const canvasNodes = [
  "目标钱包",
  "钓鱼网站",
  "授权事件",
  "可疑合约",
  "资产提取",
  "目标钱包",
  "风险引擎",
  "威胁已拦截",
];

export const simulationStages = [
  { pct: 0, label: "正在初始化分析" },
  { pct: 20, label: "已识别目标" },
  { pct: 35, label: "已分析交互" },
  { pct: 50, label: "检测到授权事件" },
  { pct: 65, label: "检测到可疑合约" },
  { pct: 80, label: "已资产提取验证" },
  { pct: 92, label: "已触发风险引擎" },
  { pct: 100, label: "威胁已拦截" },
];

export const timelineTemplate = [
  { offset: 0, title: "分析开始" },
  { offset: 2, title: "检测到钱包交互" },
  { offset: 4, title: "授权事件" },
  { offset: 6, title: "可疑合约" },
  { offset: 8, title: "资产提取验证" },
  { offset: 10, title: "威胁检测" },
  { offset: 11, title: "转账已拦截" },
];

export const fundFlowNodes = [
  { id: "source", label: "源钱包" },
  { id: "contract", label: "合约" },
  { id: "intermediate", label: "中转钱包" },
  { id: "destination", label: "目标钱包" },
  { id: "engine", label: "安全引擎" },
];

export const securityRecommendations = [
  "撤销可疑授权",
  "拦截高风险合约",
  "持续监控关联地址",
  "审查钱包交互记录",
];

export interface PreviousSimulation {
  id: string;
  scenarioId: string;
  time: string;
  riskScore: number;
  result: "Blocked" | "Blocked · Reviewed";
}

export const previousSimulations: PreviousSimulation[] = [
  { id: "sim-1042", scenarioId: "token-drain", time: "今天 22:41", riskScore: 98, result: "Blocked" },
  { id: "sim-1041", scenarioId: "malicious-approval", time: "今天 19:12", riskScore: 94, result: "Blocked" },
  { id: "sim-1039", scenarioId: "phishing-wallet", time: "昨天 14:05", riskScore: 91, result: "Blocked" },
  { id: "sim-1035", scenarioId: "suspicious-swap", time: "昨天 09:47", riskScore: 85, result: "Blocked · Reviewed" },
  { id: "sim-1031", scenarioId: "malicious-contract", time: "2 天前", riskScore: 96, result: "Blocked" },
];

export const previousSimulationResultLabel: Record<PreviousSimulation["result"], string> = {
  Blocked: "已拦截",
  "Blocked · Reviewed": "已拦截 · 已复核",
};
