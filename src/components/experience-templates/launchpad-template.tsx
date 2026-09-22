import { Rocket } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";

const upcoming = [
  { name: "NovaChain (NOVA)", raise: "$2,400,000", price: "$0.024", status: "scheduled" as const, date: "2026-09-22" },
  { name: "MetaLayer (MTL)", raise: "$1,850,000", price: "$0.081", status: "live" as const, date: "进行中" },
  { name: "OrbitFi (ORB)", raise: "$980,000", price: "$0.012", status: "completed" as const, date: "2026-08-14" },
];

export function LaunchpadTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Rocket className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">MetaLayer (MTL) 公募认购</h2>
              <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
                跨链数据协议，本轮融资目标 185 万美元，1 MTL = 0.081 USDT（分析项目）
              </p>
            </div>
          </div>
          <StatusBadge status="live" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="已认购" value="$1.28M" />
          <StatTile label="目标额度" value="$1.85M" />
          <StatTile label="参与人数" value="4,802" />
          <StatTile label="倒计时" value="18:42:06" />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: "69%" }} />
        </div>
      </div>

      <Section title="项目列表" subtitle="即将开始与历史发行项目">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {upcoming.map((p) => (
            <div key={p.name} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13.5px] font-medium text-foreground">{p.name}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  目标 {p.raise} · 价格 {p.price} · {p.date}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
