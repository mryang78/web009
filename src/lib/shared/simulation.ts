// ---------------------------------------------------------------------------
// 统一 Simulation Run / Simulation Event 模型
//
// 此前"资产提取分析""攻击链分析""钱包安全分析"等至少 4 处相互独立地实现了
// 同一种模式："一组步骤 + 定时器逐步推进 + 结果判定"。这里把该模式抽象为
// 一个与具体 UI 无关的纯数据模型 + 纯函数引擎，作为后续统一改造这些模块时
// 的共用基础（本次不改动任何现有页面 UI，仅提供这一层能力）。
//
// SimulationRun 同时也是 Attack 案例库（AttackScenario）与 SOC 数据之间
// 此前缺失的关联点：一次 SimulationRun 引用一个 attackScenarioId + 一个
// walletId，使"这次分析用的是哪种攻击手法、打在哪个 Mock 钱包上"变得可追溯。
// ---------------------------------------------------------------------------

import { mockTxHash, seededRandom } from "./prng";
import { riskLevelFromScore } from "./risk";
import { attackScenarios, getAttackScenarioById } from "./entities";
import type { RiskLevel, SimulationEvent, SimulationRun, SimulationRunStatus } from "./types";

/** 根据攻击场景 + 目标钱包，创建一次新的分析任务（未执行任何步骤）。 */
export function createSimulationRun(input: {
  id: string;
  attackScenarioId: string;
  walletId?: string;
  dappId?: string;
  tokenId?: string;
  destinationAddress: string;
  amountLabel: string;
  riskScore: number;
  startedAt: string;
}): SimulationRun {
  const rnd = seededRandom(input.id.length * 131 + input.riskScore);
  const riskLevel: RiskLevel = riskLevelFromScore(input.riskScore);
  return {
    id: input.id,
    attackScenarioId: input.attackScenarioId,
    walletId: input.walletId,
    dappId: input.dappId,
    tokenId: input.tokenId,
    destinationAddress: input.destinationAddress,
    txHash: mockTxHash(rnd),
    amountLabel: input.amountLabel,
    riskScore: input.riskScore,
    riskLevel,
    status: "running",
    startedAt: input.startedAt,
    events: [],
  };
}

/** 把某次运行推进到指定的攻击链步骤下标，返回新增的事件（纯函数，不修改入参）。 */
export function advanceSimulationRun(run: SimulationRun, stepIndex: number, timestamp: string): SimulationRun {
  const scenario = getAttackScenarioById(run.attackScenarioId);
  if (!scenario) return run;
  const step = scenario.chain[stepIndex];
  if (!step) return run;

  const event: SimulationEvent = {
    id: `${run.id}-evt-${stepIndex}`,
    runId: run.id,
    timestamp,
    stepIndex,
    title: step.action,
    riskLevel: step.risk,
    status: step.status,
  };

  const isLastStep = stepIndex === scenario.chain.length - 1;
  const status: SimulationRunStatus = isLastStep
    ? step.status === "Blocked"
      ? "blocked"
      : "completed"
    : "running";

  return {
    ...run,
    events: [...run.events, event],
    status,
    completedAt: isLastStep ? timestamp : run.completedAt,
  };
}

/**
 * 把一次运行完整推进到底（一次性生成全部事件），用于生成"历史分析记录"等
 * 不需要逐步播放的场景。
 */
export function completeSimulationRun(run: SimulationRun, timestamp: string): SimulationRun {
  const scenario = getAttackScenarioById(run.attackScenarioId);
  if (!scenario) return run;
  let next = run;
  scenario.chain.forEach((_, idx) => {
    next = advanceSimulationRun(next, idx, timestamp);
  });
  return next;
}

/**
 * 基于 8+2 个 canonical AttackScenario，为每一个生成一条"历史分析任务"预设，
 * 供 Attack 案例库 / SOC 态势看板复用同一份数据，替代此前互相独立维护的
 * simulation-data.ts scenarios 与 soc/mock.ts previousSimulations。
 */
export function buildSimulationRunPresets(): SimulationRun[] {
  return attackScenarios.map((scenario, idx) => {
    const rnd = seededRandom(idx * 401 + 7);
    const riskScore = Math.round(85 + rnd() * 14);
    const run = createSimulationRun({
      id: `run-${scenario.id}`,
      attackScenarioId: scenario.id,
      destinationAddress: `0xANAL...${(1000 + idx * 137).toString(16).toUpperCase()}`,
      amountLabel: "—",
      riskScore,
      startedAt: `分析记录 #${idx + 1}`,
    });
    return completeSimulationRun(run, run.startedAt);
  });
}
