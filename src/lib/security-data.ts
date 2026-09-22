// ThreatLevel 统一定义在 @/lib/shared/types（与 admin/wallet-security-data.ts
// 的 ApprovalRiskLevel 同构），本文件不再单独声明。
import type { ThreatLevel } from "@/lib/shared/types";
export type { ThreatLevel };

export const threatLevelStyle: Record<
  ThreatLevel,
  { text: string; bg: string; ring: string; dot: string; label: string }
> = {
  critical: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/25",
    dot: "bg-red-500",
    label: "严重",
  },
  high: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/25",
    dot: "bg-orange-500",
    label: "高危",
  },
  medium: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/25",
    dot: "bg-amber-500",
    label: "中危",
  },
  low: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    ring: "ring-yellow-500/25",
    dot: "bg-yellow-500",
    label: "低危",
  },
};

export const securityStats = [
  { label: "威胁检测总数", value: "1,284", icon: "siren" as const },
  { label: "高风险地址", value: "326", icon: "shield-alert" as const },
  { label: "可疑合约", value: "128", icon: "file-warning" as const },
  { label: "受保护交易", value: "8,921", icon: "shield-check" as const },
];

export const riskScore = { value: 92, max: 100, level: "critical" as ThreatLevel };

export const riskCategories: { label: string; level: ThreatLevel }[] = [
  { label: "钓鱼攻击", level: "high" },
  { label: "资产盗取", level: "critical" },
  { label: "恶意合约", level: "critical" },
  { label: "可疑授权", level: "high" },
  { label: "异常转账", level: "medium" },
  { label: "资金流向异常", level: "medium" },
];

export const riskDistribution: { label: string; value: number; level: ThreatLevel }[] = [
  { label: "严重", value: 12, level: "critical" },
  { label: "高危", value: 28, level: "high" },
  { label: "中危", value: 37, level: "medium" },
  { label: "低危", value: 23, level: "low" },
];

export interface ThreatEvent {
  time: string;
  title: string;
  level: ThreatLevel;
}

export const threatActivitySeed: ThreatEvent[] = [
  { time: "22:41:12", title: "检测到可疑合约", level: "critical" },
  { time: "22:40:57", title: "异常授权事件", level: "high" },
  { time: "22:40:41", title: "识别到高风险地址", level: "high" },
  { time: "22:39:52", title: "资产提取验证已启动", level: "critical" },
  { time: "22:39:28", title: "触发安全引擎", level: "medium" },
  { time: "22:39:18", title: "威胁已拦截", level: "low" },
];

export const threatActivityPool: string[] = [
  "标记恶意网站",
  "钱包授权异常",
  "匹配到资产盗取签名",
  "可疑代币转账",
  "风险实体交叉比对",
  "合约字节码重新扫描",
  "资金流向模式已更新",
  "威胁情报同步完成",
];

export const attackPathSteps = [
  "用户钱包",
  "钓鱼网站",
  "代币授权",
  "可疑合约",
  "资产提取",
  "目标钱包",
];

export const simulationSteps = [
  { id: 1, title: "检测到可疑网站" },
  { id: 2, title: "隔离钱包交互" },
  { id: 3, title: "检测到授权事件" },
  { id: 4, title: "识别可疑合约" },
  { id: 5, title: "资产提取验证" },
  { id: 6, title: "触发风险引擎" },
  { id: 7, title: "交易已拦截" },
];

export const assetExtraction = {
  targetWallet: "0xLab...8192",
  asset: "USDT",
  amount: "48,520 USDT",
  destination: "0xLab...2841",
  status: "分析中",
};

export const analysisResult = {
  threatType: "资产提取风险",
  severity: "严重",
  confidence: "98%",
  affectedAsset: "USDT",
  simulatedAmount: "48,520 USDT",
  attackVector: "恶意合约",
  detection: "实时分析引擎",
};

export interface MapNode {
  id: string;
  label: string;
  angle: number;
  level: ThreatLevel;
}

export const mapCenter = "可疑合约";

export const mapNodes: MapNode[] = [
  { id: "attacker", label: "攻击者地址", angle: -150, level: "critical" },
  { id: "victim", label: "受害者地址", angle: -90, level: "high" },
  { id: "token", label: "代币", angle: -30, level: "medium" },
  { id: "tx", label: "交易", angle: 30, level: "medium" },
  { id: "exchange", label: "交易所", angle: 90, level: "low" },
  { id: "risk-entity", label: "风险实体", angle: 150, level: "high" },
];

export interface LookupResult {
  type: string;
  level: ThreatLevel;
  label: string;
}

export const searchLookup: Record<string, LookupResult> = {
  "0xa1b2c3d4e5f6789f3c": {
    type: "钱包地址",
    level: "critical",
    label: "已知资产盗取关联地址，检测到多起资产提取分析记录",
  },
  "0x7e4d5f6a7b8c9d11ab": {
    type: "合约地址",
    level: "high",
    label: "可疑合约，存在异常授权行为",
  },
  "0x9f0c1d2e3f4a5b77de": {
    type: "钱包地址",
    level: "low",
    label: "未发现异常行为，风险评分处于安全区间",
  },
  "0x3bc1d2e3f4a5b6c744f0": {
    type: "交易哈希",
    level: "medium",
    label: "资产流向异常，建议持续关注",
  },
};

export const searchExamples = Object.keys(searchLookup);

export const reportContent = {
  summary:
    "本报告基于内置威胁情报数据生成，用于分析 Web3 安全情报的攻击路径分析与报告能力。",
  threatLevel: "严重",
  attackPath: attackPathSteps,
  affectedAssets: ["USDT · 48,520", "钱包 · 0xLab...8192"],
  riskIndicators: ["异常授权行为", "高风险合约交互", "资产流向可疑地址"],
  relatedAddresses: ["0xLab...8192", "0xLab...2841", "0xLab...9f3C"],
  recommendedActions: [
    "立即撤销可疑授权",
    "冻结相关资产流转路径（分析）",
    "将关联地址加入风险名单并持续监控",
  ],
};
