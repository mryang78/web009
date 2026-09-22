// ---------------------------------------------------------------------------
// Alert Store —— 按 simulationId 索引的告警存储 + 发布订阅
// ---------------------------------------------------------------------------

import type { AlertListener, AlertRecord, Unsubscribe } from "./alert-types";

const alertsBySimulation = new Map<string, AlertRecord[]>();
const listeners = new Set<AlertListener>();

// React 的 useSyncExternalStore 要求：只要底层数据没变，getSnapshot() 必须
// 返回同一个引用；否则每次渲染都会拿到一个"看起来不同"的新数组，触发
// "Maximum update depth exceeded"（无限重渲染）。所以 listAll() 的结果要缓存，
// 只在 pushAlert / clearSimulation 真正改变数据时才失效重建。
let cachedAll: AlertRecord[] | null = null;

export function listBySimulation(simulationId: string): AlertRecord[] {
  return [...(alertsBySimulation.get(simulationId) ?? [])];
}

export function listAll(): AlertRecord[] {
  if (!cachedAll) cachedAll = [...alertsBySimulation.values()].flat();
  return cachedAll;
}

export function pushAlert(alert: AlertRecord): void {
  const list = alertsBySimulation.get(alert.simulationId) ?? [];
  list.push(alert);
  alertsBySimulation.set(alert.simulationId, list);
  cachedAll = null;
  for (const listener of listeners) listener(alert);
}

export function clearSimulation(simulationId: string): void {
  alertsBySimulation.delete(simulationId);
  cachedAll = null;
}

export function onAlertCreated(listener: AlertListener): Unsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 测试 / 调试用：清空全部告警（生产代码不应调用）。不清空 listeners —— 理由同 wallet-store.ts。 */
export function __resetAlertStoreForTests(): void {
  alertsBySimulation.clear();
  cachedAll = null;
}
