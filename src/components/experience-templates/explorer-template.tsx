import { Search } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";

const blocks = [
  { height: "19,284,301", txs: 184, time: "6 秒前", miner: "0x4b7a...2e91" },
  { height: "19,284,300", txs: 212, time: "18 秒前", miner: "0x9F0c...77De" },
  { height: "19,284,299", txs: 167, time: "30 秒前", miner: "0x4b7a...2e91" },
  { height: "19,284,298", txs: 198, time: "42 秒前", miner: "0xA1b2...9F3C" },
];

const txs = [
  { hash: "0x8e2f...c471", from: "0x71D3...A82F", to: "0x9A2f...71EF", value: "1.284 ETH", time: "4 秒前" },
  { hash: "0x3a90...11de", from: "0x6C0f...F721", to: "0x0A5e...9E12", value: "500.00 USDT", time: "22 秒前" },
  { hash: "0xd127...8ab3", from: "0x3bC1...44F0", to: "0x7Ea4...11aB", value: "0.042 ETH", time: "51 秒前" },
];

const tokens = [
  { symbol: "USDT", name: "Tether", price: "$1.0002", change: 0.01 },
  { symbol: "ARB", name: "Arbitrum", price: "$1.084", change: 3.92 },
  { symbol: "LINK", name: "Chainlink", price: "$16.42", change: -0.68 },
];

export function ExplorerTemplate({ product }: { product: Product }) {
  const isTokenFocus = product.id === "token-explorer";
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="链上搜索" subtitle="搜索区块 / 交易 / 地址 / 代币合约">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              disabled
              placeholder="按 Block / Tx Hash / Address / Token 搜索…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          <select disabled className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
            <option>Ethereum Mainnet</option>
          </select>
        </div>
      </Section>

      <Section title="网络概览" subtitle="Network Stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="最新区块" value="19,284,301" />
          <StatTile label="Gas (Gwei)" value="18.4" change="-4.2%" changeTone="down" />
          <StatTile label="24H 交易数" value="1.24M" />
          <StatTile label="活跃合约" value="8,402" />
        </div>
      </Section>

      <Section title={isTokenFocus ? "热门 Token" : "最新区块"} subtitle={isTokenFocus ? "Trending Tokens" : "Latest Blocks"}>
        {isTokenFocus ? (
          <div className="overflow-hidden rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">代币</th>
                  <th className="px-4 py-2.5 font-medium">价格</th>
                  <th className="px-4 py-2.5 font-medium">24H</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.symbol} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-foreground">{t.symbol}</span>{" "}
                      <span className="text-[11.5px] text-muted-foreground">{t.name}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">{t.price}</td>
                    <td className={`px-4 py-2.5 font-mono tabular-nums ${t.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {t.change >= 0 ? "+" : ""}
                      {t.change.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/70">
            {blocks.map((b) => (
              <div key={b.height} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-mono font-medium text-foreground">#{b.height}</div>
                  <div className="text-[11.5px] text-muted-foreground">{b.txs} txns · miner {b.miner}</div>
                </div>
                <span className="text-[11.5px] text-muted-foreground/70">{b.time}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="最新交易" subtitle="Latest Transactions">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {txs.map((t) => (
            <div key={t.hash} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="font-mono text-[12.5px] text-primary">{t.hash}</div>
              <div className="font-mono text-[11.5px] text-muted-foreground">
                {t.from} → {t.to}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="font-mono text-[12.5px] font-medium text-foreground">{t.value}</span>
                <span className="text-[11px] text-muted-foreground/70">{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
