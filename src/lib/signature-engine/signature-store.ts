// ---------------------------------------------------------------------------
// Signature Store —— 按 id 存储签名请求记录，并维护 walletId → 记录 id 的索引
// ---------------------------------------------------------------------------

import type { SignatureRecordState } from "./signature-types";

const signatures = new Map<string, SignatureRecordState>();
const idsByWallet = new Map<string, Set<string>>();

function clone(state: SignatureRecordState): SignatureRecordState {
  return { ...state, history: state.history.map((h) => ({ ...h })) };
}

export function hasSignature(id: string): boolean {
  return signatures.has(id);
}

export function readSignature(id: string): SignatureRecordState | undefined {
  const s = signatures.get(id);
  return s ? clone(s) : undefined;
}

export function requireSignature(id: string): SignatureRecordState {
  const s = signatures.get(id);
  if (!s) throw new Error(`[signature-engine] 未找到 signature id="${id}"`);
  return s;
}

export function putSignature(state: SignatureRecordState): SignatureRecordState {
  signatures.set(state.id, state);
  if (!idsByWallet.has(state.walletId)) idsByWallet.set(state.walletId, new Set());
  idsByWallet.get(state.walletId)!.add(state.id);
  return clone(state);
}

export function updateSignature(
  id: string,
  updater: (current: SignatureRecordState) => SignatureRecordState
): SignatureRecordState {
  const current = requireSignature(id);
  const next = updater(clone(current));
  signatures.set(id, next);
  return clone(next);
}

export function listByWallet(walletId: string): SignatureRecordState[] {
  const ids = idsByWallet.get(walletId);
  if (!ids) return [];
  return [...ids].map((id) => clone(signatures.get(id)!));
}

export function clearWallet(walletId: string): void {
  const ids = idsByWallet.get(walletId);
  if (!ids) return;
  for (const id of ids) signatures.delete(id);
  idsByWallet.delete(walletId);
}

export function __resetSignatureStoreForTests(): void {
  signatures.clear();
  idsByWallet.clear();
}
