import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { cn } from "@/lib/utils";

const gainers = [
  { symbol: "ARB", name: "Arbitrum", price: "$1.084", change: 12.4 },
  { symbol: "SOL", name: "Solana", price: "$168.92", change: 5.63 },
  { symbol: "INJ", name: "Injective", price: "$24.18", change: 8.91 },
];
const losers = [
  { symbol: "DOGE", name: "Dogecoin", price: "$0.1284", change: -4.62 },
  { symbol: "ETH", name: "Ethereum", price: "$3,481.06", change: -1.27 },
  { symbol: "XRP", name: "Ripple", price: "$0.5127", change: -0.85 },
];
const watchlist = [
  { symbol: "BTC", name: "Bitcoin", price: "$67,284.31", change: 2.84, cap: "$1.33T" },
  { symbol: "ETH", name: "Ethereum", price: "$3,481.06", change: -1.27, cap: "$418.6B" },
  { symbol: "SOL", name: "Solana", price: "$168.92", change: 5.63, cap: "$78.4B" },
  { symbol: "BNB", name: "BNB", price: "$589.14", change: 0.41, cap: "$85.7B" },
];

export function MarketTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="市场快照" subtitle="Global Market Snapshot">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="总市值" value="$2.41T" change="+1.6%" changeTone="up" />
          <StatTile label="24H 成交额" value="$96.8B" change="+4.1%" changeTone="up" />
          <StatTile label="BTC 占比" value="55.2%" />
          <StatTile label="恐惧贪婪指数" value="68 · 贪婪" />
        </div>
      </Section>

      <Section title="涨跌幅排行" subtitle="Top Gainers & Losers (24H)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[{ title: "涨幅榜", list: gainers }, { title: "跌幅榜", list: losers }].map(({ title, list }) => (
            <div key={title} className="rounded-xl border border-border/70">
              <div className="border-b border-border/70 bg-secondary/30 px-4 py-2 text-[12.5px] font-semibold text-foreground">
                {title}
              </div>
              <div className="divide-y divide-border/40">
                {list.map((t) => (
                  <div key={t.symbol} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-foreground">{t.symbol}</span>{" "}
                      <span className="text-[11.5px] text-muted-foreground">{t.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-foreground">{t.price}</div>
                      <div className={cn("text-[11.5px] font-medium", t.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {t.change >= 0 ? "+" : ""}
                        {t.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="自选" subtitle="Watchlist">
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">币种</th>
                <th className="px-4 py-2.5 font-medium">价格</th>
                <th className="px-4 py-2.5 font-medium">24H</th>
                <th className="px-4 py-2.5 font-medium">市值</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((t) => (
                <tr key={t.symbol} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{t.symbol}</span>{" "}
                    <span className="text-[11.5px] text-muted-foreground">{t.name}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">{t.price}</td>
                  <td className={cn("px-4 py-2.5 font-mono tabular-nums", t.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {t.change >= 0 ? "+" : ""}
                    {t.change.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">{t.cap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
