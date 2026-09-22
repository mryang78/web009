"use client";

// ---------------------------------------------------------------------------
// useSimulationState —— 让 Client Component 订阅底层 Simulation Engine
// 某一次具体分析的真实状态（不是 scenario-player 那个"全站唯一激活场景"单例，
// 而是任意一个 simulationId 自己的状态）。用于 Attack Chain 等不需要驱动
// Approval/Signature/Asset Engine、只需要跟随攻击链步骤真实推进的页面。
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { getSimulationState, subscribeSimulation } from "./simulation-engine";
import type { SimulationEngineState } from "./simulation-types";

export function useSimulationState(id: string | undefined): SimulationEngineState | null {
  return useSyncExternalStore(
    (onChange) => {
      if (!id) return () => {};
      return subscribeSimulation(id, () => onChange());
    },
    () => (id ? safeGet(id) : null),
    () => null
  );
}

function safeGet(id: string): SimulationEngineState | null {
  try {
    return getSimulationState(id);
  } catch {
    return null;
  }
}
