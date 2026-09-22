// ---------------------------------------------------------------------------
// DApp Directory Engine —— 对外暴露的统一入口
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";
import * as store from "./dapp-directory-store";
import type { DAppDirectoryEntry, DAppDirectoryListener, DAppDirectoryStatus, Unsubscribe } from "./dapp-directory-types";

export function listDApps(): DAppDirectoryEntry[] {
  return store.listAll();
}

export function getDApp(id: string): DAppDirectoryEntry | undefined {
  return store.read(id);
}

/** 后台编辑：切换某个 DApp 的监控状态（Active ⇄ Disabled）。 */
export function setDAppStatus(id: string, status: DAppDirectoryStatus): DAppDirectoryEntry {
  return store.update(id, (current) => ({ ...current, status, updatedAt: new Date().toISOString() }));
}

/** 后台编辑：调整某个 DApp 的风险等级——例如安全团队人工复核后上调/下调判定。 */
export function setDAppRiskLevel(id: string, riskLevel: RiskLevel): DAppDirectoryEntry {
  return store.update(id, (current) => ({ ...current, riskLevel, updatedAt: new Date().toISOString() }));
}

/** 订阅"DApp 目录发生了任何变化"，供 /soc/* 等只读页面实时刷新聚合统计。 */
export function subscribeDApps(listener: DAppDirectoryListener): Unsubscribe {
  return store.onChanged(listener);
}

export { __resetDAppDirectoryForTests } from "./dapp-directory-store";
