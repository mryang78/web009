// ---------------------------------------------------------------------------
// Attack Scenario Engine —— 类型定义
//
// 纯分析安全研究平台：本模块定义的一切（场景、步骤、风险规则、检测规则、
// 推演结果）均为虚构分析数据的类型描述，不代表、不查询、不连接任何真实
// 钱包、真实区块链、真实 RPC、真实签名或真实资产转移。
//
// 与既有模块的关系：
//   - @/lib/shared/entities.attackScenarios 提供"这次攻击链在引擎里如何逐步
//     推进"的执行蓝图（AttackChainStep[]），供 @/lib/simulation 的状态机消费。
//   - 本模块（AttackScenario，注意类型名与 shared 里的同名类型不同，只在本
//     模块内部使用）提供"这个攻击手法的完整安全教育画像"——分类、初始状态、
//     可读的步骤叙事、风险规则、检测规则、推演结果模板、防御建议——通过
//     linkedAttackScenarioId 字段引用回 shared 里的执行蓝图，两者是模板与
//     执行引用的关系，不是重复定义同一份数据。
//   - attack-scenario-engine.ts 的 runFullAttack体验() 是"完整 体验"编排器：
//     真正调用 Wallet / Asset / Approval / Signature / Risk / Threat / Alert
//     Engine + Simulation Engine，跑完 目标钱包 → Mock DApp → 授权请求 →
//     风险分析 → Mock 签名 → 威胁检测 → 分析资产异动 → 保护触发 → 分析完成 →
//     安全报告 的完整链路，产出的 SecurityReport 才是"这一次跑出来的真实
//     （实时分析）结果"，AttackScenario 本身只是不变的模板。
// ---------------------------------------------------------------------------

import type { RiskLevel, WalletNetwork } from "@/lib/shared/types";
import type { RiskFactorKey } from "@/lib/risk-engine";
import type { SimulationStatus } from "@/lib/simulation";
import type { ThreatType } from "@/lib/threat-engine";
import type { AlertRecord } from "@/lib/alert-engine";
import type { ApprovalRecordState } from "@/lib/approval-engine";
import type { SignatureRecordState } from "@/lib/signature-engine";
import type { MockAssetMovementRecord } from "@/lib/asset-engine";
import type { ThreatDetection } from "@/lib/threat-engine";

/** 20 个标准场景归纳出的 7 大攻击手法分类。 */
export type AttackScenarioCategory =
  | "Phishing DApp"
  | "Malicious Approval"
  | "Signature Abuse"
  | "Suspicious Contract"
  | "Address Poisoning"
  | "Transaction Manipulation"
  | "Social Engineering";

/** 场景开始前的 Mock 初始状态：一个虚构钱包即将接触一个虚构 DApp。 */
export interface ScenarioInitialState {
  walletLabel: string;
  network: WalletNetwork;
  /** 关联的 Mock DApp（引用 @/lib/shared/entities.mockDApps），部分场景（如地址污染）不涉及具体 DApp。 */
  dappId?: string;
  /** 这次分析会涉及到的 Mock Token（引用 @/lib/shared/entities.mockTokens）。 */
  tokenIds: string[];
  /** 一句话叙事，描述"故事从哪里开始"。 */
  narrative: string;
}

/** "完整 体验"管道里，这一步对应调用哪一类 Mock 动作——用于 UI 渲染图标/驱动编排器。 */
export type ScenarioMockAction =
  | "OPEN_DAPP"
  | "REQUEST_APPROVAL"
  | "ANALYZE_RISK"
  | "REQUEST_SIGNATURE"
  | "SIMULATE_SIGNATURE"
  | "DETECT_THREAT"
  | "SIMULATE_ASSET_MOVEMENT"
  | "TRIGGER_PROTECTION"
  | "NONE";

export interface ScenarioStep {
  order: number;
  title: string;
  actor: "User" | "Attacker" | "DApp" | "Wallet" | "RiskEngine" | "ProtectionEngine";
  component: string;
  riskLevel: RiskLevel;
  mockAction: ScenarioMockAction;
}

/** 这个场景在概念上会命中哪些 Risk Engine 具名因素（模板级别的"通常适用哪些因素"，不是某一次真实评分）。 */
export interface ScenarioRiskRule {
  factor: RiskFactorKey;
  description: string;
}

/** 这个场景在概念上会触发 Threat Engine 的哪些检测规则。 */
export interface ScenarioDetectionRule {
  threatType: ThreatType;
  condition: string;
}

/** 场景模板里的"预期推演结果"——注意这是模板描述，不是某一次真实运行的数字；真实数字在 SecurityReport 里。 */
export interface ScenarioOutcomeTemplate {
  finalStatus: SimulationStatus;
  narrative: string;
  projectedLossNote: string;
  /** 结构性写死为字面量 0/false/false——不是"通常为 0"，是这个平台的安全约束，任何一次运行都不例外。 */
  actualLoss: 0;
  transactionExecuted: false;
  blockchainConnected: false;
}

export interface AttackScenario {
  id: string;
  name: string;
  category: AttackScenarioCategory;
  description: string;
  severity: RiskLevel;
  initialState: ScenarioInitialState;
  steps: ScenarioStep[];
  riskRules: ScenarioRiskRule[];
  detectionRules: ScenarioDetectionRule[];
  simulationOutcome: ScenarioOutcomeTemplate;
  recommendations: string[];
  /** 引用 @/lib/shared/entities.attackScenarios 中可被 Simulation Engine 真实执行的攻击链 id。 */
  linkedAttackScenarioId: string;
}

// ———————————————————————————————————————————————————————————————————————
// "完整 体验"管道的运行结果——runFullAttack体验() 的返回值
// ———————————————————————————————————————————————————————————————————————

/** 安全约束在类型层面的落地：这三个字段永远只能是这三个字面量值。 */
export interface SecurityReportSafetyFooter {
  actualLoss: 0;
  transactionStatus: "NOT EXECUTED";
  blockchainStatus: "NOT CONNECTED";
}

export interface SecurityReport {
  scenarioId: string;
  scenarioName: string;
  simulationId: string;
  walletId: string;
  walletAddress: string;
  status: SimulationStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  threats: ThreatDetection[];
  alerts: AlertRecord[];
  approval?: ApprovalRecordState;
  signature?: SignatureRecordState;
  assetMovement?: MockAssetMovementRecord;
  /** 按最终风险等级推演出的假设影响金额（美元）——纯推演展示数字，来自 Asset Engine，从不写入真实余额。 */
  projectedLossUsd: number;
  safety: SecurityReportSafetyFooter;
  generatedAt: string;
}

export interface RunFullAttack体验Input {
  scenarioId: string;
  /** 不传则自动创建一个新的 目标钱包。 */
  walletId?: string;
}
