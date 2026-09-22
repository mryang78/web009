// ---------------------------------------------------------------------------
// 统一 Simulation Engine —— 类型定义
//
// 纯分析安全研究平台：本引擎驱动的一切状态、事件、地址、交易，均为虚构 Mock
// 数据，不连接真实钱包、真实区块链、真实 RPC、真实签名或真实资产转移。
//
// 与 @/lib/shared 的关系：@/lib/shared 提供"数据是什么"（钱包/Token/DApp/
// 攻击场景等静态分析数据目录），本模块提供"一次分析如何运行"（真实的状态机 +
// 事件流引擎）。SimulationEngineState 通过 scenarioId / walletId / dappId /
// tokenId 引用 @/lib/shared 中的 canonical 数据，不重复定义它们。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";

/**
 * 一次分析任务的生命周期状态机。
 *
 *   IDLE ──startSimulation──▶ INITIALIZING ──▶ RUNNING
 *   RUNNING ──advanceStep（非最后一步）──▶ RUNNING
 *   RUNNING ──advanceStep（最后一步，结果=拦截）──▶ BLOCKED
 *   RUNNING ──advanceStep（最后一步，结果=检测到未拦截）──▶ DETECTED
 *   RUNNING ──advanceStep（最后一步，结果=正常完成）──▶ COMPLETED
 *   RUNNING ──advanceStep（最后一步，结果=异常）──▶ FAILED
 *   RUNNING ──pauseSimulation──▶ PAUSED ──resumeSimulation──▶ RUNNING
 *   任意状态 ──resetSimulation──▶ IDLE
 *
 * 所有转换都通过显式函数调用完成并立即生效，不依赖 setTimeout/setInterval
 * 分析"假进度"——引擎本身不含任何计时器，播放节奏完全由调用方决定。
 */
export type SimulationStatus =
  | "IDLE"
  | "INITIALIZING"
  | "RUNNING"
  | "PAUSED"
  | "DETECTED"
  | "BLOCKED"
  | "COMPLETED"
  | "FAILED";

/** 已终止（不能再 advanceStep，只能 reset）的状态集合。 */
export const TERMINAL_STATUSES: readonly SimulationStatus[] = ["DETECTED", "BLOCKED", "COMPLETED", "FAILED"];

/**
 * Simulation Event 类型 —— 业务事件对应攻击链每一步实际发生的动作类型；
 * 生命周期事件记录引擎自身状态机的转换，两者共用同一条 events 时间线，
 * 保证"每一步都产生一个可追溯的 Simulation Event"。
 */
export type SimulationEventType =
  // —— 业务事件（对应攻击链步骤）——
  | "DAPP_OPENED"
  | "REQUEST_CREATED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_ANALYZED"
  | "SIGNATURE_REQUESTED"
  | "SIGNATURE_ANALYZED"
  | "THREAT_DETECTED"
  | "ASSET_MOVEMENT_SIMULATED"
  | "PROTECTION_TRIGGERED"
  // —— 引擎生命周期事件 ——
  | "SIMULATION_INITIALIZED"
  | "SIMULATION_PAUSED"
  | "SIMULATION_RESUMED"
  | "SIMULATION_RESET"
  | "SIMULATION_COMPLETED"
  | "SIMULATION_FAILED";

export interface SimulationEngineEvent {
  id: string;
  simulationId: string;
  /** 事件序号（同一次分析内单调递增，从 0 开始），比时间戳更适合做排序/去重 key。 */
  sequence: number;
  type: SimulationEventType;
  title: string;
  /** 触发该事件的攻击链步骤下标；生命周期事件（如 PAUSED）没有对应步骤，为 -1。 */
  stepIndex: number;
  component: string;
  riskLevel: RiskLevel;
  timestamp: string;
}

export interface CreateSimulationInput {
  /** 引用 @/lib/shared/entities.attackScenarios 中的攻击手法 id。 */
  scenarioId: string;
  /** 引用 @/lib/shared/entities.mockWallets 中的目标钱包 id（可选）。 */
  walletId?: string;
  /** 引用 @/lib/shared/entities.mockDApps 中的 DApp id（可选）。 */
  dappId?: string;
  /** 引用 @/lib/shared/entities.mockTokens 中的 Token id（可选）。 */
  tokenId?: string;
  /** 显式指定 id；不传则由引擎生成一个确定性 id。 */
  id?: string;
}

export interface SimulationEngineState {
  id: string;
  scenarioId: string;
  walletId?: string;
  dappId?: string;
  tokenId?: string;
  status: SimulationStatus;
  /** -1 表示尚未开始推进任何步骤。 */
  currentStepIndex: number;
  totalSteps: number;
  /** 随着步骤推进逐步逼近场景最终风险等级的"实时风险评分"，不是固定值。 */
  riskScore: number;
  riskLevel: RiskLevel;
  events: SimulationEngineEvent[];
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

export type SimulationListener = (state: SimulationEngineState) => void;

/** 取消订阅函数。 */
export type Unsubscribe = () => void;
