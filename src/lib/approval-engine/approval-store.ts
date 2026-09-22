// ---------------------------------------------------------------------------
// Approval Store —— 按 id 存储授权记录，并维护 walletId → 记录 id 的索引
// ---------------------------------------------------------------------------

import type { ApprovalRecordState } from "./approval-types";

const approvals = new Map<string, ApprovalRecordState>();
const idsByWallet = new Map<string, Set<string>>();
const listeners = new Set<() => void>();

// React 的 useSyncExternalStore 要求：数据没变时 getSnapshot() 必须返回同一个
// 引用，否则每次渲染都会"看起来变了"，触发无限重渲染（Maximum update depth
// exceeded）。所以 listAll() 的结果要缓存，只在真正发生写操作时才失效重建。
let cachedAll: ApprovalRecordState[] | null = null;

function notify(): void {
  cachedAll = null;
  for (const listener of listeners) listener();
}

/** 订阅"授权记录集合发生了任何变化"（创建/状态更新）——不区分具体是哪一条，供列表类页面做统一刷新。 */
export function onApprovalsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function clone(state: ApprovalRecordState): ApprovalRecordState {
  return { ...state, history: state.history.map((h) => ({ ...h })) };
}

export function hasApproval(id: string): boolean {
  return approvals.has(id);
}

export function readApproval(id: string): ApprovalRecordState | undefined {
  const a = approvals.get(id);
  return a ? clone(a) : undefined;
}

export function requireApproval(id: string): ApprovalRecordState {
  const a = approvals.get(id);
  if (!a) throw new Error(`[approval-engine] 未找到 approval id="${id}"`);
  return a;
}

export function putApproval(state: ApprovalRecordState): ApprovalRecordState {
  approvals.set(state.id, state);
  if (!idsByWallet.has(state.walletId)) idsByWallet.set(state.walletId, new Set());
  idsByWallet.get(state.walletId)!.add(state.id);
  notify();
  return clone(state);
}

export function updateApproval(
  id: string,
  updater: (current: ApprovalRecordState) => ApprovalRecordState
): ApprovalRecordState {
  const current = requireApproval(id);
  const next = updater(clone(current));
  approvals.set(id, next);
  notify();
  return clone(next);
}

export function listByWallet(walletId: string): ApprovalRecordState[] {
  const ids = idsByWallet.get(walletId);
  if (!ids) return [];
  return [...ids].map((id) => clone(approvals.get(id)!));
}

/** 列出当前进程内全部授权记录——供 Dashboard 等聚合统计场景使用。 */
export function listAll(): ApprovalRecordState[] {
  if (!cachedAll) cachedAll = [...approvals.values()].map(clone);
  return cachedAll;
}

export function clearWallet(walletId: string): void {
  const ids = idsByWallet.get(walletId);
  if (!ids) return;
  for (const id of ids) approvals.delete(id);
  idsByWallet.delete(walletId);
  notify();
}

export function __resetApprovalStoreForTests(): void {
  approvals.clear();
  idsByWallet.clear();
  cachedAll = null;
}
