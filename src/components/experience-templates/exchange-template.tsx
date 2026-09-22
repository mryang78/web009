import { TrendingUp, TrendingDown, ShieldAlert, Megaphone } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";
import { formatCompactUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

const tickers = [
  { symbol: "BTC/USDT", price: "$67,284.31", change: 2.84, volume: "$38.21B" },
  { symbol: "ETH/USDT", price: "$3,481.06", change: -1.27, volume: "$19.64B" },
  { symbol: "SOL/USDT", price: "$168.92", change: 5.63, volume: "$4.92B" },
  { symbol: "BNB/USDT", price: "$589.14", change: 0.41, volume: "$1.83B" },
  { symbol: "XRP/USDT", price: "$0.5127", change: -0.85, volume: "$1.12B" },
  { symbol: "ARB/USDT", price: "$1.084", change: 3.92, volume: "$412.6M" },
];

const orderBookAsks = [
  { price: "67,298.50", amount: "0.4821", total: "32,443.16" },
  { price: "67,291.20", amount: "0.2107", total: "14,180.29" },
  { price: "67,286.75", amount: "0.8834", total: "59,441.75" },
];
const orderBookBids = [
  { price: "67,282.10", amount: "0.6203", total: "41,731.51" },
  { price: "67,278.65", amount: "1.2044", total: "81,010.79" },
  { price: "67,271.30", amount: "0.3388", total: "22,791.19" },
];

const recentTrades = [
  { price: "67,284.31", amount: "0.0284", side: "buy", time: "22:41:03" },
  { price: "67,281.90", amount: "0.1503", side: "sell", time: "22:40:57" },
  { price: "67,286.02", amount: "0.0071", side: "buy", time: "22:40:51" },
  { price: "67,279.44", amount: "0.2210", side: "sell", time: "22:40:44" },
  { price: "67,283.15", amount: "0.0562", side: "buy", time: "22:40:38" },
];

type OrderState = "Open" | "Filled" | "Cancelled";

const orderStateStyle: Record<OrderState, string> = {
  Open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Filled: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-secondary text-muted-foreground",
};

const orderStateLabel: Record<OrderState, string> = {
  Open: "挂单中",
  Filled: "已成交",
  Cancelled: "已取消",
};

const myOrders: { pair: string; side: "买入" | "卖出"; price: string; amount: string; state: OrderState; time: string }[] = [
  { pair: "BTC/USDT", side: "买入", price: "66,900.00", amount: "0.0500", state: "Open", time: "22:12:04" },
  { pair: "ETH/USDT", side: "卖出", price: "3,510.00", amount: "1.2000", state: "Filled", time: "21:58:41" },
  { pair: "SOL/USDT", side: "买入", price: "162.40", amount: "8.0000", state: "Filled", time: "21:30:15" },
  { pair: "ARB/USDT", side: "买入", price: "1.120", amount: "400.0000", state: "Cancelled", time: "20:47:52" },
];

export function ExchangeTemplate({ product }: { product: Product }) {
  const isFlagship = product.tier === "S";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="市场总览" subtitle="Market Overview · 实时行情分析数据（实时分析）">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="24H 成交额" value={formatCompactUSD(4_820_000_000)} change="+6.2%" changeTone="up" />
          <StatTile label="市值 Market Cap" value="$1.33T" change="+1.8%" changeTone="up" />
          <StatTile label="活跃交易对" value="284" />
          <StatTile label="平台用户" value="2.4M+" />
        </div>
      </Section>

      <Section title="热门交易对" subtitle="Hot Pairs · 24H 涨跌幅与成交量">
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">交易对</th>
                <th className="px-4 py-2.5 font-medium">最新价</th>
                <th className="px-4 py-2.5 font-medium">24H 涨跌</th>
                <th className="px-4 py-2.5 font-medium">24H 成交量</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((t) => (
                <tr key={t.symbol} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-2.5 font-medium text-foreground">{t.symbol}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">{t.price}</td>
                  <td
                    className={cn(
                      "px-4 py-2.5 font-mono tabular-nums font-medium",
                      t.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {t.change >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      {t.change >= 0 ? "+" : ""}
                      {t.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">{t.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="BTC/USDT" subtitle="K 线图与深度盘口 · 隔离数据">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="flex h-72 flex-col justify-end gap-2 rounded-xl border border-border/70 bg-card p-4">
            <div className="flex flex-1 items-end gap-1">
              {[38, 52, 44, 61, 58, 70, 65, 78, 72, 84, 80, 90, 86, 94, 88, 96].map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm",
                    i % 3 === 0 ? "bg-red-500/60" : "bg-emerald-500/60"
                  )}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10.5px] text-muted-foreground/60">
              <span>09:00</span>
              <span>13:00</span>
              <span>17:00</span>
              <span>21:00</span>
              <span>Now</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3">
            <div className="mb-2 text-[11px] font-semibold text-muted-foreground">盘口深度</div>
            <div className="space-y-0.5">
              {orderBookAsks.map((r) => (
                <div key={r.price} className="grid grid-cols-3 text-[11px] font-mono tabular-nums text-red-600 dark:text-red-400">
                  <span>{r.price}</span>
                  <span className="text-right text-foreground/70">{r.amount}</span>
                  <span className="text-right text-muted-foreground/60">{r.total}</span>
                </div>
              ))}
            </div>
            <div className="my-2 border-t border-dashed border-border/70 py-1.5 text-center font-mono text-sm font-semibold text-foreground">
              67,284.31
            </div>
            <div className="space-y-0.5">
              {orderBookBids.map((r) => (
                <div key={r.price} className="grid grid-cols-3 text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  <span>{r.price}</span>
                  <span className="text-right text-foreground/70">{r.amount}</span>
                  <span className="text-right text-muted-foreground/60">{r.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="最新成交" subtitle="Recent Trades · 最新成交记录">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2 font-medium">价格 (USDT)</th>
                <th className="px-4 py-2 font-medium">数量 (BTC)</th>
                <th className="px-4 py-2 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className={cn("px-4 py-2 font-mono tabular-nums", t.side === "buy" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {t.price}
                  </td>
                  <td className="px-4 py-2 font-mono tabular-nums text-muted-foreground">{t.amount}</td>
                  <td className="px-4 py-2 font-mono tabular-nums text-muted-foreground/70">{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="我的订单" subtitle="My Orders · 挂单中 / 已成交 / 已取消">
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">交易对</th>
                <th className="px-4 py-2.5 font-medium">方向</th>
                <th className="px-4 py-2.5 font-medium">价格</th>
                <th className="px-4 py-2.5 font-medium">数量</th>
                <th className="px-4 py-2.5 font-medium">状态</th>
                <th className="px-4 py-2.5 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{o.pair}</td>
                  <td className={cn("px-4 py-2.5 font-medium", o.side === "买入" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {o.side}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">{o.price}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">{o.amount}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", orderStateStyle[o.state])}>{orderStateLabel[o.state]}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground/70">{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {isFlagship && (
        <Section title="平台活动" subtitle="Promotions · 限时活动">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Megaphone className="size-4 shrink-0 text-primary" />
            <p className="text-[13px] text-foreground/80">
              新用户交易赛：完成 ≥500 USDT 交易额可分享 50,000 USDT 奖池（分析活动，非真实奖励）。
            </p>
            <StatusBadge status="live" className="ml-auto shrink-0" />
          </div>
        </Section>
      )}

      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        产品公告：以上行情、订单与成交数据仅供参考，投资决策需结合自身风险承受能力。
      </div>
    </div>
  );
}
