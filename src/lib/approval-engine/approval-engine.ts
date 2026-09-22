// ---------------------------------------------------------------------------
// Approval Engine —— 对外暴露的统一入口
//
//   NONE ──requestApproval──▶ REQUESTED
//   REQUESTED/REVIEWING ──simulateApproval──▶ SIMULATED_APPROVED
//   REQUESTED/REVIEWING/SIMULATED_APPROVED ──analyzeApproval──▶
//       风险 HIGH/CRITICAL → HIGH_RISK
//       否则 → REVIEWING（若已 SIMULATED_APPROVED 则维持不变）
//   REQUESTED/REVIEWING/SIMULATED_APPROVED/HIGH_RISK ──blockApproval──▶ BLOCKED
//   SIMULATED_APPROVED/HIGH_RISK ──simulateRevoke──▶ REVOKED_SIMULATION
//
// "SIMULATED_APPROVED"刻意允许在被 analyzeApproval 判定为高风险之前就发生——
// 这是在还原真实世界的时序问题："用户可能已经在钱包里点了同意，安全引擎才
// 事后检测到风险"，随后 blockApproval() 分析"保护引擎依然可以在这之后拦截"。
//
// 所有状态变更只发生在 approval-store.ts 的内存 Map 里；不调用任何钱包 /
// RPC 接口，不产生真实的 approve() 链上交易。
// ---------------------------------------------------------------------------

import { assessApprovalRisk } from "@/lib/risk-engine/factors";
import type { RiskLevel } from "@/lib/shared/types";
import { getWalletState, subscribeApprovalsReset } from "@/lib/wallet-engine";
import * as store from "./approval-store";
import type { ApprovalEngineStatus, ApprovalRecordState, RequestApprovalInput } from "./approval-types";

function pushHistory(
  state: ApprovalRecordState,
  status: ApprovalEngineStatus,
  riskLevel: RiskLevel,
  note: string,
  timestamp: string
): ApprovalRecordState {
  return {
    ...state,
    status,
    riskLevel,
    updatedAt: timestamp,
    history: [...state.history, { status, riskLevel, note, timestamp }],
  };
}

function assertStatus(state: ApprovalRecordState, allowed: ApprovalEngineStatus[], action: string): void {
  if (!allowed.includes(state.status)) {
    throw new Error(
      `[approval-engine] 无法在状态 "${state.status}" 下执行 ${action}()；允许的状态为 [${allowed.join(", ")}]。`
    );
  }
}

/**
 * 根据请求额度 + DApp / Token 背景 + spender 地址特征，动态计算这次授权请求的
 * 风险等级——通过 Risk Engine 的具名因素（unlimitedAllowance / suspiciousSpender /
 * unknownDapp / largeValue / newContract / addressRisk / behaviorRisk 等）加权
 * 求和后归一化，不再是写死的固定分数或简单的 if/else 常量表。
 */
function assessRisk(input: { requestedAmount: string; dappId?: string; tokenId: string; spenderAddress: string }): RiskLevel {
  return assessApprovalRisk(input).level;
}

let approvalCounter = 0;

export function requestApproval(input: RequestApprovalInput): ApprovalRecordState {
  getWalletState(input.walletId); // 校验钱包存在，不存在则在这里抛出明确错误
  approvalCounter += 1;
  const id = input.id ?? `apr-${input.walletId}-${approvalCounter}`;
  if (store.hasApproval(id)) throw new Error(`[approval-engine] approval id="${id}" 已存在`);

  const timestamp = new Date().toISOString();
  const initial: ApprovalRecordState = {
    id,
    walletId: input.walletId,
    tokenId: input.tokenId,
    dappId: input.dappId,
    spenderAddress: input.spenderAddress,
    requestedAmount: input.requestedAmount,
    status: "REQUESTED",
    riskLevel: "SAFE",
    createdAt: timestamp,
    updatedAt: timestamp,
    history: [{ status: "REQUESTED", riskLevel: "SAFE", note: "DApp 发起授权请求（Mock，未产生真实链上调用）", timestamp }],
    simulationId: input.simulationId,
  };
  return store.putApproval(initial);
}

/** 分析"用户在 Mock 钱包里点击同意授权"这一步——不产生真实签名或链上交易。 */
export function simulateApproval(id: string): ApprovalRecordState {
  const current = store.requireApproval(id);
  assertStatus(current, ["REQUESTED", "REVIEWING"], "simulateApproval");
  const timestamp = new Date().toISOString();
  return store.updateApproval(id, (state) =>
    pushHistory(state, "SIMULATED_APPROVED", state.riskLevel, "已分析在 Mock 钱包中点击「同意授权」（未产生真实链上交易）", timestamp)
  );
}

/** 安全引擎对这次授权请求做风险分析；即使已经 SIMULATED_APPROVED，事后检测到高风险也会覆盖为 HIGH_RISK。 */
export function analyzeApproval(id: string): ApprovalRecordState {
  const current = store.requireApproval(id);
  assertStatus(current, ["REQUESTED", "REVIEWING", "SIMULATED_APPROVED"], "analyzeApproval");
  const timestamp = new Date().toISOString();
  const risk = assessRisk({
    requestedAmount: current.requestedAmount,
    dappId: current.dappId,
    tokenId: current.tokenId,
    spenderAddress: current.spenderAddress,
  });

  return store.updateApproval(id, (state) => {
    if (risk === "HIGH" || risk === "CRITICAL") {
      return pushHistory(state, "HIGH_RISK", risk, `安全引擎分析：检测到高风险授权特征（${risk}）`, timestamp);
    }
    const nextStatus: ApprovalEngineStatus = state.status === "SIMULATED_APPROVED" ? "SIMULATED_APPROVED" : "REVIEWING";
    return pushHistory(state, nextStatus, risk, `安全引擎分析：未发现高风险特征（${risk}）`, timestamp);
  });
}

/** 保护引擎主动拦截这次授权——无论用户是否已经"分析同意"过，都可以在最终生效前拦下。 */
export function blockApproval(id: string): ApprovalRecordState {
  const current = store.requireApproval(id);
  assertStatus(current, ["REQUESTED", "REVIEWING", "SIMULATED_APPROVED", "HIGH_RISK"], "blockApproval");
  const timestamp = new Date().toISOString();
  return store.updateApproval(id, (state) =>
    pushHistory(state, "BLOCKED", state.riskLevel, "保护引擎已拦截该授权（Mock，未产生真实链上效果）", timestamp)
  );
}

/** 分析撤销一个已经（分析）生效的授权。 */
export function simulateRevoke(id: string): ApprovalRecordState {
  const current = store.requireApproval(id);
  assertStatus(current, ["SIMULATED_APPROVED", "HIGH_RISK"], "simulateRevoke");
  const timestamp = new Date().toISOString();
  return store.updateApproval(id, (state) =>
    pushHistory(state, "REVOKED_SIMULATION", state.riskLevel, "已分析撤销该授权（Mock，未产生真实链上交易）", timestamp)
  );
}

export function getApprovalState(id: string): ApprovalRecordState {
  return store.requireApproval(id);
}

export function getApprovalsByWallet(walletId: string): ApprovalRecordState[] {
  return store.listByWallet(walletId);
}

export function getAllApprovals(): ApprovalRecordState[] {
  return store.listAll();
}

/** 订阅"授权记录集合发生了任何变化"——供任何展示全部授权记录列表的页面（SOC / Admin 共用同一份数据）实时刷新。 */
export function subscribeApprovals(listener: () => void): () => void {
  return store.onApprovalsChanged(listener);
}

/** 查询某个钱包 + token（+ 可选 dapp）当前最新的授权状态；没有任何记录时返回 "NONE"。 */
export function getApprovalStatusFor(walletId: string, tokenId: string, dappId?: string): ApprovalEngineStatus {
  const list = store
    .listByWallet(walletId)
    .filter((a) => a.tokenId === tokenId && (!dappId || a.dappId === dappId));
  if (list.length === 0) return "NONE";
  return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].status;
}

export function resetApprovals(walletId: string): void {
  store.clearWallet(walletId);
}

// 订阅 Wallet Engine 的重置信号：walletEngine.resetApprovals() / resetWallet()
// 会级联触发这里的真实重置。
subscribeApprovalsReset((walletId) => {
  resetApprovals(walletId);
});
