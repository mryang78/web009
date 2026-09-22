"use client";

// ─────────────────────────────────────────────────────────────────────────────
// KPI 实时跑马灯 — 顶部安全态势数字条（仅模拟数据）
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiItem {
  label: string;
  value: string;
  change?: number;   // % change from last hour, positive = worse for threats
  unit?: string;
  trend?: "up" | "down" | "flat";
  trendBad?: boolean; // true = up is bad (e.g. active threats)
}

const INITIAL_KPIS: KpiItem[] = [
  { label: "监控钱包",        value: "3,241",  change: +0.3,   trend: "up",   trendBad: false },
  { label: "今日拦截攻击",    value: "17",     change: +12,    trend: "up",   trendBad: true  },
  { label: "链上风险资产",    value: "$4.2M",  change: -5.2,   trend: "down", trendBad: false },
  { label: "活跃告警",        value: "8",      change: 0,      trend: "flat"                  },
  { label: "ETH Gas",          value: "23 Gwei",change: -8.1,  trend: "down", trendBad: false },
  { label: "高危地址",         value: "142",   change: +2,     trend: "up",   trendBad: true  },
  { label: "待复核授权",       value: "31",    change: +5,     trend: "up",   trendBad: true  },
  { label: "今日扫描交易",    value: "1,204",  change: +18,    trend: "up",   trendBad: false },
  { label: "规则命中率",       value: "98.4%", change: +0.1,   trend: "up",   trendBad: false },
  { label: "平均响应时间",     value: "142ms", change: -12,    trend: "down", trendBad: false },
];

// Deterministic tiny sparkline — seeded by index so it stays stable across
// re-renders instead of jittering on every KPI value tick.
function Sparkline({ seed, tone }: { seed: number; tone: "up" | "down" | "flat" }) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const n = Math.sin(seed * 12.9898 + i * 4.1414) * 43758.5453;
    return (n - Math.floor(n)); // 0..1 pseudo-random, deterministic
  });
  const w = 28, h = 10;
  const path = pts
    .map((p, i) => `${(i / (pts.length - 1)) * w},${h - p * h}`)
    .join(" ");
  const color = tone === "up" ? "text-emerald-400/60" : tone === "down" ? "text-red-400/50" : "text-muted-foreground/40";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={cn("shrink-0", color)} aria-hidden>
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function jitterValue(v: string): string {
  // 轻微抖动数字
  const num = parseFloat(v.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return v;
  const jittered = num * (1 + (Math.random() - 0.5) * 0.02);
  if (v.includes("$")) return `$${(jittered / 1e6).toFixed(1)}M`;
  if (v.includes("%")) return `${jittered.toFixed(1)}%`;
  if (v.includes("ms")) return `${Math.round(jittered)}ms`;
  if (v.includes("Gwei")) return `${Math.round(jittered)} Gwei`;
  if (num > 1000) return Math.round(jittered).toLocaleString();
  return Math.round(jittered).toString();
}

export function KpiTicker() {
  const [kpis, setKpis] = useState(INITIAL_KPIS);

  useEffect(() => {
    const t = setInterval(() => {
      setKpis((prev) =>
        prev.map((k) => ({
          ...k,
          value: jitterValue(k.value),
        }))
      );
    }, 4_500);
    return () => clearInterval(t);
  }, []);

  const TrendIcon = (trend?: "up" | "down" | "flat", trendBad?: boolean) => {
    if (trend === "flat") return <Minus className="size-2.5 text-muted-foreground/50" />;
    if (trend === "up")
      return <TrendingUp className={cn("size-2.5", trendBad ? "text-red-400" : "text-emerald-400")} />;
    if (trend === "down")
      return <TrendingDown className={cn("size-2.5", trendBad ? "text-emerald-400" : "text-amber-400")} />;
    return null;
  };

  return (
    <div className="flex h-8 items-center gap-0 overflow-hidden border-b border-border/30 bg-gradient-to-r from-primary/6 via-transparent to-transparent">
      {/* Left brand tag */}
      <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border/40 bg-primary/10 px-3">
        <span className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        <Shield className="size-2.5 text-primary/70" />
        <span className="text-glow-primary text-[9.5px] font-bold tracking-widest text-primary/80 uppercase">LIVE</span>
      </div>

      {/* Scrolling KPI items */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex animate-[ticker_40s_linear_infinite] items-center gap-0 whitespace-nowrap"
          style={{ animationPlayState: "running" }}
        >
          {/* Double the list for seamless loop */}
          {[...kpis, ...kpis].map((k, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-1.5 border-r border-border/20 px-4"
            >
              <span className="text-[10px] text-muted-foreground/50">{k.label}</span>
              <span className="font-data text-[10.5px] font-semibold text-foreground/80">{k.value}</span>
              <Sparkline seed={i + 1} tone={k.trend ?? "flat"} />
              {TrendIcon(k.trend, k.trendBad)}
              {k.change !== undefined && k.change !== 0 && (
                <span className={cn(
                  "font-data text-[9.5px]",
                  k.trend === "up"
                    ? k.trendBad ? "text-red-400/70" : "text-emerald-400/70"
                    : k.trendBad ? "text-emerald-400/70" : "text-amber-400/70"
                )}>
                  {k.change > 0 ? "+" : ""}{k.change.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
