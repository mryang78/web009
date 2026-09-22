"use client";

// ---------------------------------------------------------------------------
// useThreatFeed —— 把 Threat Engine 真实检测到的威胁聚合成"活动流水 + 类型
// 分布"两份视图，供 /soc/dashboard 与 /admin/asset-flows 等任何需要展示
// "最近威胁活动"的页面共用，不再各自维护一份互不关联的静态/随机数据。
//
// Threat Engine 目前没有"全体威胁"级别的发布订阅通道（只有按 simulation 粒度
// 的检测回调），这里用一个 2s 轮询重新聚合一次，足以满足"看板/流水"这类
// 展示场景的刷新粒度。
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { getDAppById } from "@/lib/shared/entities";
import type { RiskLevel } from "@/lib/shared/types";
import { getSimulationState, type SimulationStatus } from "@/lib/simulation";
import { getAllThreats } from "./threat-engine";
import type { ThreatType } from "./threat-types";
import { getWalletState } from "@/lib/wallet-engine";

export interface ThreatActivityRow {
  time: string;
  threatLevel: RiskLevel;
  attackType: string;
  wallet: string;
  dapp: string;
  token: string;
  status: "Pending" | "Simulated" | "Blocked" | "Failed" | "Detected";
}

export interface AttackDistributionSlice {
  category: ThreatType;
  count: number;
}

/** 引擎自己的 SimulationStatus（大写枚举）→ SOC 徽章使用的展示态枚举。 */
const SOC_STATUS: Record<SimulationStatus, ThreatActivityRow["status"]> = {
  IDLE: "Pending",
  INITIALIZING: "Pending",
  RUNNING: "Simulated",
  PAUSED: "Simulated",
  DETECTED: "Detected",
  BLOCKED: "Blocked",
  COMPLETED: "Simulated",
  FAILED: "Failed",
};

function walletAddressOf(walletId?: string): string {
  if (!walletId) return "-";
  try {
    return getWalletState(walletId).address;
  } catch {
    return walletId;
  }
}

function computeThreatFeed(): { rows: ThreatActivityRow[]; distribution: AttackDistributionSlice[] } {
  const threats = [...getAllThreats()].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

  const rows: ThreatActivityRow[] = threats.slice(0, 30).map((t) => {
    let status: ThreatActivityRow["status"] = "Detected";
    let dapp = "-";
    try {
      const sim = getSimulationState(t.simulationId);
      status = SOC_STATUS[sim.status];
      dapp = sim.dappId ? (getDAppById(sim.dappId)?.name ?? "-") : "-";
    } catch {
      // 对应的分析可能已被重置，保留威胁记录本身即可。
    }
    return {
      time: new Date(t.detectedAt).toLocaleTimeString("zh-CN", { hour12: false }),
      threatLevel: t.severity,
      attackType: t.type,
      wallet: walletAddressOf(t.walletId),
      dapp,
      token: "-",
      status,
    };
  });

  const counts = new Map<ThreatType, number>();
  for (const t of threats) counts.set(t.type, (counts.get(t.type) ?? 0) + 1);
  const distribution = [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

  return { rows, distribution };
}

export function useThreatFeed(): { rows: ThreatActivityRow[]; distribution: AttackDistributionSlice[] } {
  const [feed, setFeed] = useState(() => computeThreatFeed());

  useEffect(() => {
    const timer = setInterval(() => setFeed(computeThreatFeed()), 2000);
    return () => clearInterval(timer);
  }, []);

  return feed;
}
