// ---------------------------------------------------------------------------
// Threat Detection Engine —— 类型定义
//
// Threat 永远从 Simulation Engine 真实产生的 SimulationEvent 里检测出来
// （见 threat-engine.ts 的 classifyEvent / scanSimulation），不是页面自己
// 编一份威胁列表。severity 直接复用触发它的那条 SimulationEvent 的
// riskLevel——同一份 Simulation State 是 Risk / Threat / Alert 三者共同的
// 唯一数据来源。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import type { SimulationEventType } from "@/lib/simulation";

export type ThreatType =
  | "UNLIMITED_APPROVAL"
  | "SUSPICIOUS_SPENDER"
  | "UNKNOWN_DAPP"
  | "HIGH_VALUE_REQUEST"
  | "SUSPICIOUS_SIGNATURE"
  | "PERMIT_RISK"
  | "ABNORMAL_ASSET_MOVEMENT";

export interface ThreatDetection {
  id: string;
  simulationId: string;
  walletId?: string;
  type: ThreatType;
  /** 直接取自触发它的 SimulationEvent 的 riskLevel，不独立臆造。 */
  severity: RiskLevel;
  title: string;
  message: string;
  /** 触发该次检测的 SimulationEvent id / 类型 / 步骤下标，保证可追溯回原始事件。 */
  sourceEventId: string;
  sourceEventType: SimulationEventType;
  sourceStepIndex: number;
  detectedAt: string;
}

export type ThreatListener = (detection: ThreatDetection) => void;
export type Unsubscribe = () => void;
