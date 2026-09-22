// ---------------------------------------------------------------------------
// Alert Engine —— 类型定义
//
// Alert 永远从 Threat Engine 真实产生的 ThreatDetection 派生（见
// alert-engine.ts 的 generateAlertFromThreat），severity 直接换算自触发它的
// 威胁的 severity（RiskLevel）——与 Risk / Threat 共享同一条 Simulation State
// 链路，不是页面自己拼一份告警列表。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import type { ThreatDetection, ThreatType } from "@/lib/threat-engine";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AlertRecord {
  id: string;
  simulationId: string;
  walletId?: string;
  severity: AlertSeverity;
  /** 换算前的原始 RiskLevel，保留以便追溯回 Risk/Threat 的判定。 */
  riskLevel: RiskLevel;
  threatType: ThreatType;
  title: string;
  message: string;
  sourceThreatId: string;
  createdAt: string;
  acknowledged: boolean;
}

export type AlertListener = (alert: AlertRecord) => void;
export type Unsubscribe = () => void;

/** 供 alert-engine.ts 内部使用：从一条 ThreatDetection 构造 AlertRecord 所需的输入。 */
export type GenerateAlertInput = ThreatDetection;
