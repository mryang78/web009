// ---------------------------------------------------------------------------
// Wallet Engine —— 对外暴露的统一入口
//
// 所有其他引擎（Asset / Approval / Signature）依赖本模块来校验"这个 walletId
// 真的存在"，但本模块反过来完全不依赖它们——依赖方向永远是单向的
// （wallet-engine ← asset/approval/signature-engine），从根上避免循环依赖。
// resetWallet() / resetAssets() / resetApprovals() 通过 wallet-store.ts 里的
// 信号总线级联通知上层引擎，而不是直接 import 它们。
//
// 纯分析安全研究平台：不连接真实钱包、不调用真实 RPC，一切状态只存在于
// 这个进程的内存里。
// ---------------------------------------------------------------------------

import { getWalletById as getSharedWalletById } from "@/lib/shared/entities";
import { riskLevelFromScore, walletStatusFromRiskLevel } from "@/lib/shared/risk";
import { mockAddress, seededRandom } from "@/lib/shared/prng";
import * as store from "./wallet-store";
import type { CreateMockWalletInput, WalletEngineState, WalletLifecycleListener, Unsubscribe } from "./wallet-types";

let createdCounter = 0;

/** 把 @/lib/shared 里的静态隔离钱包首次接入引擎（惰性注册），此后走本地 store。 */
function hydrateFromShared(id: string): WalletEngineState | undefined {
  const shared = getSharedWalletById(id);
  if (!shared) return undefined;
  const state: WalletEngineState = {
    id: shared.id,
    address: shared.address,
    label: shared.label,
    network: shared.network,
    walletType: shared.walletType,
    totalValueUsd: shared.totalValueUsd,
    riskScore: shared.riskScore,
    riskLevel: shared.riskLevel,
    status: shared.status,
    origin: "static",
    // 静态隔离数据没有真实的"创建时间"概念，用 Unix 纪元占位，明确标注来源。
    createdAt: new Date(0).toISOString(),
  };
  return store.putWallet(state);
}

/** 解析一个 walletId：优先查引擎本地 store，找不到再尝试从静态钱包池惰性注册。 */
function resolve(id: string): WalletEngineState {
  if (store.hasWallet(id)) return store.requireWallet(id);
  const hydrated = hydrateFromShared(id);
  if (!hydrated) throw new Error(`[wallet-engine] 未知的 walletId: "${id}"（既不在引擎 store 中，也不在 @/lib/shared 静态钱包池中）`);
  return hydrated;
}

/** 创建一个全新的 Mock 钱包（不进入 @/lib/shared 的静态目录，只存在于本引擎的内存中）。 */
export function createMockWallet(input: CreateMockWalletInput = {}): WalletEngineState {
  createdCounter += 1;
  const id = input.id ?? `wallet-created-${createdCounter}`;
  if (store.hasWallet(id)) {
    throw new Error(`[wallet-engine] wallet id="${id}" 已存在，请使用其他 id`);
  }

  const rnd = seededRandom(createdCounter * 733 + id.length);
  const riskScore = input.riskScore ?? Math.floor(rnd() * 40);
  const riskLevel = riskLevelFromScore(riskScore);

  const state: WalletEngineState = {
    id,
    address: mockAddress(rnd),
    label: input.label ?? `目标钱包 ${createdCounter}`,
    network: input.network ?? "Ethereum",
    walletType: input.walletType ?? "普通钱包",
    totalValueUsd: input.totalValueUsd ?? Math.round(rnd() * 200000 * 100) / 100,
    riskScore,
    riskLevel,
    status: walletStatusFromRiskLevel(riskLevel),
    origin: "created",
    createdAt: new Date().toISOString(),
  };
  return store.putWallet(state);
}

/** 把某个钱包标记为"当前选中"，供 UI 层做单一活跃钱包的选择器使用。 */
export function selectMockWallet(id: string): WalletEngineState {
  resolve(id);
  store.setSelectedWalletId(id);
  return store.updateWallet(id, (w) => ({ ...w, lastSelectedAt: new Date().toISOString() }));
}

export function getSelectedWalletId(): string | undefined {
  return store.getSelectedWalletId();
}

/**
 * 把一个钱包重置回其基线状态（静态钱包 = @/lib/shared 中的原始值；动态创建的
 * 钱包 = 创建时的初始值），并级联通知 Asset / Approval / Signature Engine
 * 一并重置这个钱包名下的资产、授权与签名记录。
 */
export function resetWallet(id: string): WalletEngineState {
  const current = resolve(id);
  const baseline = store.getBaseline(id);
  const timestamp = new Date().toISOString();

  const next = store.updateWallet(id, () =>
    baseline
      ? { ...baseline, lastSelectedAt: current.lastSelectedAt, lastResetAt: timestamp }
      : { ...current, lastResetAt: timestamp }
  );

  store.emitAssetsResetRequested(id);
  store.emitApprovalsResetRequested(id);
  store.emitSignaturesResetRequested(id);
  return next;
}

/** 只重置这个钱包名下的资产（委托给 Asset Engine 处理，通过信号总线，不直接依赖它）。 */
export function resetAssets(id: string): WalletEngineState {
  resolve(id);
  store.emitAssetsResetRequested(id);
  return store.updateWallet(id, (w) => ({ ...w, lastResetAt: new Date().toISOString() }));
}

/** 只重置这个钱包名下的授权记录（委托给 Approval Engine，同样通过信号总线）。 */
export function resetApprovals(id: string): WalletEngineState {
  resolve(id);
  store.emitApprovalsResetRequested(id);
  return store.updateWallet(id, (w) => ({ ...w, lastResetAt: new Date().toISOString() }));
}

export function getWalletState(id: string): WalletEngineState {
  return resolve(id);
}

export function subscribeAssetsReset(listener: WalletLifecycleListener): Unsubscribe {
  return store.onAssetsResetRequested(listener);
}
export function subscribeApprovalsReset(listener: WalletLifecycleListener): Unsubscribe {
  return store.onApprovalsResetRequested(listener);
}
export function subscribeSignaturesReset(listener: WalletLifecycleListener): Unsubscribe {
  return store.onSignaturesResetRequested(listener);
}
