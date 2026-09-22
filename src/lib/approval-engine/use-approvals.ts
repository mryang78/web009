"use client";

// ---------------------------------------------------------------------------
// useAllApprovals —— 让 Client Component 订阅 Approval Engine 的全部授权记录。
// 这是"后台修改分析数据后 SOC 页面能够反映变化"的落地点之一：无论授权记录
// 是由 /admin/wallet-simulator、/admin/approvals、/soc/approvals 还是 Attack
// Simulation 的真实推演产生的，全部写入同一个 approval-store 单例，这里订阅
// 的就是那一份唯一数据，而不是某个页面自己攒的列表。
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { getAllApprovals, subscribeApprovals } from "./approval-engine";
import type { ApprovalRecordState } from "./approval-types";

const EMPTY: ApprovalRecordState[] = [];

export function useAllApprovals(): ApprovalRecordState[] {
  return useSyncExternalStore(
    (onChange) => subscribeApprovals(onChange),
    () => (getAllApprovals().length === 0 ? EMPTY : getAllApprovals()),
    () => EMPTY
  );
}
