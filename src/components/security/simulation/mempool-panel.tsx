"use client";
// ─────────────────────────────────────────────────────────────────────────────
// Mempool 实时待处理交易可视化面板
// 展示 MEV Bot 竞争、待处理 tx 队列、Gas 价格竞争
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { Layers, Zap, Bot, ArrowUpDown, Clock } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

// ── 待处理交易类型 ──
type TxType = "ATTACK" | "MEV" | "NORMAL" | "LIQUIDATION" | "ARBITRAGE";

interface PendingTx {
  hash: string;
  from: string;
  to: string;
  gasPrice: number;   // Gwei
  value: string;      // e.g. "1.2 ETH"
  type: TxType;
  age: number;        // seconds in pool
  mevBot?: string;    // bot label
}

const TX_TYPE_STYLE: Record<TxType, { badge: string; dot: string; label: string }> = {
  ATTACK:      { badge: "bg-red-500/15 text-red-400",      dot: "bg-red-500 animate-pulse",    label: "攻击交易" },
  MEV:         { badge: "bg-violet-500/15 text-violet-400", dot: "bg-violet-500 animate-pulse", label: "MEV Bot"  },
  NORMAL:      { badge: "bg-sky-500/10 text-sky-400",       dot: "bg-sky-400",                  label: "普通交易" },
  LIQUIDATION: { badge: "bg-orange-500/15 text-orange-400", dot: "bg-orange-400",               label: "清算"     },
  ARBITRAGE:   { badge: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400",            label: "套利"     },
};

const MEV_BOTS = ["jaredfromsubway.eth", "0xBOT…4421", "FlashbotsMEV", "sandwich.bot", "arb.eth"];
const ADDRS = [
  "0xA2F1…8B4C", "0xD3E5…2C1A", "0x7BAC…4F2D", "0xF912…9D3B",
  "0x1234…abcd", "0x5678…efgh", "0x9abc…ijkl",
];

function randAddr() { return ADDRS[Math.floor(Math.random() * ADDRS.length)]; }
function randGas(base = 30)  { return +(base + (Math.random() - 0.5) * 20).toFixed(1); }
function randHash() {
  const hex = "0123456789abcdef";
  return "0x" + Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join("") + "…" +
         Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join("");
}

function generateInitialPool(isPlaying: boolean): PendingTx[] {
  const pool: PendingTx[] = [];
  // Seed with normal transactions
  for (let i = 0; i < 12; i++) {
    const type: TxType = i === 0 && isPlaying ? "ATTACK" : i < 3 ? "MEV" : i < 5 ? "ARBITRAGE" : i === 5 ? "LIQUIDATION" : "NORMAL";
    pool.push({
      hash: randHash(),
      from: randAddr(),
      to: randAddr(),
      gasPrice: type === "MEV" ? randGas(180) : type === "ATTACK" ? randGas(220) : randGas(32),
      value: type === "LIQUIDATION" ? `${(Math.random() * 50 + 5).toFixed(1)} ETH` : `${(Math.random() * 2).toFixed(3)} ETH`,
      type,
      age: Math.floor(Math.random() * 30),
      mevBot: type === "MEV" ? MEV_BOTS[Math.floor(Math.random() * MEV_BOTS.length)] : undefined,
    });
  }
  // Sort by gas price desc (miners prefer highest gas)
  return pool.sort((a, b) => b.gasPrice - a.gasPrice);
}

// ── Gas 竞争态势（历史 basefee 模拟） ──
function generateGasHistory() {
  let base = 28;
  return Array.from({ length: 20 }, (_, i) => {
    base += (Math.random() - 0.5) * 8;
    base = Math.max(8, Math.min(300, base));
    return { t: i, basefee: +base.toFixed(1) };
  });
}

export function MempoolPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [pool, setPool]       = useState<PendingTx[]>(() => generateInitialPool(snapshot.playing));
  const [gasHistory, setGasHistory] = useState(() => generateGasHistory());
  const [basefee, setBasefee] = useState(32.4);
  const [totalPending, setTotalPending] = useState(4821);
  const tickRef = useRef(0);

  // 每 1.2s 刷新 mempool
  useEffect(() => {
    const t = setInterval(() => {
      tickRef.current++;
      setBasefee(prev => {
        const n = +(prev + (Math.random() - 0.5) * 6).toFixed(1);
        return Math.max(6, Math.min(400, n));
      });
      setTotalPending(prev => prev + Math.floor((Math.random() - 0.3) * 30));

      setPool(prev => {
        // Remove oldest / confirmed (bottom of pool)
        let next = prev.slice(0, 11);
        // Inject new tx
        const types: TxType[] = snapshot.playing
          ? ["ATTACK", "MEV", "MEV", "NORMAL", "NORMAL", "ARBITRAGE"]
          : ["MEV", "NORMAL", "NORMAL", "NORMAL", "ARBITRAGE", "LIQUIDATION"];
        const type = types[Math.floor(Math.random() * types.length)];
        next.unshift({
          hash: randHash(),
          from: randAddr(),
          to: randAddr(),
          gasPrice: type === "MEV" ? randGas(160) : type === "ATTACK" ? randGas(210) : randGas(basefee + 5),
          value: `${(Math.random() * 3).toFixed(3)} ETH`,
          type,
          age: 0,
          mevBot: type === "MEV" ? MEV_BOTS[Math.floor(Math.random() * MEV_BOTS.length)] : undefined,
        });
        // increment age
        next = next.map(tx => ({ ...tx, age: tx.age + 1 }));
        return next.sort((a, b) => b.gasPrice - a.gasPrice);
      });

      setGasHistory(prev => {
        const last = prev[prev.length - 1];
        const nBase = +(last.basefee + (Math.random() - 0.5) * 10).toFixed(1);
        return [...prev.slice(1), { t: last.t + 1, basefee: Math.max(6, Math.min(400, nBase)) }];
      });
    }, 1200);
    return () => clearInterval(t);
  }, [snapshot.playing, basefee]);

  // Sparkline path for gas history
  const sparkW = 120, sparkH = 28;
  const gasMin = Math.min(...gasHistory.map(g => g.basefee));
  const gasMax = Math.max(...gasHistory.map(g => g.basefee));
  const gasRange = gasMax - gasMin || 1;
  const sparkPoints = gasHistory.map((g, i) => {
    const x = (i / (gasHistory.length - 1)) * sparkW;
    const y = sparkH - ((g.basefee - gasMin) / gasRange) * sparkH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const mevCount = pool.filter(t => t.type === "MEV").length;
  const attackCount = pool.filter(t => t.type === "ATTACK").length;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
      {/* ── 头部 ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-violet-400" />
            <h3 className="text-[13px] font-semibold text-foreground/90">Mempool 实时监控</h3>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-bold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              LIVE
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">待处理交易池 · 以太坊主网 Pending TX</p>
        </div>

        {/* Gas 态势 */}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5">
            <Zap className="size-3 text-amber-400" />
            <span className="font-mono text-[11px] text-amber-400 font-semibold">{basefee.toFixed(1)} Gwei</span>
            <span className="text-[10px] text-muted-foreground">base fee</span>
          </div>
          {/* mini sparkline */}
          <svg width={sparkW} height={sparkH} className="mt-0.5">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke="oklch(0.82 0.13 80)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── 摘要统计 ── */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: "待处理", value: totalPending.toLocaleString(), color: "text-foreground", icon: Clock },
          { label: "MEV Bot", value: mevCount, color: "text-violet-400", icon: Bot },
          { label: "攻击交易", value: attackCount, color: "text-red-400", icon: Zap },
          { label: "最高 Gas", value: `${pool[0]?.gasPrice ?? "--"} Gwei`, color: "text-amber-400", icon: ArrowUpDown },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-secondary/40 px-3 py-2.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Icon className="size-3" />
                {stat.label}
              </div>
              <div className={cn("mt-1 font-mono text-[14px] font-bold tabular-nums", stat.color)}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 待处理交易表格 ── */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
        {/* 表头 */}
        <div className="grid grid-cols-[80px_1fr_1fr_72px_64px_56px] gap-2 bg-secondary/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          <span>类型</span>
          <span>发送方</span>
          <span>接收方</span>
          <span className="text-right">Gas (Gwei)</span>
          <span className="text-right">价值</span>
          <span className="text-right">时间</span>
        </div>
        <div className="divide-y divide-border/30 max-h-[260px] overflow-y-auto">
          {pool.slice(0, 10).map((tx, i) => {
            const ts = TX_TYPE_STYLE[tx.type];
            return (
              <div
                key={tx.hash + i}
                className={cn(
                  "grid grid-cols-[80px_1fr_1fr_72px_64px_56px] items-center gap-2 px-3 py-2 text-[11px] transition-colors",
                  tx.type === "ATTACK" ? "bg-red-950/30" : tx.type === "MEV" ? "bg-violet-950/20" : "hover:bg-secondary/20",
                  i === 0 && "animate-[fadeIn_0.3s_ease]"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full shrink-0", ts.dot)} />
                  <span className={cn("rounded px-1 py-0.5 text-[9px] font-bold truncate", ts.badge)}>
                    {ts.label}
                  </span>
                </div>
                <span className="font-mono text-[10.5px] text-muted-foreground truncate">
                  {tx.mevBot ?? tx.from}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground truncate">{tx.to}</span>
                <span className={cn(
                  "text-right font-mono text-[10.5px] font-semibold",
                  tx.gasPrice > 150 ? "text-red-400" : tx.gasPrice > 60 ? "text-amber-400" : "text-foreground/70"
                )}>
                  {tx.gasPrice}
                </span>
                <span className="text-right font-mono text-[10.5px] text-foreground/70 truncate">{tx.value}</span>
                <span className="text-right font-mono text-[10px] text-muted-foreground/50">{tx.age}s</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MEV 竞争说明 ── */}
      {snapshot.playing && mevCount > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-500/8 border border-violet-500/20 px-3 py-2.5">
          <Bot className="mt-0.5 size-3.5 shrink-0 text-violet-400" />
          <p className="text-[11px] text-violet-300/80 leading-relaxed">
            检测到 <span className="font-semibold text-violet-400">{mevCount} 个 MEV Bot</span> 正在竞争抢跑本次攻击交易。
            最高出价 <span className="font-mono font-semibold text-amber-400">{pool.filter(t => t.type === "MEV")[0]?.gasPrice ?? "--"} Gwei</span>，
            三明治攻击风险升高。
          </p>
        </div>
      )}
    </div>
  );
}
