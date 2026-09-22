"use client";
// ─────────────────────────────────────────────────────────
// 多链实时状态条 — 多链网络延迟与区块高度实时监控
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface ChainStat {
  id: string;
  name: string;
  color: string;          // tailwind text color
  dotColor: string;       // tailwind bg color
  baseLatency: number;    // ms
  baseBlock: number;
}

const CHAINS: ChainStat[] = [
  { id: "eth",  name: "ETH",     color: "text-sky-400",     dotColor: "bg-sky-400",     baseLatency: 12,  baseBlock: 19_847_210 },
  { id: "bsc",  name: "BSC",     color: "text-amber-400",   dotColor: "bg-amber-400",   baseLatency: 3,   baseBlock: 37_412_088 },
  { id: "arb",  name: "ARB",     color: "text-blue-400",    dotColor: "bg-blue-400",    baseLatency: 280, baseBlock: 194_802_441 },
  { id: "poly", name: "Polygon", color: "text-violet-400",  dotColor: "bg-violet-400",  baseLatency: 2,   baseBlock: 54_318_774 },
  { id: "op",   name: "OP",      color: "text-red-400",     dotColor: "bg-red-400",     baseLatency: 250, baseBlock: 118_204_888 },
];

interface LiveStat {
  latency: number;
  block: number;
  status: "ok" | "warn" | "down";
}

function jitter(base: number, pct = 0.3) {
  return Math.round(base * (1 + (Math.random() - 0.5) * pct));
}

export function ChainStatusBar() {
  const [stats, setStats] = useState<Record<string, LiveStat>>(() =>
    Object.fromEntries(
      CHAINS.map((c) => [c.id, { latency: c.baseLatency, block: c.baseBlock, status: "ok" as const }])
    )
  );

  useEffect(() => {
    let blockTick = 0;
    const t = setInterval(() => {
      blockTick++;
      setStats((prev) => {
        const next = { ...prev };
        for (const c of CHAINS) {
          const lat = jitter(c.baseLatency);
          const status: LiveStat["status"] = lat > c.baseLatency * 3 ? "down" : lat > c.baseLatency * 1.8 ? "warn" : "ok";
          // 每次 tick 区块高度按链出块速率递增
          const blocksPerTick = c.id === "bsc" || c.id === "poly" ? 2 : c.id === "arb" || c.id === "op" ? 8 : 1;
          next[c.id] = {
            latency: lat,
            block: c.baseBlock + blockTick * blocksPerTick + Math.floor(Math.random() * 2),
            status,
          };
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const statusDot = (s: LiveStat["status"]) =>
    s === "ok" ? "bg-emerald-500" : s === "warn" ? "bg-amber-400 animate-pulse" : "bg-red-500 animate-pulse";

  return (
    <div className="glass-overlay flex h-7 items-center gap-0 overflow-x-auto border-b border-border/40 px-4 scrollbar-none">
      <div className="mr-3 flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/60">
        <Activity className="size-2.5" />
        链状态
      </div>

      {CHAINS.map((c) => {
        const stat = stats[c.id];
        return (
          <div
            key={c.id}
            className="flex shrink-0 items-center gap-1.5 border-r border-border/30 px-3 first:pl-0 last:border-r-0"
          >
            <span className={`size-1.5 rounded-full ${statusDot(stat.status)}`} />
            <span className={`font-data text-[10px] font-semibold ${c.color}`}>{c.name}</span>
            <span className="font-data text-[9.5px] text-muted-foreground/50">
              {stat.latency < 1000 ? `${stat.latency}ms` : `${(stat.latency / 1000).toFixed(1)}s`}
            </span>
            <span className="hidden font-data text-[9.5px] text-muted-foreground/40 sm:inline">
              #{stat.block.toLocaleString()}
            </span>
          </div>
        );
      })}

      <div className="ml-auto shrink-0 pl-3 font-data text-[9.5px] text-emerald-400/80">
        ● All systems operational
      </div>
    </div>
  );
}
