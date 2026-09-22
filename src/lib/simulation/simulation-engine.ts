// ---------------------------------------------------------------------------
// Simulation Engine —— 对外暴露的统一入口
//
// 把 simulation-store（状态存储 + 发布订阅）、scenario-engine（攻击场景 →
// 步骤蓝图）、event-engine（事件对象构造）组合成一套完整的、真实状态机驱动的
// 分析任务引擎。
//
// 关键设计原则（对应任务要求"必须具有真实的状态变化，而不是单纯使用
// setTimeout 播放假进度"）：
//   1. 引擎内部不含任何 setTimeout / setInterval / requestAnimationFrame。
//      状态什么时候变化、变成什么样，100% 由调用方显式调用下面的动作函数决定。
//      未来的 UI 如果想要"逐步播放"的观感，自己在外部用定时器反复调用
//      advanceStep()——引擎的正确性不依赖、也不感知任何时间调度。
//   2. 每一次状态变化都是对 store 里那条记录的一次不可变替换 + 真实的订阅
//      通知（simulation-store.ts），不是简单地把一个百分比数字往上加。
//   3. 每一步业务动作、每一次生命周期转换，都会产生一条结构化、可追溯、带
//      因果关系（对应哪个攻击链步骤 / 哪个 component）的 SimulationEvent，
//      而不是只更新一个 status 字段。
//   4. 非法的状态转换（例如对 IDLE 的分析调用 advanceStep）会直接抛出错误，
//      而不是静默忽略——状态机的边界是显式的。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import { createLifecycleEvent, createSimulationEvent } from "./event-engine";
import { buildStepBlueprints, requireAttackScenario, resolveFinalStatus } from "./scenario-engine";
import * as store from "./simulation-store";
import type {
  CreateSimulationInput,
  SimulationEngineState,
  SimulationListener,
  SimulationStatus,
  Unsubscribe,
} from "./simulation-types";
import { TERMINAL_STATUSES } from "./simulation-types";

let idCounter = 0;

function nextSimulationId(scenarioId: string): string {
  idCounter += 1;
  return `sim-${scenarioId}-${idCounter}`;
}

/** RiskLevel → 数值评分的唯一换算，供"实时风险评分随步骤推进变化"使用。 */
const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  SAFE: 5,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 95,
};

function assertStatus(state: SimulationEngineState, allowed: SimulationStatus[], action: string): void {
  if (!allowed.includes(state.status)) {
    throw new Error(
      `[simulation-engine] 无法在状态 "${state.status}" 下执行 ${action}()；允许的状态为 [${allowed.join(", ")}]。`
    );
  }
}

/** 创建一次新的分析任务（状态为 IDLE，尚未产生任何事件）。 */
export function createSimulation(input: CreateSimulationInput): SimulationEngineState {
  const scenario = requireAttackScenario(input.scenarioId);
  const id = input.id ?? nextSimulationId(input.scenarioId);
  if (store.hasSimulation(id)) {
    throw new Error(`[simulation-engine] simulation id="${id}" 已存在，请使用其他 id 或先 resetSimulation()`);
  }

  const state: SimulationEngineState = {
    id,
    scenarioId: scenario.id,
    walletId: input.walletId,
    dappId: input.dappId,
    tokenId: input.tokenId,
    status: "IDLE",
    currentStepIndex: -1,
    totalSteps: scenario.chain.length,
    riskScore: 0,
    riskLevel: "SAFE",
    events: [],
    createdAt: new Date().toISOString(),
  };

  return store.putState(state);
}

/** IDLE → INITIALIZING → RUNNING。两次真实的状态转换与通知，不是同一次写入伪装成两步。 */
export function startSimulation(id: string): SimulationEngineState {
  const initial = store.requireState(id);
  assertStatus(initial, ["IDLE"], "startSimulation");
  const timestamp = new Date().toISOString();

  store.updateState(id, (current) => ({
    ...current,
    status: "INITIALIZING",
    startedAt: timestamp,
    events: [...current.events, createLifecycleEvent(id, current.events.length, "SIMULATION_INITIALIZED", "SAFE", timestamp)],
  }));

  return store.updateState(id, (current) => ({
    ...current,
    status: "RUNNING",
  }));
}

/** RUNNING → PAUSED。 */
export function pauseSimulation(id: string): SimulationEngineState {
  const current = store.requireState(id);
  assertStatus(current, ["RUNNING"], "pauseSimulation");
  const timestamp = new Date().toISOString();

  return store.updateState(id, (state) => ({
    ...state,
    status: "PAUSED",
    pausedAt: timestamp,
    events: [...state.events, createLifecycleEvent(id, state.events.length, "SIMULATION_PAUSED", state.riskLevel, timestamp)],
  }));
}

/** PAUSED → RUNNING。 */
export function resumeSimulation(id: string): SimulationEngineState {
  const current = store.requireState(id);
  assertStatus(current, ["PAUSED"], "resumeSimulation");
  const timestamp = new Date().toISOString();

  return store.updateState(id, (state) => ({
    ...state,
    status: "RUNNING",
    pausedAt: undefined,
    events: [...state.events, createLifecycleEvent(id, state.events.length, "SIMULATION_RESUMED", state.riskLevel, timestamp)],
  }));
}

/** 任意状态 → IDLE，清空事件与进度，可重新 startSimulation()。 */
export function resetSimulation(id: string): SimulationEngineState {
  store.requireState(id); // 校验存在
  return store.updateState(id, (state) => ({
    ...state,
    status: "IDLE",
    currentStepIndex: -1,
    riskScore: 0,
    riskLevel: "SAFE",
    events: [],
    startedAt: undefined,
    pausedAt: undefined,
    completedAt: undefined,
  }));
}

/**
 * 把分析推进恰好一步：产生该步骤真实对应的 SimulationEvent，更新
 * currentStepIndex / riskScore / riskLevel；如果这是攻击链的最后一步，
 * 额外推导终态（BLOCKED / DETECTED / COMPLETED / FAILED）并写入
 * SIMULATION_COMPLETED 事件。只能在 RUNNING 状态下调用。
 */
export function advanceStep(id: string): SimulationEngineState {
  const current = store.requireState(id);
  assertStatus(current, ["RUNNING"], "advanceStep");

  const scenario = requireAttackScenario(current.scenarioId);
  const blueprints = buildStepBlueprints(scenario);
  const nextIndex = current.currentStepIndex + 1;

  if (nextIndex >= blueprints.length) {
    throw new Error(`[simulation-engine] simulation "${id}" 已经没有更多步骤可以推进`);
  }

  const blueprint = blueprints[nextIndex];
  const timestamp = new Date().toISOString();
  const isLastStep = nextIndex === blueprints.length - 1;

  return store.updateState(id, (state) => {
    const stepEvent = createSimulationEvent({
      simulationId: id,
      sequence: state.events.length,
      type: blueprint.eventType,
      title: blueprint.title,
      stepIndex: nextIndex,
      component: blueprint.component,
      riskLevel: blueprint.riskLevel,
      timestamp,
    });

    const events = [...state.events, stepEvent];
    let status: SimulationStatus = "RUNNING";
    let completedAt = state.completedAt;

    if (isLastStep) {
      status = resolveFinalStatus(scenario.chain[nextIndex]);
      completedAt = timestamp;
      events.push(createLifecycleEvent(id, events.length, "SIMULATION_COMPLETED", blueprint.riskLevel, timestamp));
    }

    return {
      ...state,
      status,
      currentStepIndex: nextIndex,
      riskScore: RISK_LEVEL_SCORE[blueprint.riskLevel],
      riskLevel: blueprint.riskLevel,
      events,
      completedAt,
    };
  });
}

/**
 * 一次性把分析推进到底：从当前状态开始（IDLE 会自动 startSimulation()，
 * PAUSED 会自动 resumeSimulation()）反复调用 advanceStep() 直到进入终态。
 * 用于批量生成"历史分析记录"等不需要逐步播放的场景。已处于终态时直接
 * 幂等返回当前状态。
 */
export function completeSimulation(id: string): SimulationEngineState {
  let state = store.requireState(id);

  if (TERMINAL_STATUSES.includes(state.status)) {
    return state;
  }
  if (state.status === "IDLE") {
    state = startSimulation(id);
  }
  if (state.status === "PAUSED") {
    state = resumeSimulation(id);
  }

  while (state.status === "RUNNING") {
    state = advanceStep(id);
  }
  return state;
}

/** 读取当前状态快照（只读拷贝，不会暴露内部可变引用）。 */
export function getSimulationState(id: string): SimulationEngineState {
  return store.requireState(id);
}

/** 列出当前进程内全部分析任务——供 Dashboard 等聚合统计场景读取真实的"进行中分析数"，不再是页面自己编一个数字。 */
export function getAllSimulations(): SimulationEngineState[] {
  return store.listAllStates();
}

/**
 * 订阅某次分析的状态变化。订阅时会立即收到一次当前状态（如果该分析已存在），
 * 此后每次真实的状态转换都会推送一次——不是轮询，是事件驱动的真实推送。
 * 返回取消订阅函数。
 */
export function subscribeSimulation(id: string, listener: SimulationListener): Unsubscribe {
  return store.subscribe(id, listener);
}

