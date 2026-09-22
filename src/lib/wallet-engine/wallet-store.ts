// ---------------------------------------------------------------------------
// Wallet Store —— 状态存储 + 重置信号总线
//
// 存储所有已知钱包的当前状态与"基线快照"（用于 resetWallet 精确还原）。
// 同时维护一个轻量的重置信号总线：Asset / Approval / Signature Engine 在
// 各自模块加载时订阅这里的信号，使得 walletEngine.resetWallet() /
// resetAssets() / resetApprovals() 可以级联触发它们的真实重置——而不需要
// Wallet Engine 反过来 import 这三个更上层的模块（避免循环依赖，见
// wallet-engine.ts 顶部注释）。
// ---------------------------------------------------------------------------

import type { WalletEngineState, WalletLifecycleListener, Unsubscribe } from "./wallet-types";

const wallets = new Map<string, WalletEngineState>();
const baselines = new Map<string, WalletEngineState>();
let selectedWalletId: string | undefined;

const assetsResetListeners = new Set<WalletLifecycleListener>();
const approvalsResetListeners = new Set<WalletLifecycleListener>();
const signaturesResetListeners = new Set<WalletLifecycleListener>();

function clone(state: WalletEngineState): WalletEngineState {
  return { ...state };
}

export function hasWallet(id: string): boolean {
  return wallets.has(id);
}

export function readWallet(id: string): WalletEngineState | undefined {
  const w = wallets.get(id);
  return w ? clone(w) : undefined;
}

export function requireWallet(id: string): WalletEngineState {
  const w = wallets.get(id);
  if (!w) throw new Error(`[wallet-engine] 未找到 wallet id="${id}"`);
  return w;
}

/** 写入一条全新状态，并记录一份基线快照供 resetWallet 还原。 */
export function putWallet(state: WalletEngineState): WalletEngineState {
  wallets.set(state.id, state);
  if (!baselines.has(state.id)) baselines.set(state.id, clone(state));
  return clone(state);
}

export function updateWallet(id: string, updater: (current: WalletEngineState) => WalletEngineState): WalletEngineState {
  const current = requireWallet(id);
  const next = updater(clone(current));
  wallets.set(id, next);
  return clone(next);
}

export function getBaseline(id: string): WalletEngineState | undefined {
  const b = baselines.get(id);
  return b ? clone(b) : undefined;
}

export function setSelectedWalletId(id: string): void {
  selectedWalletId = id;
}

export function getSelectedWalletId(): string | undefined {
  return selectedWalletId;
}

export function onAssetsResetRequested(listener: WalletLifecycleListener): Unsubscribe {
  assetsResetListeners.add(listener);
  return () => assetsResetListeners.delete(listener);
}
export function emitAssetsResetRequested(walletId: string): void {
  for (const listener of assetsResetListeners) listener(walletId);
}

export function onApprovalsResetRequested(listener: WalletLifecycleListener): Unsubscribe {
  approvalsResetListeners.add(listener);
  return () => approvalsResetListeners.delete(listener);
}
export function emitApprovalsResetRequested(walletId: string): void {
  for (const listener of approvalsResetListeners) listener(walletId);
}

export function onSignaturesResetRequested(listener: WalletLifecycleListener): Unsubscribe {
  signaturesResetListeners.add(listener);
  return () => signaturesResetListeners.delete(listener);
}
export function emitSignaturesResetRequested(walletId: string): void {
  for (const listener of signaturesResetListeners) listener(walletId);
}

/**
 * 测试 / 调试用：清空钱包数据（生产代码不应调用）。
 *
 * 注意：不清空 assetsResetListeners / approvalsResetListeners /
 * signaturesResetListeners —— 这些订阅是 Asset/Approval/Signature Engine
 * 模块在被 import 时"注册一次"的长期副作用，和 Simulation Engine 里
 * 每个 simulation 独立的订阅不是一回事；每个测试文件的模块图里，各引擎
 * 模块只会被 import 一次，如果这里把监听器集合也清空，后续测试用例里
 * Wallet Engine 发出的重置信号就再也传不到 Asset/Approval/Signature
 * Engine——这正是本函数不清空监听器的原因。
 */
export function __resetWalletStoreForTests(): void {
  wallets.clear();
  baselines.clear();
  selectedWalletId = undefined;
}
