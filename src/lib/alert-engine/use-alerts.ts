"use client";

// ---------------------------------------------------------------------------
// useAllAlerts —— 让 Client Component 订阅 Alert Engine 的全部告警记录。
// 告警只会在真实的 Simulation → Threat Engine 检测链路产生威胁后才会自动
// 出现，这里不做任何补齐/兜底的假数据——列表为空就是"目前还没有触发过威胁
// 检测"，这正是"全站读取统一 Simulation State"要呈现的真实状态。
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { getAllAlerts, subscribeAlerts } from "./alert-engine";
import type { AlertRecord } from "./alert-types";

const EMPTY: AlertRecord[] = [];

export function useAllAlerts(): AlertRecord[] {
  return useSyncExternalStore(
    (onChange) => subscribeAlerts(() => onChange()),
    () => (getAllAlerts().length === 0 ? EMPTY : getAllAlerts()),
    () => EMPTY
  );
}
