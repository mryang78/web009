import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";
import { cn } from "@/lib/utils";

const pools = [
  { pair: "ETH / USDT", tvl: "$284.6M", apy: "6.82%", risk: "低" },
  { pair: "SOL / USDC", tvl: "$142.1M", apy: "9.14%", risk: "中" },
  { pair: "ARB / ETH", tvl: "$68.3M", apy: "12.47%", risk: "中" },
  { pair: "wBTC / ETH", tvl: "$196.8M", apy: "4.35%", risk: "低" },
  { pair: "MATIC / USDT", tvl: "$41.9M", apy: "15.62%", risk: "高" },
];

const myPositions = [
  { pool: "ETH / USDT", staked: "$4,820.00", earned: "$182.44", status: "live" as const },
  { pool: "ARB / ETH", staked: "$1,200.00", earned: "$46.80", status: "live" as const },
];

type TxType = "Deposited" | "Earned" | "Withdrawn";

const txStyle: Record<TxType, string> = {
  Deposited: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Earned: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Withdrawn: "bg-secondary text-muted-foreground",
};

const txLabel: Record<TxType, string> = {
  Deposited: "已存入",
  Earned: "已赚取",
  Withdrawn: "已提取",
};

const transactions: { type: TxType; pool: string; amount: string; time: string }[] = [
  { type: "Deposited", pool: "ETH / USDT", amount: "$4,820.00", time: "3 天前" },
  { type: "Earned", pool: "ETH / USDT", amount: "$12.60", time: "6 小时前" },
  { type: "Deposited", pool: "ARB / ETH", amount: "$1,200.00", time: "5 天前" },
  { type: "Earned", pool: "ARB / ETH", amount: "$3.20", time: "6 小时前" },
  { type: "Withdrawn", pool: "SOL / USDC", amount: "$2,400.00", time: "2 周前" },
];

export function DeFiTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="协议概览" subtitle="Protocol Overview · 核心运营数据">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="总锁仓量 TVL" value="$733.7M" change="+3.4%" changeTone="up" />
          <StatTile label="平均 APY" value="9.68%" />
          <StatTile label="流动性池" value="48" />
          <StatTile label="活跃地址" value="18,204" />
        </div>
      </Section>

      <Section title="资金池排行" subtitle="Pool Ranking · 按 TVL 排序的流动性池">
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">资金池</th>
                <th className="px-4 py-2.5 font-medium">TVL</th>
                <th className="px-4 py-2.5 font-medium">APY</th>
                <th className="px-4 py-2.5 font-medium">风险等级</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((p) => (
                <tr key={p.pair} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{p.pair}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">{p.tvl}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{p.apy}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="我的仓位" subtitle="My Positions · 我的流动性仓位与累计收益">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {myPositions.map((p) => (
            <div key={p.pool} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13px] font-medium text-foreground">{p.pool}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  质押 {p.staked} · 累计收益 <span className="text-emerald-600 dark:text-emerald-400">{p.earned}</span>
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="交易记录" subtitle="Transaction History · 已存入 / 已赚取 / 已提取">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", txStyle[t.type])}>{txLabel[t.type]}</span>
                <span className="text-muted-foreground">{t.pool}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-foreground">{t.amount}</span>
                <span className="hidden font-mono text-[11px] text-muted-foreground/70 sm:inline">{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
