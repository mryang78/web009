// ---------------------------------------------------------------------------
// Asset Store —— 按 walletId 索引的持仓表 + 资产异动记录表
// ---------------------------------------------------------------------------

import type { AssetHoldingState, MockAssetMovementRecord } from "./asset-types";

const holdingsByWallet = new Map<string, AssetHoldingState[]>();
const movementsByWallet = new Map<string, MockAssetMovementRecord[]>();

function cloneHoldings(list: AssetHoldingState[]): AssetHoldingState[] {
  return list.map((h) => ({ ...h }));
}

export function hasHoldings(walletId: string): boolean {
  return holdingsByWallet.has(walletId);
}

export function readHoldings(walletId: string): AssetHoldingState[] | undefined {
  const h = holdingsByWallet.get(walletId);
  return h ? cloneHoldings(h) : undefined;
}

export function putHoldings(walletId: string, holdings: AssetHoldingState[]): AssetHoldingState[] {
  holdingsByWallet.set(walletId, holdings);
  return cloneHoldings(holdings);
}

export function readMovements(walletId: string): MockAssetMovementRecord[] {
  return (movementsByWallet.get(walletId) ?? []).map((m) => ({ ...m }));
}

export function pushMovement(walletId: string, record: MockAssetMovementRecord): void {
  const list = movementsByWallet.get(walletId) ?? [];
  list.push(record);
  movementsByWallet.set(walletId, list);
}

export function clearWallet(walletId: string): void {
  holdingsByWallet.delete(walletId);
  movementsByWallet.delete(walletId);
}

export function __resetAssetStoreForTests(): void {
  holdingsByWallet.clear();
  movementsByWallet.clear();
}
