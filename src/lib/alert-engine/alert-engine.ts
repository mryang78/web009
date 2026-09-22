// ---------------------------------------------------------------------------
// Alert Engine —— 对外暴露的统一入口
//
// 自动生成 Critical / High / Medium / Low 告警——但"自动"的意思是"由 Threat
// Engine 真实检测出的威胁驱动"，不是页面自己按钮一点就拼一条假告警。模块加载
// 时订阅 Threat Engine 的 subscribeThreats()，之后每一条真实产生的
// ThreatDetection 都会自动派生出一条 AlertRecord——与 wallet-engine.ts 级联
// 触发 asset/approval/signature 重置是同一种"下游模块订阅上游真实事件"的
// 设计，不构成循环依赖（Threat Engine 不反过来 import Alert Engine）。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import { subscribeThreats, type ThreatDetection } from "@/lib/threat-engine";
import * as store from "./alert-store";
import type { AlertListener, AlertRecord, AlertSeverity, Unsubscribe } from "./alert-types";

/** RiskLevel → AlertSeverity 的唯一换算：SAFE 归入 LOW（没有 alert 需要展示"安全"级别）。 */
const SEVERITY_FROM_RISK: Record<RiskLevel, AlertSeverity> = {
  SAFE: "LOW",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

export function severityForRiskLevel(level: RiskLevel): AlertSeverity {
  return SEVERITY_FROM_RISK[level];
}

let alertCounter = 0;

/** 纯函数：从一条 ThreatDetection 构造出对应的 AlertRecord，不写入 store，便于单测。 */
export function generateAlertFromThreat(threat: ThreatDetection): AlertRecord {
  alertCounter += 1;
  return {
    id: `alert-${threat.simulationId}-${alertCounter}`,
    simulationId: threat.simulationId,
    walletId: threat.walletId,
    severity: severityForRiskLevel(threat.severity),
    riskLevel: threat.severity,
    threatType: threat.type,
    title: threat.title,
    message: threat.message,
    sourceThreatId: threat.id,
    createdAt: threat.detectedAt,
    acknowledged: false,
  };
}

function handleThreatDetected(threat: ThreatDetection): void {
  store.pushAlert(generateAlertFromThreat(threat));
}

export function getAlertsForSimulation(simulationId: string): AlertRecord[] {
  return store.listBySimulation(simulationId);
}

export function getAllAlerts(): AlertRecord[] {
  return store.listAll();
}

export function subscribeAlerts(listener: AlertListener): Unsubscribe {
  return store.onAlertCreated(listener);
}

export function resetAlerts(simulationId: string): void {
  store.clearSimulation(simulationId);
}

// 订阅 Threat Engine：此后每一条真实检测出的威胁都会自动派生出一条告警
// （Critical/High/Medium/Low，由 severityForRiskLevel 换算），不需要页面
// 手动触发。
subscribeThreats((threat) => {
  handleThreatDetected(threat);
});
