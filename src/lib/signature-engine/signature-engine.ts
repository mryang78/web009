// ---------------------------------------------------------------------------
// Signature / Permit Simulation Engine —— 对外暴露的统一入口
//
//   NONE ──createSignatureRequest──▶ REQUESTED
//   REQUESTED/REVIEWING ──analyzeSignature──▶ HIGH_RISK | REVIEWING
//   REQUESTED/REVIEWING/HIGH_RISK ──simulateSignature──▶ SIGNED_MOCK
//   REQUESTED/REVIEWING/HIGH_RISK ──rejectSignature──▶ REJECTED
//
// simulateSignature() 允许从 HIGH_RISK 状态发生——这是刻意的：真实世界里用户
// 完全可能无视风险提示照样签名，这正是这个模块要分析和教育的场景。
//
// 安全约束：mockSignature 的值只能通过 createMockSignatureValue() 生成，
// 该函数生成的字符串永远以 "MOCK_SIGNATURE:" 开头——结构上就不是、也不可能
// 被解析为一个真实的 ECDSA/EIP-712 签名，不产生任何可广播的真实签名。
// ---------------------------------------------------------------------------

import { assessSignatureRisk } from "@/lib/risk-engine/factors";
import { hashStringToSeed, seededRandom } from "@/lib/shared/prng";
import type { RiskLevel } from "@/lib/shared/types";
import { getWalletState, subscribeSignaturesReset } from "@/lib/wallet-engine";
import * as store from "./signature-store";
import type { CreateSignatureRequestInput, SignatureEngineStatus, SignatureRecordState } from "./signature-types";

/** 真实签名从不带这个前缀，因此凡是带这个前缀的值，结构上就不可能被当作真实签名使用。 */
const MOCK_SIGNATURE_PREFIX = "MOCK_SIGNATURE:";

function pushHistory(
  state: SignatureRecordState,
  status: SignatureEngineStatus,
  riskLevel: RiskLevel,
  note: string,
  timestamp: string
): SignatureRecordState {
  return {
    ...state,
    status,
    riskLevel,
    updatedAt: timestamp,
    history: [...state.history, { status, riskLevel, note, timestamp }],
  };
}

function assertStatus(state: SignatureRecordState, allowed: SignatureEngineStatus[], action: string): void {
  if (!allowed.includes(state.status)) {
    throw new Error(
      `[signature-engine] 无法在状态 "${state.status}" 下执行 ${action}()；允许的状态为 [${allowed.join(", ")}]。`
    );
  }
}

/** 动态计算这次签名请求的风险等级——通过 Risk Engine 的具名因素加权求和归一化，不是固定的 if/else 常量表。 */
function assessRisk(input: { type: SignatureRecordState["type"]; dappId?: string; payloadSummary: string }): RiskLevel {
  return assessSignatureRisk(input).level;
}

/** 生成一个结构上就不可能被当作真实签名使用的虚构签名值。 */
function createMockSignatureValue(rnd: () => number): string {
  const hex = Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
  return `${MOCK_SIGNATURE_PREFIX}0x${hex}`;
}

/** 判断一个字符串是否是本引擎产生的 Mock 签名——供任何下游代码做防呆校验。 */
export function isMockSignature(value: string): boolean {
  return value.startsWith(MOCK_SIGNATURE_PREFIX);
}

let signatureCounter = 0;

export function createSignatureRequest(input: CreateSignatureRequestInput): SignatureRecordState {
  getWalletState(input.walletId);
  signatureCounter += 1;
  const id = input.id ?? `sig-${input.walletId}-${signatureCounter}`;
  if (store.hasSignature(id)) throw new Error(`[signature-engine] signature id="${id}" 已存在`);

  const timestamp = new Date().toISOString();
  const initial: SignatureRecordState = {
    id,
    walletId: input.walletId,
    dappId: input.dappId,
    type: input.type,
    payloadSummary: input.payloadSummary,
    status: "REQUESTED",
    riskLevel: "SAFE",
    createdAt: timestamp,
    updatedAt: timestamp,
    history: [{ status: "REQUESTED", riskLevel: "SAFE", note: "DApp 发起签名请求（Mock，未产生真实签名）", timestamp }],
    simulationId: input.simulationId,
  };
  return store.putSignature(initial);
}

export function analyzeSignature(id: string): SignatureRecordState {
  const current = store.requireSignature(id);
  assertStatus(current, ["REQUESTED", "REVIEWING"], "analyzeSignature");
  const timestamp = new Date().toISOString();
  const risk = assessRisk({ type: current.type, dappId: current.dappId, payloadSummary: current.payloadSummary });

  return store.updateSignature(id, (state) => {
    const nextStatus: SignatureEngineStatus = risk === "HIGH" || risk === "CRITICAL" ? "HIGH_RISK" : "REVIEWING";
    return pushHistory(state, nextStatus, risk, `安全引擎分析签名内容：风险等级 ${risk}`, timestamp);
  });
}

/** 分析"用户在 Mock 钱包里完成签名"这一步，生成一个结构化的虚构签名值。 */
export function simulateSignature(id: string): SignatureRecordState {
  const current = store.requireSignature(id);
  assertStatus(current, ["REQUESTED", "REVIEWING", "HIGH_RISK"], "simulateSignature");
  const timestamp = new Date().toISOString();
  const rnd = seededRandom(hashStringToSeed(`signature:${id}:${current.updatedAt}`));
  const mockSignature = createMockSignatureValue(rnd);

  return store.updateSignature(id, (state) =>
    pushHistory(
      { ...state, mockSignature },
      "SIGNED_MOCK",
      state.riskLevel,
      "已生成 Mock 签名（结构化虚构数据，不可用于任何真实交易广播）",
      timestamp
    )
  );
}

export function rejectSignature(id: string): SignatureRecordState {
  const current = store.requireSignature(id);
  assertStatus(current, ["REQUESTED", "REVIEWING", "HIGH_RISK"], "rejectSignature");
  const timestamp = new Date().toISOString();
  return store.updateSignature(id, (state) =>
    pushHistory(state, "REJECTED", state.riskLevel, "已拒绝签名请求（实时分析）", timestamp)
  );
}

export function getSignatureState(id: string): SignatureRecordState {
  return store.requireSignature(id);
}

export function getSignaturesByWallet(walletId: string): SignatureRecordState[] {
  return store.listByWallet(walletId);
}

export function resetSignatures(walletId: string): void {
  store.clearWallet(walletId);
}

// 订阅 Wallet Engine 的重置信号：walletEngine.resetWallet() 会级联触发这里的真实重置。
subscribeSignaturesReset((walletId) => {
  resetSignatures(walletId);
});
