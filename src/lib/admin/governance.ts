// ---------------------------------------------------------------------------
// 后台治理数据：合约档案、风险地址名单、操作日志、系统设置。
// 全部为本地确定性生成的虚构数据，、不读取私钥或助记词、
// 不执行真实授权与资产转移。
// ---------------------------------------------------------------------------

import { mockDApps, mockWallets } from "@/lib/shared/entities";
import { riskLevelFromScore } from "@/lib/shared/risk";
import { hashStringToSeed, seededRandom } from "@/lib/shared/prng";
import type { RiskLevel, WalletNetwork } from "@/lib/shared/types";

export interface ContractRecord {
  id: string;
  name: string;
  address: string;
  network: WalletNetwork;
  type: "Token" | "Router" | "NFT Market" | "Bridge" | "Unknown";
  riskLevel: RiskLevel;
  verified: boolean;
  findings: string[];
  firstSeen: string;
}

const contractNetworks: WalletNetwork[] = ["Ethereum", "BNB Chain", "Polygon", "Arbitrum", "Base"];
const contractTypes: ContractRecord["type"][] = ["Token", "Router", "NFT Market", "Bridge", "Unknown"];
const findingPool = [
  "存在无限授权入口函数",
  "owner 可任意增发",
  "可暂停转账（blacklist 逻辑）",
  "代理合约可随时升级实现",
  "转账手续费可被动态修改",
  "未通过任何公开审计",
];

export const contractRecords: ContractRecord[] = mockDApps.map((dapp, i) => {
  const rnd = seededRandom(hashStringToSeed(`contract-${dapp.id}`));
  const score = Math.floor(rnd() * 100);
  const findingCount = score >= 70 ? 3 : score >= 40 ? 2 : score >= 20 ? 1 : 0;
  const pool = [...findingPool];
  const findings: string[] = [];
  for (let k = 0; k < findingCount && pool.length > 0; k++) {
    findings.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0] ?? "");
  }
  return {
    id: `CT-${String(i + 1).padStart(3, "0")}`,
    name: `${dapp.name} 合约`,
    address: dapp.contractAddress,
    network: contractNetworks[Math.floor(rnd() * contractNetworks.length)] ?? "Ethereum",
    type: contractTypes[Math.floor(rnd() * contractTypes.length)] ?? "Unknown",
    riskLevel: riskLevelFromScore(score),
    verified: score < 50,
    findings: findings.length > 0 ? findings : ["未命中风险特征"],
    firstSeen: `${1 + Math.floor(rnd() * 28)} 天前`,
  };
});

export interface RiskAddressRecord {
  id: string;
  address: string;
  network: WalletNetwork;
  category: "Drainer 收款地址" | "钓鱼合约" | "洗钱中转" | "可疑 Spender" | "已确认攻击者";
  riskLevel: RiskLevel;
  riskScore: number;
  source: string;
  hits: number;
  listed: boolean;
  note: string;
}

const addressCategories: RiskAddressRecord["category"][] = [
  "Drainer 收款地址",
  "钓鱼合约",
  "洗钱中转",
  "可疑 Spender",
  "已确认攻击者",
];

export const riskAddressList: RiskAddressRecord[] = mockWallets.slice(0, 24).map((w, i) => {
  const rnd = seededRandom(hashStringToSeed(`risk-addr-${w.id}`));
  const riskScore = 40 + Math.floor(rnd() * 60);
  return {
    id: `RA-${String(i + 1).padStart(3, "0")}`,
    address: w.address,
    network: w.network,
    category: addressCategories[Math.floor(rnd() * addressCategories.length)] ?? "可疑 Spender",
    riskLevel: riskLevelFromScore(riskScore),
    riskScore,
    source: rnd() > 0.5 ? "内置威胁情报库" : "行为分析引擎",
    hits: 1 + Math.floor(rnd() * 40),
    listed: riskScore >= 60,
    note: riskScore >= 80 ? "命中多条高危特征，建议直接拦截" : "持续观察中",
  };
});

export interface AuditLogRecord {
  id: string;
  time: string;
  actor: string;
  role: "超级管理员" | "安全分析师" | "运营" | "只读审计";
  action: string;
  target: string;
  ip: string;
  result: "成功" | "失败" | "已拦截";
}

const actors = ["admin@studio", "analyst.wu", "ops.chen", "audit.li", "analyst.zhao"];
const roles: AuditLogRecord["role"][] = ["超级管理员", "安全分析师", "运营", "只读审计"];
const actions = [
  "更新风险规则阈值",
  "冻结高风险钱包",
  "导出授权风险报表",
  "新增风险地址名单",
  "修改合约风险等级",
  "关闭安全告警",
  "调整评分权重",
  "登录后台",
];

export const auditLogs: AuditLogRecord[] = Array.from({ length: 36 }, (_, i) => {
  const rnd = seededRandom(hashStringToSeed(`audit-${i}`));
  const r = rnd();
  return {
    id: `LOG-${String(1000 + i)}`,
    time: `2026-09-${String(18 - Math.floor(i / 6)).padStart(2, "0")} ${String(9 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    actor: actors[Math.floor(rnd() * actors.length)] ?? "admin@studio",
    role: roles[Math.floor(rnd() * roles.length)] ?? "安全分析师",
    action: actions[Math.floor(rnd() * actions.length)] ?? "登录后台",
    target: `0x${Math.floor(rnd() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()}…`,
    ip: `10.${Math.floor(rnd() * 200)}.${Math.floor(rnd() * 200)}.${Math.floor(rnd() * 200)}`,
    result: r > 0.9 ? "已拦截" : r > 0.8 ? "失败" : "成功",
  };
});

export interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
}

export interface SettingGroup {
  title: string;
  description: string;
  toggles: SettingToggle[];
}

export const settingGroups: SettingGroup[] = [
  {
    title: "安全边界（不可修改）",
    description: "平台始终运行在实时分析中，以下开关被永久锁定为关闭状态。",
    toggles: [
      { id: "privkey", label: "读取钱包私钥", description: "平台从不请求、存储或读取任何私钥。", enabled: false, locked: true },
      { id: "seed", label: "获取助记词", description: "平台从不请求助记词或 Keystore 文件。", enabled: false, locked: true },
      { id: "approve", label: "发起链上授权", description: "授权流程仅在实时分析中推演，不会广播任何交易。", enabled: false, locked: true },
      { id: "transfer", label: "发起资产转移", description: "资金流向仅用于分析呈现，不会触达真实资产。", enabled: false, locked: true },
    ],
  },
  {
    title: "风险引擎",
    description: "控制评分、扫描与自动处置策略。",
    toggles: [
      { id: "autoscan", label: "自动巡检钱包", description: "按固定周期重新评估钱包风险分。", enabled: true },
      { id: "autoblock", label: "自动拦截严重风险", description: "风险分 ≥ 90 时自动置为拦截状态。", enabled: true },
      { id: "permit", label: "Permit / Permit2 深度检测", description: "对离线签名做额外的意图还原分析。", enabled: true },
      { id: "contract", label: "合约字节码特征分析", description: "对新出现的合约做静态特征比对。", enabled: false },
    ],
  },
  {
    title: "通知与报表",
    description: "告警投递与报告生成偏好。",
    toggles: [
      { id: "alert-mail", label: "严重告警邮件通知", description: "严重级别告警实时推送到值守邮箱。", enabled: true },
      { id: "digest", label: "每日安全摘要", description: "每天汇总风险趋势与新增威胁。", enabled: true },
      { id: "report", label: "自动生成分析报告", description: "分析任务结束后自动归档 PDF 报告。", enabled: false },
    ],
  },
];

export const systemMeta = [
  { label: "平台版本", value: "v2.4.0" },
  { label: "运行环境", value: "隔离分析环境" },
  { label: "风险规则版本", value: "rules-2026.09.18" },
  { label: "威胁情报更新", value: "12 分钟前" },
  { label: "链上连接", value: "未连接（只读分析）" },
  { label: "私钥访问", value: "永久禁用" },
];
