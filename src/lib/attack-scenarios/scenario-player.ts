// ---------------------------------------------------------------------------
// Scenario Player —— 全站统一的 "当前 Simulation State" 单例
//
// 纯分析安全研究平台：本模块不连接真实钱包、真实区块链、真实 RPC，不产生
// 真实签名或真实资产转移。它只是把已经建好的 Wallet / Asset / Approval /
// Signature / Simulation / Threat / Alert Engine 组合成一个"可逐步播放"的
// 控制器，并把当前播放状态放进一个模块级单例里。
//
// 为什么需要这个文件（而不是让每个页面各自调用 runFullAttack体验）：
//   - runFullAttack体验() 一次性跑完整条链路，产出一份最终 SecurityReport，
//     适合"历史记录/批量生成"，但不适合"Play / Pause / Restart / Replay /
//     1x / 2x / 4x"这种可以中途暂停、观察每一步事件的交互式播放。
//   - 需求要求"所有页面必须读取统一 Simulation State，不要再让不同页面维护
//     自己的独立分析数据"——JS 模块作用域的单例状态天然跨组件、跨路由
//     客户端导航保持不变，所以把"当前激活的分析"放在这里一份，Attack
//     Simulation / Attack Timeline / Attack Canvas / Asset Flow / Fund Flow
//     Graph / Transaction Intelligence / Simulation Report / Attack Chain /
//     SOC Dashboard 等所有页面都只读它、订阅它，不再各自 new 一份状态。
//
// 播放节奏完全由本文件里的 setInterval 决定（对应 UI 的 Play/Pause/1x/2x/4x
// 需求），但每一步真实调用的都是底层 Simulation Engine 的 advanceStep()
// （真实状态机转换，不是伪造进度百分比），事件产生后再据其类型调用
// Approval/Signature/Asset Engine 已经暴露的 Mock 动作函数——结构上不存在
// 能触发真实交易的代码路径。
// ---------------------------------------------------------------------------

import { getDAppById } from "@/lib/shared/entities";
import type { SignatureType } from "@/lib/shared/types";
import { createMockWallet, getWalletState, selectMockWallet, type WalletEngineState } from "@/lib/wallet-engine";
import {
  calculateProjectedLoss,
  createMockAssetMovement,
  getAssets,
  getBalance,
  type MockAssetMovementRecord,
} from "@/lib/asset-engine";
import { analyzeApproval, blockApproval, requestApproval, simulateApproval, type ApprovalRecordState } from "@/lib/approval-engine";
import { analyzeSignature, createSignatureRequest, simulateSignature, type SignatureRecordState } from "@/lib/signature-engine";
import {
  advanceStep,
  createSimulation,
  getSimulationState,
  pauseSimulation,
  resetSimulation,
  resumeSimulation,
  startSimulation,
  subscribeSimulation,
  TERMINAL_STATUSES,
  type SimulationEngineEvent,
  type SimulationEngineState,
  type SimulationEventType,
  type Unsubscribe,
} from "@/lib/simulation";
import { attachToSimulation, getThreatsForSimulation, type ThreatDetection } from "@/lib/threat-engine";
import { getAlertsForSimulation, type AlertRecord } from "@/lib/alert-engine";
import { requireScenario } from "./attack-scenario-library";
import type { AttackScenario } from "./attack-scenario-types";

/** 事件类型 → 需求里要求展示的英文标签（Attack Timeline 用它渲染，不再依赖静态 timelineTemplate）。 */
export const SIMULATION_EVENT_LABEL: Record<SimulationEventType, string> = {
  DAPP_OPENED: "DApp Opened",
  REQUEST_CREATED: "Request Created",
  APPROVAL_REQUESTED: "Approval Requested",
  APPROVAL_ANALYZED: "Approval Analyzed",
  SIGNATURE_REQUESTED: "Signature Requested",
  SIGNATURE_ANALYZED: "Signature Analyzed",
  THREAT_DETECTED: "Threat Detected",
  ASSET_MOVEMENT_SIMULATED: "Asset Movement Simulated",
  PROTECTION_TRIGGERED: "Protection Triggered",
  SIMULATION_INITIALIZED: "Simulation Initialized",
  SIMULATION_PAUSED: "Simulation Paused",
  SIMULATION_RESUMED: "Simulation Resumed",
  SIMULATION_RESET: "Simulation Reset",
  SIMULATION_COMPLETED: "Simulation Completed",
  SIMULATION_FAILED: "Simulation Failed",
};

export const PLAYBACK_SPEEDS = [1, 2, 4] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

const BASE_TICK_MS = 900;

export interface ScenarioPlayerSnapshot {
  scenario: AttackScenario;
  simulation: SimulationEngineState;
  wallet: WalletEngineState;
  approval?: ApprovalRecordState;
  signature?: SignatureRecordState;
  assetMovement?: MockAssetMovementRecord;
  threats: ThreatDetection[];
  alerts: AlertRecord[];
  projectedLossUsd: number;
  playing: boolean;
  speed: PlaybackSpeed;
  /** 结构性写死——与 runFullAttack体验() 的 SecurityReport.safety 同一份约束。 */
  safety: { actualLoss: 0; transactionStatus: "NOT EXECUTED"; blockchainStatus: "NOT CONNECTED" };
}

interface PlayerRuntime {
  simulationId: string;
  scenario: AttackScenario;
  walletId: string;
  primaryTokenId?: string;
  speed: PlaybackSpeed;
  timer: ReturnType<typeof setInterval> | null;
  lastProcessedSequence: number;
  unsubscribeSim: Unsubscribe;
  unsubscribeThreat: Unsubscribe;
  approval?: ApprovalRecordState;
  signature?: SignatureRecordState;
  assetMovement?: MockAssetMovementRecord;
}

let runtime: PlayerRuntime | null = null;
let cachedSnapshot: ScenarioPlayerSnapshot | null = null;
const listeners = new Set<() => void>();
let playCounter = 0;

function resolveSpenderAddress(dappId: string | undefined, walletId: string): string {
  const dapp = dappId ? getDAppById(dappId) : undefined;
  return dapp?.contractAddress ?? `0xSPEND-PROTOCOL${walletId.toUpperCase()}`;
}

function buildSnapshot(): ScenarioPlayerSnapshot | null {
  if (!runtime) return null;
  const simulation = getSimulationState(runtime.simulationId);
  const wallet = getWalletState(runtime.walletId);
  const threats = getThreatsForSimulation(runtime.simulationId);
  const alerts = getAlertsForSimulation(runtime.simulationId);
  const projectedLossUsd = runtime.primaryTokenId
    ? calculateProjectedLoss({ walletId: runtime.walletId, tokenId: runtime.primaryTokenId, riskLevel: simulation.riskLevel })
    : calculateProjectedLoss({ walletId: runtime.walletId, riskLevel: simulation.riskLevel });

  return {
    scenario: runtime.scenario,
    simulation,
    wallet,
    approval: runtime.approval,
    signature: runtime.signature,
    assetMovement: runtime.assetMovement,
    threats,
    alerts,
    projectedLossUsd,
    playing: runtime.timer !== null,
    speed: runtime.speed,
    safety: { actualLoss: 0, transactionStatus: "NOT EXECUTED", blockchainStatus: "NOT CONNECTED" },
  };
}

function refreshSnapshot(): void {
  cachedSnapshot = buildSnapshot();
  for (const listener of listeners) listener();
}

/** 处理单个新产生的 Simulation Event：命中对应 component 时，驱动 Approval/Signature/Asset Engine 产生一次真实（实时分析）动作。 */
function reactToEvent(event: SimulationEngineEvent): void {
  if (!runtime) return;
  const { scenario, walletId, primaryTokenId, simulationId } = runtime;

  const isApprovalComponent = event.component === "Approval Engine";
  const isSignatureComponent = event.component === "Permit Engine" || event.component === "Signature Engine";
  const isAssetMovement = event.type === "ASSET_MOVEMENT_SIMULATED";

  if (isApprovalComponent && !runtime.approval && primaryTokenId) {
    const wantsUnlimited =
      scenario.category === "Malicious Approval" || scenario.detectionRules.some((r) => r.threatType === "UNLIMITED_APPROVAL");
    let approval = requestApproval({
      walletId,
      tokenId: primaryTokenId,
      dappId: scenario.initialState.dappId,
      spenderAddress: resolveSpenderAddress(scenario.initialState.dappId, walletId),
      requestedAmount: wantsUnlimited ? "Unlimited (2^256-1)" : "50000",
      simulationId,
    });
    approval = simulateApproval(approval.id);
    approval = analyzeApproval(approval.id);
    if (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL") {
      approval = blockApproval(approval.id);
    }
    runtime.approval = approval;
  }

  if (isSignatureComponent && !runtime.signature) {
    const wantsPermit = scenario.name === "Permit Abuse" || scenario.detectionRules.some((r) => r.threatType === "PERMIT_RISK");
    const type: SignatureType = wantsPermit ? "Permit (EIP-2612)" : "Typed Data (EIP-712)";
    let signature = createSignatureRequest({
      walletId,
      dappId: scenario.initialState.dappId,
      type,
      payloadSummary: `${scenario.name} 场景测试签名请求（Mock，不产生真实签名，也不会被广播）`,
      simulationId,
    });
    signature = analyzeSignature(signature.id);
    signature = simulateSignature(signature.id);
    runtime.signature = signature;
  }

  if (isAssetMovement && primaryTokenId && !runtime.assetMovement) {
    runtime.assetMovement = createMockAssetMovement({
      walletId,
      tokenId: primaryTokenId,
      amount: getBalance(walletId, primaryTokenId),
      destinationAddress: resolveSpenderAddress(scenario.initialState.dappId, walletId),
      riskLevel: getSimulationState(simulationId).riskLevel,
      simulationId,
    });
  }
}

function onSimulationChanged(state: SimulationEngineState): void {
  if (!runtime) return;

  if (state.events.length === 0 && runtime.lastProcessedSequence >= 0) {
    // resetSimulation() 清空了事件流：连带清空本地累积的 Approval/Signature/Asset 引用。
    runtime.approval = undefined;
    runtime.signature = undefined;
    runtime.assetMovement = undefined;
    runtime.lastProcessedSequence = -1;
    refreshSnapshot();
    return;
  }

  const newEvents = state.events.filter((e) => e.sequence > runtime!.lastProcessedSequence);
  for (const event of newEvents) reactToEvent(event);
  if (newEvents.length > 0) {
    runtime.lastProcessedSequence = newEvents[newEvents.length - 1].sequence;
  }
  refreshSnapshot();
}

function stopTimer(): void {
  if (runtime?.timer) {
    clearInterval(runtime.timer);
    runtime.timer = null;
  }
}

function tickOnce(): void {
  if (!runtime) return;
  const state = getSimulationState(runtime.simulationId);
  if (state.status !== "RUNNING") {
    stopTimer();
    refreshSnapshot();
    return;
  }
  const next = advanceStep(runtime.simulationId);
  if (TERMINAL_STATUSES.includes(next.status)) {
    stopTimer();
  }
}

/** 创建（或替换）当前激活的分析，状态为 IDLE，尚未开始播放。所有页面此后读到的都是这一个实例。 */
export function startScenario(scenarioId: string, walletId?: string): ScenarioPlayerSnapshot {
  stopTimer();
  runtime?.unsubscribeSim();
  runtime?.unsubscribeThreat();

  const scenario = requireScenario(scenarioId);
  const wallet = walletId
    ? getWalletState(walletId)
    : createMockWallet({ label: scenario.initialState.walletLabel, network: scenario.initialState.network });
  selectMockWallet(wallet.id);

  const holdings = getAssets(wallet.id);
  const primaryTokenId = holdings.find((h) => scenario.initialState.tokenIds.includes(h.tokenId))?.tokenId ?? holdings[0]?.tokenId;

  playCounter += 1;
  const simulation = createSimulation({
    id: `player-${scenario.id}-${playCounter}`,
    scenarioId: scenario.linkedAttackScenarioId,
    walletId: wallet.id,
    dappId: scenario.initialState.dappId,
    tokenId: primaryTokenId,
  });

  const unsubscribeThreat = attachToSimulation(simulation.id);
  const unsubscribeSim = subscribeSimulation(simulation.id, onSimulationChanged);

  runtime = {
    simulationId: simulation.id,
    scenario,
    walletId: wallet.id,
    primaryTokenId,
    speed: runtime?.speed ?? 1,
    timer: null,
    lastProcessedSequence: -1,
    unsubscribeSim,
    unsubscribeThreat,
  };

  refreshSnapshot();
  return cachedSnapshot!;
}

/** Play：IDLE → 开始播放；PAUSED → 恢复播放；已在播放则维持不变。没有激活的场景时是无操作。 */
export function play(): ScenarioPlayerSnapshot | null {
  if (!runtime) return null;
  const state = getSimulationState(runtime.simulationId);
  if (state.status === "IDLE") startSimulation(runtime.simulationId);
  else if (state.status === "PAUSED") resumeSimulation(runtime.simulationId);

  const after = getSimulationState(runtime.simulationId);
  if (!TERMINAL_STATUSES.includes(after.status)) {
    stopTimer();
    runtime.timer = setInterval(tickOnce, BASE_TICK_MS / runtime.speed);
  }
  refreshSnapshot();
  return cachedSnapshot;
}

/** Pause：停止本地播放定时器，并把底层状态机真实置为 PAUSED（RUNNING 时才有意义）。 */
export function pause(): ScenarioPlayerSnapshot | null {
  if (!runtime) return null;
  stopTimer();
  const state = getSimulationState(runtime.simulationId);
  if (state.status === "RUNNING") pauseSimulation(runtime.simulationId);
  refreshSnapshot();
  return cachedSnapshot;
}

/** Restart：回到第 0 步之前（IDLE），清空本地 Approval/Signature/Asset 引用，不自动播放。 */
export function restart(): ScenarioPlayerSnapshot | null {
  if (!runtime) return null;
  stopTimer();
  resetSimulation(runtime.simulationId);
  refreshSnapshot();
  return cachedSnapshot;
}

/** Replay：Restart 之后立即 Play，从头完整重新播放一遍。 */
export function replay(): ScenarioPlayerSnapshot | null {
  restart();
  return play();
}

export function setSpeed(speed: PlaybackSpeed): ScenarioPlayerSnapshot | null {
  if (!runtime) return null;
  runtime.speed = speed;
  if (runtime.timer) {
    stopTimer();
    runtime.timer = setInterval(tickOnce, BASE_TICK_MS / speed);
  }
  refreshSnapshot();
  return cachedSnapshot;
}

export function getSnapshot(): ScenarioPlayerSnapshot | null {
  return cachedSnapshot;
}

/** React useSyncExternalStore 兼容：只注册"发生变化"回调，不在订阅时立即回放当前值。 */
export function subscribe(listener: () => void): Unsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
