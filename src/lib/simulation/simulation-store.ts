// ---------------------------------------------------------------------------
// Simulation Store —— 真正持有状态的地方
//
// 一个进程内内存态的、按 simulationId 索引的状态表 + 发布订阅通道。这是
// "真实状态变化"的落地点：每次状态更新都是对这张表里某一条记录的一次真实
// 替换（不可变更新，返回新对象），并同步通知所有订阅者；不存在"计时器driven
// 的假进度条"这种东西 —— 状态什么时候变、变成什么样，完全由调用方通过
// simulation-engine.ts 暴露的动作函数决定。
//
// 本文件只做存储 + 订阅，不包含任何业务规则（业务规则在 scenario-engine.ts /
// event-engine.ts / simulation-engine.ts）。
// ---------------------------------------------------------------------------

import type { SimulationEngineState, SimulationListener, Unsubscribe } from "./simulation-types";

const store = new Map<string, SimulationEngineState>();
const listeners = new Map<string, Set<SimulationListener>>();

/** 深拷贝一份快照，防止调用方拿到内部可变引用后绕过引擎直接篡改状态。 */
function snapshot(state: SimulationEngineState): SimulationEngineState {
  return {
    ...state,
    events: state.events.map((e) => ({ ...e })),
  };
}

export function hasSimulation(id: string): boolean {
  return store.has(id);
}

export function readState(id: string): SimulationEngineState | undefined {
  const state = store.get(id);
  return state ? snapshot(state) : undefined;
}

export function requireState(id: string): SimulationEngineState {
  const state = store.get(id);
  if (!state) {
    throw new Error(`[simulation-engine] 未找到 simulation id="${id}"，请先调用 createSimulation()`);
  }
  return state;
}

/** 写入一条全新状态（createSimulation 用）。 */
export function putState(state: SimulationEngineState): SimulationEngineState {
  store.set(state.id, state);
  notify(state.id);
  return snapshot(state);
}

/** 用一个纯函数对现有状态做不可变更新，写回并通知订阅者，返回更新后的快照。 */
export function updateState(
  id: string,
  updater: (current: SimulationEngineState) => SimulationEngineState
): SimulationEngineState {
  const current = requireState(id);
  const next = updater(current);
  store.set(id, next);
  notify(id);
  return snapshot(next);
}

/** 列出当前进程内全部分析任务的快照——供 Dashboard 等"聚合统计"场景使用，不暴露内部可变引用。 */
export function listAllStates(): SimulationEngineState[] {
  return [...store.values()].map(snapshot);
}

export function subscribe(id: string, listener: SimulationListener): Unsubscribe {
  if (!listeners.has(id)) listeners.set(id, new Set());
  const set = listeners.get(id)!;
  set.add(listener);

  // 订阅时立即推送一次当前状态（常见 pub-sub 惯例），如果该 simulation 已存在。
  const current = store.get(id);
  if (current) listener(snapshot(current));

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(id);
  };
}

function notify(id: string): void {
  const state = store.get(id);
  if (!state) return;
  const set = listeners.get(id);
  if (!set || set.size === 0) return;
  const frozen = snapshot(state);
  for (const listener of set) listener(frozen);
}

/** 测试 / 调试用：清空整个 store（生产代码不应调用）。 */
export function __resetStoreForTests(): void {
  store.clear();
  listeners.clear();
}
