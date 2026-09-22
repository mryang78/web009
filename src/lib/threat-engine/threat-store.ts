// ---------------------------------------------------------------------------
// Threat Store —— 按 simulationId 索引的检测结果存储 + 发布订阅
// ---------------------------------------------------------------------------

import type { ThreatDetection, ThreatListener, Unsubscribe } from "./threat-types";

const detectionsBySimulation = new Map<string, ThreatDetection[]>();
/** 每个 simulation 已经处理到的 SimulationEvent.sequence（避免重复检测同一个事件）。 */
const processedSequence = new Map<string, number>();
const listeners = new Set<ThreatListener>();

export function listBySimulation(simulationId: string): ThreatDetection[] {
  return [...(detectionsBySimulation.get(simulationId) ?? [])];
}

export function listAll(): ThreatDetection[] {
  return [...detectionsBySimulation.values()].flat();
}

export function pushDetection(detection: ThreatDetection): void {
  const list = detectionsBySimulation.get(detection.simulationId) ?? [];
  list.push(detection);
  detectionsBySimulation.set(detection.simulationId, list);
  for (const listener of listeners) listener(detection);
}

export function getProcessedSequence(simulationId: string): number {
  return processedSequence.get(simulationId) ?? -1;
}

export function setProcessedSequence(simulationId: string, sequence: number): void {
  processedSequence.set(simulationId, sequence);
}

export function clearSimulation(simulationId: string): void {
  detectionsBySimulation.delete(simulationId);
  processedSequence.delete(simulationId);
}

export function onThreatDetected(listener: ThreatListener): Unsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 测试 / 调试用：清空全部检测结果与订阅进度（生产代码不应调用）。不清空 listeners —— 理由同 wallet-store.ts。 */
export function __resetThreatStoreForTests(): void {
  detectionsBySimulation.clear();
  processedSequence.clear();
}
