"use client";

// ---------------------------------------------------------------------------
// useScenarioPlayer —— 让任意 Client Component 订阅全站统一的 Scenario Player
// 单例（scenario-player.ts）。任何一个页面调用 startScenario()/play() 等动作
// 后，所有同时挂载了这个 hook 的页面/组件都会在下一次真实状态变化时收到同一份
// 快照——这就是"所有页面必须读取统一 Simulation State"的落地方式。
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe, type ScenarioPlayerSnapshot } from "./scenario-player";

function getServerSnapshot(): ScenarioPlayerSnapshot | null {
  return null;
}

export function useScenarioPlayer(): ScenarioPlayerSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
