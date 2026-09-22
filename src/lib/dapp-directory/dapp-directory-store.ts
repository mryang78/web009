// ---------------------------------------------------------------------------
// DApp Directory Store —— 真正持有状态的地方（同一进程内存单例）
// ---------------------------------------------------------------------------

import { mockDApps } from "@/lib/shared/entities";
import type { DAppDirectoryEntry, DAppDirectoryListener, Unsubscribe } from "./dapp-directory-types";

let entries: Map<string, DAppDirectoryEntry> | null = null;
const listeners = new Set<DAppDirectoryListener>();

// React 的 useSyncExternalStore 要求：数据没变时 getSnapshot() 必须返回同一个
// 引用，否则每次渲染都会"看起来变了"，触发无限重渲染（Maximum update depth
// exceeded）。所以 listAll() 的结果要缓存，只在 update() 真正改变数据时才失效重建。
let cachedList: DAppDirectoryEntry[] | null = null;

/** 惰性初始化：以 @/lib/shared/entities.mockDApps 为基线灌入一份可写的 Map。 */
function ensureHydrated(): Map<string, DAppDirectoryEntry> {
  if (!entries) {
    entries = new Map(
      mockDApps.map((d) => [
        d.id,
        {
          id: d.id,
          name: d.name,
          domain: d.domain,
          category: d.category,
          riskLevel: d.riskLevel,
          contractAddress: d.contractAddress,
          status: d.status,
        },
      ])
    );
  }
  return entries;
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function listAll(): DAppDirectoryEntry[] {
  ensureHydrated();
  if (!cachedList) cachedList = [...entries!.values()];
  return cachedList;
}

export function read(id: string): DAppDirectoryEntry | undefined {
  return ensureHydrated().get(id);
}

export function requireEntry(id: string): DAppDirectoryEntry {
  const entry = ensureHydrated().get(id);
  if (!entry) throw new Error(`[dapp-directory] 未找到 DApp id="${id}"`);
  return entry;
}

export function update(id: string, updater: (current: DAppDirectoryEntry) => DAppDirectoryEntry): DAppDirectoryEntry {
  const current = requireEntry(id);
  const next = updater(current);
  ensureHydrated().set(id, next);
  cachedList = null;
  notify();
  return next;
}

export function onChanged(listener: DAppDirectoryListener): Unsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function __resetDAppDirectoryForTests(): void {
  entries = null;
  cachedList = null;
}
