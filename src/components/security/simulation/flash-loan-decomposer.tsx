"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 闪电贷原子交易解构面板 — 单区块原子操作分析（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Zap, TrendingUp, Timer, Layers, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

// ─── Types ────────────────────────────────────────────────────────────────────
type StepType = "BORROW" | "SWAP" | "DRAIN" | "REPAY" | "PROFIT";

interface TxStep {
  type: StepType;
  label: string;
  sublabel: string;
  protocol: string;
  gasUsed: number;
  valueIn: string;
  valueOut: string;
  calldata: string;
  profit?: string;
  color: string;
}

// ─── Transaction steps ────────────────────────────────────────────────────────
const TX_STEPS: TxStep[] = [
  {
    type: "BORROW",
    label: "闪电贷借款",
    sublabel: "单区块无抵押借款",
    protocol: "Aave V3",
    gasUsed: 48_200,
    valueIn:  "0 ETH (无抵押)",
    valueOut: "500 ETH (借入)",
    calldata: "flashLoan(0xABc1..fe32, [WETH], [500e18], [0], 0x, 0)",
    color: "text-violet-400",
  },
  {
    type: "SWAP",
    label: "价格操纵 Swap",
    sublabel: "推高 / 压低 oracle 报价",
    protocol: "Uniswap V2",
    gasUsed: 92_400,
    valueIn:  "500 ETH",
    valueOut: "480 ETH  ⟶  USDC 价格 +12.4%",
    calldata: "swapExactTokensForTokens(500e18, 0, [WETH,USDC], attacker, ∞)",
    color: "text-amber-400",
  },
  {
    type: "DRAIN",
    label: "漏洞利用 / 重入",
    sublabel: "使用被操纵价格清算 / 提款",
    protocol: "YieldVault (target)",
    gasUsed: 2_840_000,
    valueIn:  "操纵后预言机价格",
    valueOut: "284.3 ETH + $1,240,000 USDC",
    calldata: "attack() → withdraw(10e18) × 28 (reentrancy)",
    color: "text-red-400",
  },
  {
    type: "REPAY",
    label: "归还闪电贷",
    sublabel: "还款 + 0.09% 手续费",
    protocol: "Aave V3",
    gasUsed: 38_600,
    valueIn:  "500 ETH + 0.45 ETH (fee)",
    valueOut: "500.45 ETH 还款完成",
    calldata: "WETH.approve(aave, 500.45e18)  [auto-triggered by Aave callback]",
    color: "text-sky-400",
  },
  {
    type: "PROFIT",
    label: "净利润结算",
    sublabel: "扣除 gas 后攻击者净得",
    protocol: "攻击者 EOA",
    gasUsed: 12_000,
    valueIn:  "284.3 ETH + $1,240,000 USDC",
    valueOut: "净利润 ≈ $1,420,000 USD",
    calldata: "— (no external call, internal balance delta)",
    profit: "+$1,420,000",
    color: "text-emerald-400",
  },
];

const STEP_BG: Record<StepType, string> = {
  BORROW: "border-violet-500/30 bg-violet-500/5",
  SWAP:   "border-amber-500/30  bg-amber-500/5",
  DRAIN:  "border-red-500/30    bg-red-500/5",
  REPAY:  "border-sky-500/30    bg-sky-500/5",
  PROFIT: "border-emerald-500/30 bg-emerald-500/5",
};

const STEP_DOT: Record<StepType, string> = {
  BORROW: "bg-violet-500",
  SWAP:   "bg-amber-500",
  DRAIN:  "bg-red-500",
  REPAY:  "bg-sky-500",
  PROFIT: "bg-emerald-500",
};

// ─── Gas bar ──────────────────────────────────────────────────────────────────
function GasAccumulator({ steps }: { steps: TxStep[] }) {
  const total = steps.reduce((s, t) => s + t.gasUsed, 0);
  const [cum, setCum]   = useState<number[]>(steps.map(() => 0));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Staggered fill
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    steps.forEach((s, i) => {
      acc += s.gasUsed;
      const snap = acc;
      timeouts.push(setTimeout(() => {
        setCum(prev => {
          const n = [...prev]; n[i] = snap; return n;
        });
      }, 400 + i * 320));
    });
    timeouts.push(setTimeout(() => setReady(true), 400 + steps.length * 320 + 200));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="mt-3 rounded-xl border border-border/50 bg-secondary/15 px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground/60 flex items-center gap-1.5">
          <Timer className="size-3" /> Gas 累计消耗
        </span>
        <span className={cn("font-data font-semibold transition-colors", ready ? "text-orange-400" : "text-muted-foreground/30")}>
          {ready ? `${(total / 1_000).toFixed(1)}K gas  ≈  ${(total * 15 * 1e-9 * 3000).toFixed(3)} ETH` : "计算中…"}
        </span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-muted/30">
        {steps.map((s, i) => {
          const pct = (s.gasUsed / total) * 100;
          const colors = ["bg-violet-500", "bg-amber-500", "bg-red-500", "bg-sky-500", "bg-emerald-500"];
          return (
            <div
              key={i}
              style={{ width: cum[i] > 0 ? `${pct}%` : "0%", transition: "width 0.5s ease" }}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", colors[i])}
              title={`${s.label}: ${(s.gasUsed / 1000).toFixed(0)}K`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between">
        {steps.map((s, i) => {
          const colors = ["text-violet-400", "text-amber-400", "text-red-400", "text-sky-400", "text-emerald-400"];
          return (
            <span key={i} className={cn("text-[9.5px] font-data", colors[i])}>
              {(s.gasUsed / 1000).toFixed(0)}K
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function FlashLoanDecomposer({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [visible,  setVisible]  = useState(0);

  useEffect(() => {
    // Reveal steps one by one
    const interval = setInterval(() => {
      setVisible(v => {
        if (v >= TX_STEPS.length) { clearInterval(interval); return v; }
        return v + 1;
      });
    }, 350);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-violet-400" />
          <span className="text-[13px] font-semibold text-foreground/85">闪电贷原子交易解构</span>
          
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <Zap className="size-3 text-amber-400" /> Block #21,408,005
          </span>
          <span className="flex items-center gap-1">
            <Timer className="size-3" /> Tx time: ~12s
          </span>
        </div>
      </div>

      {/* Block info bar */}
      <div className="flex gap-4 border-b border-border/40 bg-secondary/10 px-4 py-2 text-[10.5px] text-muted-foreground/50">
        <span>From: <span className="text-foreground/60 font-data">0xABc1...fe32</span></span>
        <span>Gas limit: <span className="text-foreground/60 font-data">5,000,000</span></span>
        <span>Gas price: <span className="text-foreground/60 font-data">45 gwei</span></span>
        <span>Nonce: <span className="text-foreground/60 font-data">7</span></span>
        <span className="ml-auto text-amber-400 font-semibold">原子执行 — 任一步骤失败则整笔回滚</span>
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-2">
        {TX_STEPS.map((step, i) => {
          const isVisible = i < visible;
          const isExpanded = expanded === i;
          return (
            <div
              key={step.type}
              className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <div
                className={cn(
                  "rounded-xl border px-3 py-2.5 cursor-pointer transition-all",
                  STEP_BG[step.type],
                  isExpanded ? "rounded-b-none border-b-0" : ""
                )}
                onClick={() => setExpanded(isExpanded ? null : i)}
              >
                <div className="flex items-center gap-3">
                  {/* Step number */}
                  <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", STEP_DOT[step.type])}>
                    {i + 1}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[12px] font-semibold", step.color)}>{step.label}</span>
                      <span className="text-[10px] text-muted-foreground/40">{step.sublabel}</span>
                      <span className="ml-1 rounded bg-background/30 border border-border/40 px-1.5 py-0.5 text-[9.5px] text-muted-foreground/60 font-data">
                        {step.protocol}
                      </span>
                      {step.profit && (
                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
                          <TrendingUp className="size-3" />{step.profit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gas */}
                  <span className="text-[10px] font-data text-muted-foreground/40 shrink-0">
                    {(step.gasUsed / 1000).toFixed(0)}K gas
                  </span>

                  <ChevronRight className={cn("size-3.5 text-muted-foreground/30 transition-transform", isExpanded ? "rotate-90" : "")} />
                </div>

                {/* Inline value flow */}
                <div className="mt-1.5 flex items-center gap-2 pl-9 text-[10px] text-muted-foreground/50">
                  <span className="font-data">{step.valueIn}</span>
                  <ChevronRight className="size-3 shrink-0 text-muted-foreground/20" />
                  <span className={cn("font-data", step.color)}>{step.valueOut}</span>
                </div>
              </div>

              {/* Expanded calldata */}
              {isExpanded && (
                <div className={cn(
                  "rounded-b-xl border border-t-0 px-3 py-2.5",
                  STEP_BG[step.type]
                )}>
                  <p className="mb-1 text-[10px] text-muted-foreground/40 uppercase tracking-wider">Calldata</p>
                  <code className="block font-data text-[10.5px] text-foreground/60 break-all leading-relaxed">
                    {step.calldata}
                  </code>
                  <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground/40">
                    <span>Gas used: <span className="font-data text-foreground/50">{step.gasUsed.toLocaleString()}</span></span>
                    <span>Protocol: <span className="font-data text-foreground/50">{step.protocol}</span></span>
                    <span className="flex items-center gap-0.5 text-emerald-400/70">
                      <CheckCircle2 className="size-3" /> 执行成功
                    </span>
                  </div>
                </div>
              )}

              {/* Connector arrow */}
              {i < TX_STEPS.length - 1 && isVisible && (
                <div className="flex justify-center py-0.5">
                  <div className="h-3 w-px bg-border/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gas accumulator chart */}
      {visible >= TX_STEPS.length && (
        <div className="border-t border-border/40 px-4 pb-3">
          <GasAccumulator steps={TX_STEPS} />
        </div>
      )}
    </div>
  );
}
