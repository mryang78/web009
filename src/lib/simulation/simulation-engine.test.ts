// ---------------------------------------------------------------------------
// Simulation Engine —— 单元测试
//
// 覆盖真实状态机行为：合法/非法状态转换、事件的真实产生与顺序、
// 发布订阅的真实推送、reset 后可重新运行。全部基于
// @/lib/shared/entities.attackScenarios 中真实存在的场景数据，不使用任何
// mock 计时器（因为引擎本身就不依赖时间）。
// ---------------------------------------------------------------------------

import { beforeEach, describe, expect, it } from "vitest";
import {
  advanceStep,
  completeSimulation,
  createSimulation,
  getSimulationState,
  pauseSimulation,
  resetSimulation,
  resumeSimulation,
  startSimulation,
  subscribeSimulation,
} from "./simulation-engine";
import { __resetStoreForTests } from "./simulation-store";
import { getAttackScenarioById } from "@/lib/shared/entities";

const BLOCKED_SCENARIO_ID = "atk-unlimited-approval"; // 4 步，最后一步 status: Blocked
const DETECTED_SCENARIO_ID = "atk-address-poisoning"; // 3 步，最后一步 status: Detected

beforeEach(() => {
  __resetStoreForTests();
});

describe("createSimulation", () => {
  it("创建后状态为 IDLE，尚无事件，步骤数与场景攻击链长度一致", () => {
    const scenario = getAttackScenarioById(BLOCKED_SCENARIO_ID)!;
    const state = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID, walletId: "wallet-01" });

    expect(state.status).toBe("IDLE");
    expect(state.currentStepIndex).toBe(-1);
    expect(state.totalSteps).toBe(scenario.chain.length);
    expect(state.events).toHaveLength(0);
    expect(state.walletId).toBe("wallet-01");
  });

  it("未知 scenarioId 应该抛出明确错误，而不是静默生成空状态", () => {
    expect(() => createSimulation({ scenarioId: "atk-does-not-exist" })).toThrowError(/未知的 attackScenarioId/);
  });
});

describe("状态机合法性", () => {
  it("在 IDLE 状态下调用 advanceStep 必须抛出错误", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    expect(() => advanceStep(id)).toThrowError(/无法在状态 "IDLE"/);
  });

  it("在 RUNNING 状态下调用 startSimulation 必须抛出错误（不能重复启动）", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);
    expect(() => startSimulation(id)).toThrowError(/无法在状态 "RUNNING"/);
  });

  it("暂停后调用 advanceStep 必须抛出错误，必须先 resume", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);
    pauseSimulation(id);
    expect(() => advanceStep(id)).toThrowError(/无法在状态 "PAUSED"/);
  });

  it("非 RUNNING 状态下调用 pauseSimulation 必须抛出错误", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    expect(() => pauseSimulation(id)).toThrowError(/无法在状态 "IDLE"/);
  });
});

describe("startSimulation", () => {
  it("IDLE → INITIALIZING → RUNNING，并产生 SIMULATION_INITIALIZED 事件", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    const state = startSimulation(id);

    expect(state.status).toBe("RUNNING");
    expect(state.startedAt).toBeTruthy();
    expect(state.events).toHaveLength(1);
    expect(state.events[0].type).toBe("SIMULATION_INITIALIZED");
  });
});

describe("advanceStep —— 真实的逐步状态推进", () => {
  it("每次 advanceStep 都会让 currentStepIndex 真实前进，并追加一个真实的 SimulationEvent", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);

    const afterStep0 = advanceStep(id);
    expect(afterStep0.currentStepIndex).toBe(0);
    expect(afterStep0.status).toBe("RUNNING");
    // 事件 0 = SIMULATION_INITIALIZED，事件 1 = 第一步业务事件
    expect(afterStep0.events).toHaveLength(2);
    expect(afterStep0.events[1].stepIndex).toBe(0);

    const afterStep1 = advanceStep(id);
    expect(afterStep1.currentStepIndex).toBe(1);
    expect(afterStep1.events).toHaveLength(3);
  });

  it("走到攻击链最后一步（status: Blocked）时，引擎状态应变为 BLOCKED 并产生 SIMULATION_COMPLETED 事件", () => {
    const scenario = getAttackScenarioById(BLOCKED_SCENARIO_ID)!;
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);

    let state = getSimulationState(id);
    for (let i = 0; i < scenario.chain.length; i++) {
      state = advanceStep(id);
    }

    expect(state.status).toBe("BLOCKED");
    expect(state.currentStepIndex).toBe(scenario.chain.length - 1);
    expect(state.completedAt).toBeTruthy();
    const lastEvent = state.events[state.events.length - 1];
    expect(lastEvent.type).toBe("SIMULATION_COMPLETED");
  });

  it("走到最后一步（status: Detected）时，引擎状态应变为 DETECTED，而不是一律 BLOCKED", () => {
    const scenario = getAttackScenarioById(DETECTED_SCENARIO_ID)!;
    const { id } = createSimulation({ scenarioId: DETECTED_SCENARIO_ID });
    startSimulation(id);

    let state = getSimulationState(id);
    for (let i = 0; i < scenario.chain.length; i++) {
      state = advanceStep(id);
    }

    expect(state.status).toBe("DETECTED");
  });

  it("到达终态后再调用 advanceStep 必须抛出错误（不能超出步骤数）", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    completeSimulation(id);
    expect(() => advanceStep(id)).toThrowError(/无法在状态 "BLOCKED"/);
  });

  it("风险评分应随步骤推进真实变化（不是固定值），且与该步骤的 riskLevel 对应", () => {
    const scenario = getAttackScenarioById(BLOCKED_SCENARIO_ID)!;
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);

    const seenScores = new Set<number>();
    for (let i = 0; i < scenario.chain.length; i++) {
      const state = advanceStep(id);
      seenScores.add(state.riskScore);
      expect(state.riskLevel).toBe(scenario.chain[i].risk);
    }
    // 至少应该出现过不止一种评分（风险是逐步变化的，不是一路不变的假进度）
    expect(seenScores.size).toBeGreaterThan(1);
  });
});

describe("pauseSimulation / resumeSimulation", () => {
  it("暂停不会丢失已经产生的事件和进度，恢复后可以继续推进", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);
    advanceStep(id);
    const paused = pauseSimulation(id);

    expect(paused.status).toBe("PAUSED");
    expect(paused.currentStepIndex).toBe(0);
    expect(paused.pausedAt).toBeTruthy();

    const resumed = resumeSimulation(id);
    expect(resumed.status).toBe("RUNNING");

    const advanced = advanceStep(id);
    expect(advanced.currentStepIndex).toBe(1);
  });
});

describe("resetSimulation", () => {
  it("重置后回到 IDLE、清空事件与进度，并且可以重新 start", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    startSimulation(id);
    advanceStep(id);
    advanceStep(id);

    const reset = resetSimulation(id);
    expect(reset.status).toBe("IDLE");
    expect(reset.currentStepIndex).toBe(-1);
    expect(reset.events).toHaveLength(0);
    expect(reset.riskScore).toBe(0);

    const restarted = startSimulation(id);
    expect(restarted.status).toBe("RUNNING");
  });
});

describe("completeSimulation", () => {
  it("从 IDLE 直接一次性推进到终态", () => {
    const scenario = getAttackScenarioById(BLOCKED_SCENARIO_ID)!;
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });

    const finalState = completeSimulation(id);
    expect(finalState.status).toBe("BLOCKED");
    expect(finalState.currentStepIndex).toBe(scenario.chain.length - 1);
  });

  it("对已处于终态的分析再次调用是幂等的（直接返回当前状态，不报错）", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });
    const first = completeSimulation(id);
    const second = completeSimulation(id);
    expect(second.status).toBe(first.status);
    expect(second.events.length).toBe(first.events.length);
  });
});

describe("subscribeSimulation —— 真实的发布订阅，而不是轮询", () => {
  it("订阅时立即收到一次当前状态，后续每次真实状态变化都会推送", () => {
    const { id } = createSimulation({ scenarioId: BLOCKED_SCENARIO_ID });

    const received: string[] = [];
    const unsubscribe = subscribeSimulation(id, (state) => {
      received.push(state.status);
    });

    expect(received).toEqual(["IDLE"]);

    startSimulation(id);
    // startSimulation 内部是两次真实状态转换（INITIALIZING 然后 RUNNING），
    // 订阅者应该都能收到，而不是只看到最终结果。
    expect(received).toEqual(["IDLE", "INITIALIZING", "RUNNING"]);

    advanceStep(id);
    expect(received).toEqual(["IDLE", "INITIALIZING", "RUNNING", "RUNNING"]);

    unsubscribe();
    advanceStep(id);
    // 取消订阅后不应该再收到推送
    expect(received).toHaveLength(4);
  });
});
