// ---------------------------------------------------------------------------
// Scenario Engine —— 把静态的 AttackScenario 攻击链，解析为引擎可以逐步
// 推进的"步骤蓝图"序列
//
// @/lib/shared/entities.attackScenarios 里的每个 AttackChainStep 只描述"发生
// 了什么"（action/component/risk/status），没有说明它对应哪一类 Simulation
// Event。本文件把 component + status 的组合，确定性地映射为固定的事件类型
// 词汇表（DAPP_OPENED / APPROVAL_REQUESTED / … ），并推导整次分析的最终结局。
// 相同场景永远解析出相同的步骤蓝图，不含随机成分。
// ---------------------------------------------------------------------------

import { getAttackScenarioById } from "@/lib/shared/entities";
import type { AttackChainStep, AttackScenario, RiskLevel } from "@/lib/shared/types";
import type { SimulationEventType, SimulationStatus } from "./simulation-types";

export interface StepBlueprint {
  stepIndex: number;
  eventType: SimulationEventType;
  title: string;
  component: string;
  riskLevel: RiskLevel;
  /** 该步骤原始的 SimulationStatus（Simulated/Detected/Blocked/…），用于推导终态。 */
  chainStatus: AttackChainStep["status"];
}

/** component 关键词 → 事件类型的确定性映射。顺序即优先级（先匹配先命中）。 */
const COMPONENT_KEYWORD_RULES: Array<{ test: (component: string) => boolean; type: SimulationEventType }> = [
  { test: (c) => c === "Approval Engine", type: "APPROVAL_REQUESTED" },
  { test: (c) => c === "Permit Engine" || c === "Signature Engine", type: "SIGNATURE_REQUESTED" },
  { test: (c) => c === "Risk Engine", type: "THREAT_DETECTED" },
  { test: (c) => c === "Malicious Contract" || c === "Fund Flow Engine", type: "ASSET_MOVEMENT_SIMULATED" },
  { test: (c) => c === "Wallet Mock", type: "SIGNATURE_REQUESTED" },
  { test: (c) => c === "Fake DApp" || c === "Social Channel", type: "DAPP_OPENED" },
];

/**
 * 根据步骤在链路中的位置 + component + 该步骤的 status，确定性地解析出事件类型。
 *
 * 规则（按优先级）：
 * 1. 第一步永远是"发起接触"类事件（DAPP_OPENED / REQUEST_CREATED）。
 * 2. status 为 Blocked 的步骤永远是 PROTECTION_TRIGGERED（无论 component 是什么，
 *    "被拦截"这个事实本身就是防护触发）。
 * 3. Approval Engine：请求中 → APPROVAL_REQUESTED；已被检测 → APPROVAL_ANALYZED。
 * 4. Permit/Signature Engine：请求中 → SIGNATURE_REQUESTED；已被检测 → SIGNATURE_ANALYZED。
 * 5. 其余按 component 关键词表匹配，命中 Risk Engine 视为 THREAT_DETECTED。
 * 6. 都不命中则退化为 REQUEST_CREATED（通用"链路推进"事件）。
 */
function resolveEventType(step: AttackChainStep, stepIndex: number): SimulationEventType {
  if (stepIndex === 0) {
    return step.component === "Wallet Mock" ? "REQUEST_CREATED" : "DAPP_OPENED";
  }
  if (step.status === "Blocked") return "PROTECTION_TRIGGERED";

  if (step.component === "Approval Engine") {
    return step.status === "Detected" ? "APPROVAL_ANALYZED" : "APPROVAL_REQUESTED";
  }
  if (step.component === "Permit Engine" || step.component === "Signature Engine") {
    return step.status === "Detected" ? "SIGNATURE_ANALYZED" : "SIGNATURE_REQUESTED";
  }

  const rule = COMPONENT_KEYWORD_RULES.find((r) => r.test(step.component));
  return rule?.type ?? "REQUEST_CREATED";
}

/** 把一个 AttackScenario 解析为引擎可逐步推进的步骤蓝图数组。 */
export function buildStepBlueprints(scenario: AttackScenario): StepBlueprint[] {
  return scenario.chain.map((step, stepIndex) => ({
    stepIndex,
    eventType: resolveEventType(step, stepIndex),
    title: step.action,
    component: step.component,
    riskLevel: step.risk,
    chainStatus: step.status,
  }));
}

/** 根据攻击链最后一步的 SimulationStatus，推导整次分析任务的最终引擎状态。 */
export function resolveFinalStatus(lastStep: AttackChainStep): SimulationStatus {
  switch (lastStep.status) {
    case "Blocked":
      return "BLOCKED";
    case "Detected":
      return "DETECTED";
    case "Failed":
      return "FAILED";
    case "Simulated":
    case "Pending":
    default:
      return "COMPLETED";
  }
}

/** 查找场景，找不到则抛出明确错误（调用方应在 createSimulation 时校验一次）。 */
export function requireAttackScenario(scenarioId: string): AttackScenario {
  const scenario = getAttackScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`[simulation-engine] 未知的 attackScenarioId: "${scenarioId}"，请检查 @/lib/shared/entities.attackScenarios`);
  }
  return scenario;
}
