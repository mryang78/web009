"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Wallet,
  Activity,
  ShieldAlert,
  Siren,
  Globe,
  BadgeCheck,
  BellRing,
  Coins,
  Swords,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { RiskBadge, SimStatusBadge, SimulationOnlyTag } from "@/components/soc/badges";
import { useDashboardStats, useThreatFeed, type ThreatActivityRow } from "./use-dashboard-stats";

const statIcons: Record<string, LucideIcon> = {
  钱包总数: Wallet,
  进行中分析: Activity,
  已检出威胁: ShieldAlert,
  严重威胁: Siren,
  "可疑 DApp": Globe,
  代币授权: BadgeCheck,
  活跃告警: BellRing,
  分析资产: Coins,
  攻击尝试: Swords,
  已拦截攻击: ShieldCheck,
};

const donutColors = ["#f43f5e", "#fb923c", "#f59e0b", "#a855f7", "#38bdf8", "#22c55e", "#64748b"];

const columns: DataTableColumn<ThreatActivityRow>[] = [
  { key: "time", label: "时间", render: (r) => <span className="font-mono text-muted-foreground">{r.time}</span> },
  { key: "threatLevel", label: "威胁等级", render: (r) => <RiskBadge level={r.threatLevel} /> },
  { key: "attackType", label: "攻击类型", render: (r) => <span className="text-foreground/90">{r.attackType}</span> },
  { key: "wallet", label: "钱包", render: (r) => <span className="font-mono text-muted-foreground">{r.wallet}</span>, hideOnMobile: true },
  { key: "dapp", label: "DApp", render: (r) => <span className="text-muted-foreground">{r.dapp}</span>, hideOnMobile: true },
  { key: "token", label: "Token", render: (r) => <span className="text-muted-foreground">{r.token}</span>, hideOnMobile: true },
  { key: "status", label: "状态", render: (r) => <SimStatusBadge status={r.status} /> },
];

export function SocDashboardClient() {
  const stats = useDashboardStats();
  const { rows: threatActivity, distribution: attackDistribution } = useThreatFeed();

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "态势看板" }]}
        title="安全态势看板"
        description="核心安全指标、实时威胁活动与攻击类型分布，全部由实时分析中的安全分析引擎状态聚合得出"
        actions={<SimulationOnlyTag />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const StatIcon = statIcons[s.label] ?? Activity;
          return (
            <div key={s.label} className="rounded-2xl border border-border/70 bg-card/65 p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                  <StatIcon className="size-4" />
                </span>
              </div>
              <div className="mt-3 font-mono text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                {s.value}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/65 p-5 lg:col-span-2">
          <h3 className="text-[13.5px] font-semibold text-foreground">Threat Activity 实时威胁活动</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">Threat Engine 真实检测到的事件流水（最近 30 条）</p>
          {threatActivity.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12.5px] text-muted-foreground">
              暂无威胁活动 —— 前往 攻击路径分析 或 Attack Chain 运行一次分析以产生真实检测事件。
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">时间</th>
                    <th className="py-2 pr-3 font-medium">威胁等级</th>
                    <th className="py-2 pr-3 font-medium">攻击类型</th>
                    <th className="py-2 pr-3 font-medium">钱包</th>
                    <th className="py-2 pr-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {threatActivity.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.time}</td>
                      <td className="py-2.5 pr-3">
                        <RiskBadge level={r.threatLevel} />
                      </td>
                      <td className="py-2.5 pr-3 text-foreground/90">{r.attackType}</td>
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.wallet}</td>
                      <td className="py-2.5 pr-3">
                        <SimStatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
          <h3 className="text-[13.5px] font-semibold text-foreground">Attack Distribution 攻击类型分布</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">按 Threat Engine 实际检测到的类型聚合</p>
          {attackDistribution.length === 0 ? (
            <p className="mt-6 text-center text-[12px] text-muted-foreground">暂无数据</p>
          ) : (
            <>
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attackDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {attackDistribution.map((_, i) => (
                        <Cell key={i} fill={donutColors[i % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#12141c",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {attackDistribution.map((d, i) => (
                  <li key={d.category} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: donutColors[i % donutColors.length] }} />
                    <span className="truncate">{d.category}</span>
                    <span className="ml-auto font-mono tabular-nums text-foreground/80">{d.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        <DataTable
          data={threatActivity}
          columns={columns}
          rowKey={(r) => `${r.time}-${r.attackType}-${r.wallet}`}
          searchPlaceholder="搜索攻击类型 / 钱包 / DApp…"
          searchFn={(r, q) =>
            r.attackType.toLowerCase().includes(q) || r.wallet.toLowerCase().includes(q) || r.dapp.toLowerCase().includes(q)
          }
          pageSize={6}
          emptyDescription="暂无威胁活动 —— 前往 攻击路径分析 或 Attack Chain 运行一次分析以产生真实检测事件。"
        />
      </div>
    </div>
  );
}
