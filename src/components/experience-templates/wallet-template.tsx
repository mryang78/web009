"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Repeat, CreditCard } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";
import { cn } from "@/lib/utils";

type Direction = "Received" | "Sent" | "Pending";

function directionOf(a: { type: string; status: "completed" | "pending" }): Direction {
  if (a.status === "pending") return "Pending";
  return a.type === "Receive" || a.type === "Bridge" ? "Received" : "Sent";
}

const directionStyle: Record<Direction, string> = {
  Received: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const directionLabel: Record<Direction, string> = {
  Received: "已接收",
  Sent: "已发送",
  Pending: "待处理",
};

const filterLabel: Record<"All" | Direction, string> = {
  All: "全部",
  Received: "已接收",
  Sent: "已发送",
  Pending: "待处理",
};

const activityTypeLabel: Record<string, string> = {
  Swap: "兑换",
  Receive: "接收",
  Send: "发送",
  Approve: "授权",
  Bridge: "跨链桥接",
};

const assets = [
  { symbol: "ETH", name: "Ethereum", qty: "4.8213", value: "$16,782.44", change: -1.27, pct: 42 },
  { symbol: "USDT", name: "Tether", qty: "12,480.00", value: "$12,480.00", change: 0.0, pct: 31 },
  { symbol: "SOL", name: "Solana", qty: "38.204", value: "$6,454.82", change: 5.63, pct: 16 },
  { symbol: "ARB", name: "Arbitrum", qty: "2,140.5", value: "$2,320.30", change: 3.92, pct: 6 },
  { symbol: "MATIC", name: "Polygon", qty: "3,882.0", value: "$1,978.14", change: -2.04, pct: 5 },
];

const activity = [
  { type: "Swap", detail: "0.42 ETH → 1,462.08 USDT", time: "8 分钟前", status: "completed" as const },
  { type: "Receive", detail: "+120.00 USDT 来自 0x7Ea4...11aB", time: "1 小时前", status: "completed" as const },
  { type: "Send", detail: "-0.05 ETH 转至 0x3bC1...44F0", time: "3 小时前", status: "completed" as const },
  { type: "Approve", detail: "USDC 授权额度 · 授权对象 0x9A2f...71EF", time: "6 小时前", status: "pending" as const },
  { type: "Bridge", detail: "500 USDT：Ethereum → Arbitrum", time: "1 天前", status: "completed" as const },
];

const quickActions = [
  { label: "接收", icon: ArrowDownToLine },
  { label: "发送", icon: ArrowUpFromLine },
  { label: "兑换", icon: Repeat },
  { label: "购买", icon: CreditCard },
];

export function WalletTemplate({ product: _product }: { product: Product }) {
  const [filter, setFilter] = useState<"All" | Direction>("All");
  const filteredActivity = activity.filter((a) => filter === "All" || directionOf(a) === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="资产总额" subtitle="Total Portfolio Value · 虚拟地址 0x71D3...A82F">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">$40,015.70</div>
              <div className="mt-1 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">+2.14% (24H)</div>
            </div>
            <div className="flex h-16 items-end gap-1">
              {[30, 42, 38, 55, 48, 62, 58, 70, 64, 74, 69, 80].map((h, i) => (
                <div key={i} className="w-2 rounded-t-sm bg-primary/50" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {quickActions.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/70 bg-secondary/20 py-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="资产列表" subtitle="Assets · 按持仓价值排序">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">资产</th>
                <th className="px-4 py-2.5 font-medium">持仓数量</th>
                <th className="px-4 py-2.5 font-medium">价值</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">占比</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.symbol} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground">{a.symbol}</div>
                    <div className="text-[11px] text-muted-foreground">{a.name}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">{a.qty}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-mono tabular-nums text-foreground">{a.value}</div>
                    {a.change !== 0 && (
                      <div className={cn("text-[11px] font-medium", a.change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {a.change > 0 ? "+" : ""}
                        {a.change.toFixed(2)}%
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${a.pct}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="最近活动" subtitle="Recent Activity · 最近链上活动记录">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["All", "Received", "Sent", "Pending"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              )}
            >
              {filterLabel[f]}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {filteredActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13px] font-medium text-foreground">{activityTypeLabel[a.type] ?? a.type}</div>
                <div className="font-mono text-[11.5px] text-muted-foreground">{a.detail}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", directionStyle[directionOf(a)])}>
                  {directionLabel[directionOf(a)]}
                </span>
                <StatusBadge status={a.status} />
                <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
