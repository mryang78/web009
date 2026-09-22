// ---------------------------------------------------------------------------
// Threat Detection Engine —— 对外暴露的统一入口
//
// 根据 Simulation Engine 真实产生的 Simulation Event 自动检测：
//   Unlimited Approval / Suspicious Spender / Unknown DApp / High Value
//   Request / Suspicious Signature / Permit Risk / Abnormal Asset Movement
//
// attachToSimulation(simulationId) 订阅 Simulation Engine 的状态推送
// （subscribeSimulation），每次状态变化都重新扫描"自上次处理以来新增的事件"
// （用 SimulationEngineEvent.sequence 去重，而不是重新处理整条历史），命中规则
// 就产生一条 ThreatDetection 并推送给订阅者——不是页面自己拼一份威胁列表。
// ---------------------------------------------------------------------------

import { getSimulationState, subscribeSimulation, type SimulationEngineEvent } from "@/lib/simulation";
import * as store from "./threat-store";
import type { ThreatDetection, ThreatListener, ThreatType, Unsubscribe } from "./threat-types";

/** 按优先级排列的关键词/component 规则表——顺序即优先级，先命中先归类。 */
const CLASSIFY_RULES: Array<{ type: ThreatType; test: (e: SimulationEngineEvent) => boolean }> = [
  { type: "UNLIMITED_APPROVAL", test: (e) => /unlimited|无限/i.test(e.title) },
  { type: "PERMIT_RISK", test: (e) => e.component === "Permit Engine" || /permit/i.test(e.title) },
  {
    type: "SUSPICIOUS_SIGNATURE",
    test: (e) => e.component === "Signature Engine" || /签名.*不一致|signature.*mismatch/i.test(e.title),
  },
  { type: "SUSPICIOUS_SPENDER", test: (e) => /相似地址|冒充|仿冒|spender|索要/i.test(e.title) },
  {
    type: "UNKNOWN_DAPP",
    test: (e) => e.type === "DAPP_OPENED" && (e.component === "Fake DApp" || e.component === "Social Channel"),
  },
  {
    type: "ABNORMAL_ASSET_MOVEMENT",
    test: (e) => e.component === "Malicious Contract" || e.component === "Fund Flow Engine" || /资产转移|资金.*流转|批量转账|转移请求/i.test(e.title),
  },
  { type: "HIGH_VALUE_REQUEST", test: (e) => /大额|批量|多笔|high.?value/i.test(e.title) },
];

const THREAT_TITLE: Record<ThreatType, string> = {
  UNLIMITED_APPROVAL: "检测到 Unlimited Approval 请求",
  SUSPICIOUS_SPENDER: "检测到可疑 Spender / 地址特征",
  UNKNOWN_DAPP: "检测到来源未知的 DApp",
  HIGH_VALUE_REQUEST: "检测到大额 / 批量请求",
  SUSPICIOUS_SIGNATURE: "检测到签名内容异常",
  PERMIT_RISK: "检测到 Permit 签名风险",
  ABNORMAL_ASSET_MOVEMENT: "检测到异常资产流向",
};

/** 只对"业务事件里携带真实风险"的事件分类；SAFE 等级的事件不产生威胁检测（否则任何一步都会报警，失去信噪比）。 */
export function classifyEvent(event: SimulationEngineEvent): ThreatType | undefined {
  if (event.riskLevel === "SAFE") return undefined;
  const rule = CLASSIFY_RULES.find((r) => r.test(event));
  return rule?.type;
}

let detectionCounter = 0;

/** 把单个 SimulationEvent 转换为 0～1 条 ThreatDetection（不写入 store，纯函数，便于单测）。 */
export function detectThreatsFromEvent(
  simulationId: string,
  walletId: string | undefined,
  event: SimulationEngineEvent
): ThreatDetection[] {
  const type = classifyEvent(event);
  if (!type) return [];

  detectionCounter += 1;
  const detection: ThreatDetection = {
    id: `threat-${simulationId}-${detectionCounter}`,
    simulationId,
    walletId,
    type,
    severity: event.riskLevel,
    title: THREAT_TITLE[type],
    message: `${event.title}（组件：${event.component}）`,
    sourceEventId: event.id,
    sourceEventType: event.type,
    sourceStepIndex: event.stepIndex,
    detectedAt: event.timestamp,
  };
  return [detection];
}

/**
 * 扫描某次 simulation 当前的全部事件，只处理"自上次调用以来新增"的事件
 * （用 sequence 去重，幂等——重复调用不会产生重复检测），把新命中的威胁写入
 * store 并通知订阅者。events 长度变短（比如 resetSimulation 清空了事件）时，
 * 视为该次分析被重置，连带清空它已产生的威胁记录与处理进度。
 */
export function scanSimulation(simulationId: string): ThreatDetection[] {
  const state = getSimulationState(simulationId);

  const lastProcessed = store.getProcessedSequence(simulationId);
  if (state.events.length === 0 && lastProcessed >= 0) {
    store.clearSimulation(simulationId);
    return [];
  }

  const newEvents = state.events.filter((e) => e.sequence > lastProcessed);
  if (newEvents.length === 0) return [];

  const detections = newEvents.flatMap((event) => detectThreatsFromEvent(simulationId, state.walletId, event));
  for (const detection of detections) store.pushDetection(detection);
  store.setProcessedSequence(simulationId, newEvents[newEvents.length - 1].sequence);
  return detections;
}

/** 订阅某次 simulation：此后每次它的状态变化都会自动重新扫描、检测新威胁。返回取消订阅函数。 */
export function attachToSimulation(simulationId: string): Unsubscribe {
  return subscribeSimulation(simulationId, () => {
    scanSimulation(simulationId);
  });
}

export function getThreatsForSimulation(simulationId: string): ThreatDetection[] {
  return store.listBySimulation(simulationId);
}

export function getAllThreats(): ThreatDetection[] {
  return store.listAll();
}

export function subscribeThreats(listener: ThreatListener): Unsubscribe {
  return store.onThreatDetected(listener);
}

export function resetThreats(simulationId: string): void {
  store.clearSimulation(simulationId);
}
