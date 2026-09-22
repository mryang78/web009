// ---------------------------------------------------------------------------
// Event Engine —— Simulation Event 的唯一构造入口
//
// 只负责"如何生成一个结构正确、可追溯的事件对象"，不持有任何状态、不做
// 状态机判断（那是 simulation-store.ts 的职责）。保持纯函数，方便单测。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import type { SimulationEngineEvent, SimulationEventType } from "./simulation-types";

/** 生命周期事件（非攻击链步骤触发）默认标题，供 simulation-store 复用。 */
export const LIFECYCLE_EVENT_TITLES: Record<
  Extract<
    SimulationEventType,
    | "SIMULATION_INITIALIZED"
    | "SIMULATION_PAUSED"
    | "SIMULATION_RESUMED"
    | "SIMULATION_RESET"
    | "SIMULATION_COMPLETED"
    | "SIMULATION_FAILED"
  >,
  string
> = {
  SIMULATION_INITIALIZED: "实时分析已初始化",
  SIMULATION_PAUSED: "分析已暂停",
  SIMULATION_RESUMED: "分析已恢复",
  SIMULATION_RESET: "分析已重置",
  SIMULATION_COMPLETED: "分析任务结束",
  SIMULATION_FAILED: "分析任务异常终止",
};

let eventCounter = 0;

/** 生成一个确定性递增的事件 id（同一进程内单调唯一，不依赖 Math.random）。 */
function nextEventId(simulationId: string, sequence: number): string {
  eventCounter += 1;
  return `${simulationId}-evt-${sequence}-${eventCounter}`;
}

export interface CreateEventInput {
  simulationId: string;
  sequence: number;
  type: SimulationEventType;
  title: string;
  stepIndex: number;
  component: string;
  riskLevel: RiskLevel;
  timestamp: string;
}

/** 构造一个 Simulation Event —— 全站唯一的事件对象构造入口。 */
export function createSimulationEvent(input: CreateEventInput): SimulationEngineEvent {
  return {
    id: nextEventId(input.simulationId, input.sequence),
    simulationId: input.simulationId,
    sequence: input.sequence,
    type: input.type,
    title: input.title,
    stepIndex: input.stepIndex,
    component: input.component,
    riskLevel: input.riskLevel,
    timestamp: input.timestamp,
  };
}

/** 构造一个引擎生命周期事件（暂停/恢复/重置/完成/异常），stepIndex 固定为 -1。 */
export function createLifecycleEvent(
  simulationId: string,
  sequence: number,
  type: keyof typeof LIFECYCLE_EVENT_TITLES,
  riskLevel: RiskLevel,
  timestamp: string
): SimulationEngineEvent {
  return createSimulationEvent({
    simulationId,
    sequence,
    type,
    title: LIFECYCLE_EVENT_TITLES[type],
    stepIndex: -1,
    component: "Simulation Engine",
    riskLevel,
    timestamp,
  });
}
