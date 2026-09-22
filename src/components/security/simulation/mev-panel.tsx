"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MEV 分析面板 — 三明治攻击 / 抢跑 / 套利路径（仅模拟数据）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Activity, TrendingUp, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type MevType = "SANDWICH" | "FRONTRUN" | "BACKRUN" | "ARBITRAGE" | "LIQUIDATION";

interface MevBundle {
  id: string;
  type: MevType;
  bot: string;
  victim?: string;
  profit: number;       // USD
  victimLoss: number;   // USD
  gasSpend: number;     // USD
  gasPrice: number;     // Gwei
  blockNumber: number;
  txCount: number;
  pool: string;
  tokenPair: string;
}

interface SandwichStep {
  label: string;
  from: string;
  to: string;
  amount: string;
  price: string;
  type: "frontrun" | "victim" | "backrun";
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const BUNDLES: MevBundle[] = [
  {
    id: "mev-001", type: "SANDWICH", bot: "0xMEV...b0t1",
    victim: "0x71D3...A82F", profit: 4_820, victimLoss: 6_210, gasSpend: 1_390,
    gasPrice: 142, blockNumber: 19_847_310, txCount: 3, pool: "Uniswap v3 0.3%",
    tokenPair: "ETH / USDC",
  },
  {
    id: "mev-002", type: "ARBITRAGE", bot: "0xARB...b0t2",
    victim: undefined, profit: 12_440, victimLoss: 0, gasSpend: 3_100,
    gasPrice: 98, blockNumber: 19_847_288, txCount: 2, pool: "Curve + Uniswap v2",
    tokenPair: "USDC / DAI / USDT",
  },
  {
    id: "mev-003", type: "FRONTRUN", bot: "0xFRN...b0t3",
    victim: "0xA1b2...9f3C", profit: 2_180, victimLoss: 3_440, gasSpend: 1_260,
    gasPrice: 210, blockNumber: 19_847_201, txCount: 2, pool: "Uniswap v3 0.05%",
    tokenPair: "WBTC / ETH",
  },
  {
    id: "mev-004", type: "LIQUIDATION", bot: "0xLIQ...b0t4",
    victim: "0x3fe1...8800", profit: 8_800, victimLoss: 18_400, gasSpend: 2_100,
    gasPrice: 88, blockNumber: 19_847_099, txCount: 1, pool: "Aave v3",
    tokenPair: "WETH collateral",
  },
];

const SANDWICH_STEPS: SandwichStep[] = [
  { label: "①前插买入",  from: "MEV Bot",  to: "Uniswap v3", amount: "12.4 ETH",  price: "3,241 USDC", type: "frontrun" },
  { label: "②受害者交换", from: "0x71D3...A82F", to: "Uniswap v3", amount: "8.2 ETH", price: "3,309 USDC", type: "victim" },
  { label: "③后插卖出",  from: "MEV Bot",  to: "Uniswap v3", amount: "12.4 ETH",  price: "3,336 USDC", type: "backrun" },
];

const MEV_TYPE_META: Record<MevType, { label: string; color: string; bg: string }> = {
  SANDWICH:    { label: "三明治",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" },
  FRONTRUN:    { label: "抢跑",    color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
  BACKRUN:     { label: "跟跑",    color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  ARBITRAGE:   { label: "套利",    color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/30" },
  LIQUIDATION: { label: "清算套利", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
};

// ─── Live gas tracker ─────────────────────────────────────────────────────────
function GasBar({ label, gwei, max, color }: { label: string; gwei: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10.5px]">
        <span className="text-muted-foreground/60">{label}</span>
        <span className={cn("font-mono font-semibold", color)}>{gwei} Gwei</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color.replace("text-", "bg-"))}
          style={{ width: `${Math.min((gwei / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function MevPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [tab, setTab] = useState<"bundles" | "sandwich" | "stats">("bundles");
  const [gasData, setGasData] = useState({ base: 22, priority: 2, mevPriority: 142 });

  // Simulated live gas
  useEffect(() => {
    const t = setInterval(() => {
      setGasData({
        base: Math.round(18 + Math.random() * 12),
        priority: Math.round(1 + Math.random() * 3),
        mevPriority: Math.round(80 + Math.random() * 120),
      });
    }, 3_500);
    return () => clearInterval(t);
  }, []);

  const totalMevProfit = BUNDLES.reduce((s, b) => s + b.profit, 0);
  const totalVictimLoss = BUNDLES.reduce((s, b) => s + b.victimLoss, 0);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-amber-400/70" />
            <h3 className="text-[12.5px] font-semibold text-foreground/80">MEV 提取分析</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            最近 {BUNDLES.length} 个 Bundle · 总提取 ${totalMevProfit.toLocaleString()} · 受害者损失 ${totalVictimLoss.toLocaleString()}
          </p>
        </div>

        {/* Gas live indicators */}
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-black/20 px-3 py-2">
          <Zap className="size-3.5 text-amber-400/60" />
          <div className="text-[10.5px]">
            <span className="text-muted-foreground/50">Base </span>
            <span className="font-mono font-semibold text-foreground/80">{gasData.base}</span>
            <span className="mx-1.5 text-muted-foreground/30">·</span>
            <span className="text-muted-foreground/50">MEV </span>
            <span className="font-mono font-semibold text-red-400">{gasData.mevPriority}</span>
            <span className="text-muted-foreground/40"> Gwei</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1 border-b border-border/40">
        {([
          { key: "bundles",  label: `Bundle 列表 (${BUNDLES.length})` },
          { key: "sandwich", label: "三明治解析" },
          { key: "stats",    label: "Gas 竞争" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-3 py-1.5 text-[11.5px] font-semibold transition-colors border-b-2 -mb-px",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Bundle list */}
      {tab === "bundles" && (
        <div className="mt-3 space-y-2">
          {BUNDLES.map((b) => {
            const meta = MEV_TYPE_META[b.type];
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/40 bg-black/15 p-3 text-[12px]">
                {/* Type badge */}
                <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold", meta.bg, meta.color)}>
                  {meta.label}
                </span>

                {/* Bot */}
                <span className="font-mono text-[10.5px] text-muted-foreground/70 min-w-0 truncate">{b.bot}</span>

                {/* Victim */}
                {b.victim && (
                  <>
                    <span className="text-muted-foreground/30">→</span>
                    <span className="font-mono text-[10.5px] text-amber-300/70 min-w-0 truncate">{b.victim}</span>
                  </>
                )}

                <div className="ml-auto flex items-center gap-3 text-[11px]">
                  {/* Token pair */}
                  <span className="hidden text-muted-foreground/50 sm:block">{b.tokenPair}</span>

                  {/* Gas */}
                  <div className="flex items-center gap-1 text-muted-foreground/50">
                    <Zap className="size-3" />
                    <span className="font-mono">{b.gasPrice}G</span>
                  </div>

                  {/* Victim loss */}
                  {b.victimLoss > 0 && (
                    <span className="font-semibold text-amber-400">
                      受害损失 ${b.victimLoss.toLocaleString()}
                    </span>
                  )}

                  {/* Profit */}
                  <span className={cn("font-bold", b.type === "ARBITRAGE" ? "text-sky-400" : "text-emerald-400")}>
                    +${b.profit.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Sandwich step-by-step */}
      {tab === "sandwich" && (
        <div className="mt-4 space-y-1">
          <p className="mb-4 text-[11.5px] text-muted-foreground/70">
            以 Bundle <span className="font-mono text-foreground/70">mev-001</span> 为例，解析三明治攻击完整路径：
          </p>

          {SANDWICH_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "flex min-w-0 flex-1 items-start gap-2 rounded-xl border p-3 text-[12px]",
                step.type === "frontrun" ? "border-amber-500/30 bg-amber-500/8" :
                step.type === "victim"   ? "border-red-500/30 bg-red-500/8" :
                                           "border-emerald-500/30 bg-emerald-500/8"
              )}>
                <span className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold",
                  step.type === "frontrun" ? "bg-amber-500/15 text-amber-400" :
                  step.type === "victim"   ? "bg-red-500/15 text-red-400" :
                                             "bg-emerald-500/15 text-emerald-400"
                )}>
                  {step.label}
                </span>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[11.5px]">
                  <span className="font-mono text-sky-300/70 truncate">{step.from}</span>
                  <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
                  <span className="font-mono text-sky-300/70 truncate">{step.to}</span>
                  <span className="ml-auto shrink-0">
                    <span className="text-foreground/80 font-semibold">{step.amount}</span>
                    <span className="ml-1.5 text-muted-foreground/50">@ {step.price}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Profit summary */}
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[12px]">
            <TrendingUp className="size-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-muted-foreground/70">MEV Bot 净利润：</span>
              <span className="font-bold text-emerald-400"> +$4,820</span>
            </div>
            <div className="ml-auto">
              <span className="text-muted-foreground/70">受害者额外滑点损失：</span>
              <span className="font-bold text-red-400"> -$6,210</span>
            </div>
          </div>

          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/8 p-2.5">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400/70" />
            <p className="text-[10.5px] text-muted-foreground/70">
              受害者原本应以 3,241 USDC/ETH 成交，因被夹击实际成交价为 3,309（+2.1%）。
              设置合理滑点保护（如 0.5%）可有效抵御三明治攻击。
            </p>
          </div>
        </div>
      )}

      {/* Tab: Gas competition */}
      {tab === "stats" && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border/40 bg-black/15 p-3">
              <p className="text-[11px] font-semibold text-foreground/70">当前 Gas 竞争</p>
              <GasBar label="Base Fee"        gwei={gasData.base}         max={100} color="text-sky-400" />
              <GasBar label="Normal Priority" gwei={gasData.priority}     max={20}  color="text-emerald-400" />
              <GasBar label="MEV Priority"    gwei={gasData.mevPriority}  max={300} color="text-red-400" />
            </div>

            <div className="space-y-2 rounded-xl border border-border/40 bg-black/15 p-3">
              <p className="text-[11px] font-semibold text-foreground/70 mb-3">MEV 提取分布</p>
              {BUNDLES.map((b) => {
                const meta = MEV_TYPE_META[b.type];
                const pct = Math.round((b.profit / totalMevProfit) * 100);
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex justify-between text-[10.5px]">
                      <span className={meta.color}>{meta.label}</span>
                      <span className="font-mono text-muted-foreground/60">${b.profit.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={cn("h-full rounded-full transition-all", meta.color.replace("text-", "bg-"))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "MEV 总利润", val: `$${totalMevProfit.toLocaleString()}`, color: "text-emerald-400" },
              { label: "受害者总损失", val: `$${totalVictimLoss.toLocaleString()}`, color: "text-red-400" },
              { label: "Bot 倍率",  val: `${(totalMevProfit / (totalVictimLoss || 1) * 100).toFixed(0)}%`, color: "text-amber-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl border border-border/40 bg-black/15 p-3">
                <div className={cn("text-lg font-bold", color)}>{val}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
