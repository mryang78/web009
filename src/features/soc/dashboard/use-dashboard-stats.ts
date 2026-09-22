"use client";

// ---------------------------------------------------------------------------
// useDashboardStats —— SOC Dashboard 的统计数字改由聚合真实引擎状态得出，
// 不再是"每次刷新页面随机浮动"的静态 Mock 数组。数据来源：
//   Total Wallets / Suspicious DApps / Simulated Assets  ← @/lib/shared + @/lib/dapp-directory（真实目录，Suspicious DApps 会随 /admin/dapps 的编辑实时变化）
//   Active Simulations / Attack Attempts / Blocked Attacks ← @/lib/simulation（真实状态机）
//   Detected Threats / Critical Threats                    ← @/lib/threat-engine
//   Token Approvals                                        ← @/lib/approval-engine
//   Active Alerts                                          ← @/lib/alert-engine
// 这些引擎都是模块级内存单例、没有"全体聚合"级别的发布订阅通道，这里用一个
// 轻量的定时轮询（2s）重新读一次聚合值，足以满足一个态势看板的刷新粒度，
// 也避免为了这一个页面给每个引擎都加一层全局订阅。
//
// Threat Activity 流水 / Attack Distribution 分布已经迁移到
// @/lib/threat-engine/use-threat-feed（供 admin 页面复用同一份聚合），本文件
// 只保留 Dashboard 顶部统计卡片这一份职责。
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { mockWallets } from "@/lib/shared/entities";
import { listDApps } from "@/lib/dapp-directory";
import { getAllSimulations, TERMINAL_STATUSES } from "@/lib/simulation";
import { getAllThreats } from "@/lib/threat-engine";
import { getAllAlerts } from "@/lib/alert-engine";
import { getAllApprovals } from "@/lib/approval-engine";

export interface DashboardStat {
  label: string;
  value: string;
}

function computeStats(): DashboardStat[] {
  const simulations = getAllSimulations();
  const threats = getAllThreats();
  const alerts = getAllAlerts();
  const approvals = getAllApprovals();

  const activeSimulations = simulations.filter((s) => !TERMINAL_STATUSES.includes(s.status)).length;
  const criticalThreats = threats.filter((t) => t.severity === "CRITICAL").length;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
  // 读取 DApp Directory（而非静态 mockDApps 数组），这样 /admin/dapps 的编辑
  // 操作（切换监控状态/风险等级）会在下一次轮询时立即反映到这个统计里。
  const suspiciousDApps = listDApps().filter((d) => d.status === "Active" && (d.riskLevel === "HIGH" || d.riskLevel === "CRITICAL")).length;
  const blockedAttacks = simulations.filter((s) => s.status === "BLOCKED").length;
  const simulatedAssetsUsd = mockWallets.reduce((sum, w) => sum + w.totalValueUsd, 0);

  return [
    { label: "钱包总数", value: mockWallets.length.toLocaleString() },
    { label: "进行中分析", value: activeSimulations.toLocaleString() },
    { label: "已检出威胁", value: threats.length.toLocaleString() },
    { label: "严重威胁", value: criticalThreats.toLocaleString() },
    { label: "可疑 DApp", value: suspiciousDApps.toLocaleString() },
    { label: "代币授权", value: approvals.length.toLocaleString() },
    { label: "活跃告警", value: activeAlerts.toLocaleString() },
    { label: "分析资产", value: `$${(simulatedAssetsUsd / 1_000_000).toFixed(1)}M` },
    { label: "攻击尝试", value: simulations.length.toLocaleString() },
    { label: "已拦截攻击", value: blockedAttacks.toLocaleString() },
  ];
}

export function useDashboardStats(): DashboardStat[] {
  const [stats, setStats] = useState<DashboardStat[]>(() => computeStats());

  useEffect(() => {
    const timer = setInterval(() => setStats(computeStats()), 2000);
    return () => clearInterval(timer);
  }, []);

  return stats;
}

export { useThreatFeed, type ThreatActivityRow, type AttackDistributionSlice } from "@/lib/threat-engine/use-threat-feed";
