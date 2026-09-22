"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 实时资产提取进度面板 — 动态 token 抽取可视化（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { ArrowRight, TrendingDown, TrendingUp, Wallet, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TokenDrain {
  symbol: string;
  decimals: number;
  priceUsd: number;
  victimInitial: number;
  victimFinal: number;
  attackerInitial: number;
  attackerFinal: number;
  color: string;
  icon: string;
}

interface TransferEvent {
  id: number;
  symbol: string;
  amount: number;
  ts: number;
  color: string;
}

// ─── Token data ────────────────────────────────────────────────────────────────
const TOKENS: TokenDrain[] = [
  {
    symbol: "ETH",
    decimals: 18,
    priceUsd: 3_450,
    victimInitial: 284.3,
    victimFinal:   0,
    attackerInitial: 0,
    attackerFinal: 283.86, // after gas
    color: "#627EEA",
    icon: "Ξ",
  },
  {
    symbol: "USDC",
    decimals: 6,
    priceUsd: 1.0,
    victimInitial: 1_240_000,
    victimFinal:   0,
    attackerInitial: 0,
    attackerFinal: 1_238_800, // after swap slippage
    color: "#2775CA",
    icon: "$",
  },
  {
    symbol: "WBTC",
    decimals: 8,
    priceUsd: 68_200,
    victimInitial: 1.24,
    victimFinal:   0,
    attackerInitial: 0,
    attackerFinal: 1.238,
    color: "#F7931A",
    icon: "₿",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function formatAmount(amount: number, symbol: string) {
  if (symbol === "USDC") return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (symbol === "WBTC") return `${amount.toFixed(3)} BTC`;
  return `${amount.toFixed(2)} ETH`;
}

function usdValue(token: TokenDrain, amount: number) {
  return (amount * token.priceUsd).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── BalanceBar component ──────────────────────────────────────────────────────
function BalanceBar({ label, amount, max, color, side }: {
  label: string; amount: number; max: number; color: string; side: "victim" | "attacker";
}) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div className={cn("flex flex-col gap-1", side === "attacker" ? "items-end" : "items-start")}>
      <span className="text-[10px] text-muted-foreground/50">{label}</span>
      <div className={cn("h-2 w-full rounded-full bg-muted/30 overflow-hidden", side === "attacker" ? "direction-rtl" : "")}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AssetExtractionPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const DURATION_MS = 12_000; // 12 second animation
  const [progress,  setProgress]  = useState(0); // 0 → 1
  const [running,   setRunning]   = useState(false);
  const [complete,  setComplete]  = useState(false);
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [nextId,    setNextId]    = useState(0);
  const startRef  = useRef<number>(0);
  const rafRef    = useRef<number>(0);
  const tEventRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedRef   = useRef<HTMLDivElement>(null);

  function startDrain() {
    if (running) return;
    setProgress(0);
    setComplete(false);
    setTransfers([]);
    setRunning(true);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION_MS, 1);
      // Ease-in-out so early tokens come fast, then slows
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        setComplete(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    // Emit transfer events
    function emitTransfer() {
      const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      const chunkPct = 0.04 + Math.random() * 0.12;
      const amount = (token.victimInitial - token.victimFinal) * chunkPct;
      setTransfers(prev => {
        const updated = [...prev.slice(-14), {
          id: nextId + 1,
          symbol: token.symbol,
          amount,
          ts: Date.now(),
          color: token.color,
        }];
        return updated;
      });
      setNextId(n => n + 1);
      setTimeout(() => feedRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
      if (running || progress < 1) {
        tEventRef.current = setTimeout(emitTransfer, 400 + Math.random() * 600);
      }
    }
    tEventRef.current = setTimeout(emitTransfer, 300);
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (tEventRef.current) clearTimeout(tEventRef.current);
    };
  }, []);

  const totalExtractedUsd = TOKENS.reduce((s, t) => {
    const drained = lerp(t.victimInitial, t.victimFinal, progress);
    return s + (t.victimInitial - drained) * t.priceUsd;
  }, 0);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-orange-400" />
          <span className="text-[13px] font-semibold text-foreground/85">实时资产提取可视化</span>
          
        </div>
        <div className="flex items-center gap-3">
          {complete && (
            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
              <TrendingDown className="size-3.5" />
              提取完成 — {usdValue({ priceUsd: 1 } as TokenDrain, totalExtractedUsd)}
            </span>
          )}
          {!running && (
            <button
              onClick={startDrain}
              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-orange-400 hover:bg-orange-500/20 transition-all"
            >
              {complete ? "重新执行" : "▶ 执行提取"}
            </button>
          )}
          {running && (
            <span className="text-[11px] font-semibold text-red-400 animate-pulse">
              ● 提取中…
            </span>
          )}
        </div>
      </div>

      {/* Overall progress */}
      {(running || complete) && (
        <div className="border-b border-border/40 bg-secondary/10 px-4 py-2">
          <div className="mb-1 flex justify-between text-[10.5px]">
            <span className="text-muted-foreground/50">总提取进度</span>
            <span className="font-mono font-bold text-red-400">{(progress * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Token drain panels */}
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        {TOKENS.map(token => {
          const victimCurrent   = lerp(token.victimInitial,   token.victimFinal,   progress);
          const attackerCurrent = lerp(token.attackerInitial, token.attackerFinal, progress);
          const drainedFrac     = token.victimInitial > 0
            ? (token.victimInitial - victimCurrent) / token.victimInitial
            : 0;

          return (
            <div
              key={token.symbol}
              className="rounded-xl border border-border/50 bg-secondary/10 p-3 space-y-2"
            >
              {/* Token header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: token.color }}
                  >
                    {token.icon}
                  </span>
                  <span className="text-[12px] font-semibold text-foreground/80">{token.symbol}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: token.color }}>
                  {usdValue(token, victimCurrent)}
                </span>
              </div>

              {/* Drain visual */}
              <div className="relative">
                <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${(1 - drainedFrac) * 100}%`,
                      backgroundColor: token.color,
                      opacity: 0.7,
                    }}
                  />
                  {/* Red drain indicator */}
                  <div
                    className="absolute top-0 right-0 h-full rounded-r-full bg-red-500/30 transition-none"
                    style={{ width: `${drainedFrac * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9.5px] text-muted-foreground/40 font-mono">
                  <span>{formatAmount(victimCurrent, token.symbol)}</span>
                  <span className="text-red-400/70">-{formatAmount(token.victimInitial - victimCurrent, token.symbol)}</span>
                </div>
              </div>

              {/* Transfer arrow */}
              <div className="flex items-center gap-2">
                {/* Victim wallet */}
                <div className="flex-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-center">
                  <p className="text-[8.5px] text-muted-foreground/40">受害合约</p>
                  <p className="font-mono text-[10px] text-red-400 font-semibold">
                    {formatAmount(victimCurrent, token.symbol)}
                  </p>
                  <p className="text-[8.5px] text-muted-foreground/30">0x7f3D…29ab</p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowRight className={cn("size-4 transition-all", drainedFrac > 0 ? "text-orange-400" : "text-muted-foreground/20")} />
                  {drainedFrac > 0.01 && (
                    <span className="text-[8.5px] font-mono text-orange-400/70 animate-pulse">drain</span>
                  )}
                </div>

                {/* Attacker wallet */}
                <div className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5 text-center">
                  <p className="text-[8.5px] text-muted-foreground/40">攻击者</p>
                  <p className="font-mono text-[10px] text-emerald-400 font-semibold">
                    {formatAmount(attackerCurrent, token.symbol)}
                  </p>
                  <p className="text-[8.5px] text-muted-foreground/30">0xd91f…44a2</p>
                </div>
              </div>

              {/* USD value */}
              <div className="flex items-center justify-between rounded-lg bg-muted/20 px-2 py-1 text-[10px]">
                <span className="text-muted-foreground/40 flex items-center gap-1">
                  <TrendingDown className="size-3 text-red-400" /> 受害
                </span>
                <span className="font-mono text-red-400/80">{usdValue(token, victimCurrent)}</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="font-mono text-emerald-400/80">{usdValue(token, attackerCurrent)}</span>
                <span className="text-muted-foreground/40 flex items-center gap-1">
                  攻击者 <TrendingUp className="size-3 text-emerald-400" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer event feed */}
      {transfers.length > 0 && (
        <div className="border-t border-border/40 bg-[oklch(0.12_0.02_270)]">
          <div className="px-4 py-2 text-[10px] text-muted-foreground/40 flex items-center justify-between">
            <span>转账事件流</span>
            <span className="font-mono">{transfers.length} events</span>
          </div>
          <div
            ref={feedRef}
            className="h-28 overflow-y-auto px-4 pb-3 space-y-0.5"
          >
            {transfers.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-[10.5px] font-mono">
                <span className="text-muted-foreground/30">{new Date(ev.ts).toISOString().slice(14, 22)}</span>
                <span className="text-muted-foreground/40">Transfer</span>
                <span style={{ color: ev.color }} className="font-semibold">
                  {ev.symbol === "USDC"
                    ? `$${ev.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : `${ev.amount.toFixed(3)} ${ev.symbol}`
                  }
                </span>
                <span className="text-red-400/50 text-[9.5px]">0x7f3D…29ab</span>
                <ArrowRight className="size-2.5 text-muted-foreground/20" />
                <span className="text-emerald-400/50 text-[9.5px]">0xd91f…44a2</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total extracted summary */}
      {(running || complete) && (
        <div className="border-t border-border/40 bg-red-500/5 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-red-400" />
            <span className="text-[11.5px] font-semibold text-foreground/70">攻击者累计获利</span>
          </div>
          <span className="font-mono text-[14px] font-bold text-red-400">
            {usdValue({ priceUsd: 1 } as TokenDrain, totalExtractedUsd)}
          </span>
        </div>
      )}
    </div>
  );
}
