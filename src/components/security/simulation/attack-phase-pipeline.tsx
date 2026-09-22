"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 攻击阶段流水线 — 7 阶段可交互攻击执行流程（仅模拟，不执行真实交易）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  Search, FlaskConical, Upload, Zap, ArrowDownToLine,
  Shuffle, LogOut, CheckCircle2, Loader2, Clock, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

// ─── Types ────────────────────────────────────────────────────────────────────
type PhaseStatus = "PENDING" | "RUNNING" | "DONE" | "SKIPPED";

interface LogLine {
  ts: number;
  text: string;
  type: "info" | "success" | "error" | "warn" | "tx";
}

interface Phase {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  durationMs: number;
  gasUsed: number;
  valueExtractedEth: number;
  logs: string[];
}

// ─── Phase definitions ────────────────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: "recon",
    label: "目标侦察",
    sublabel: "扫描合约 ABI / 余额 / 漏洞",
    icon: Search,
    durationMs: 1800,
    gasUsed: 0,
    valueExtractedEth: 0,
    logs: [
      "[SCAN] Target: 0x7f3D...29ab (YieldVault)",
      "[ABI]  withdraw(uint256), deposit(), balanceOf(address)",
      "[BAL]  Contract balance: 284.3 ETH  |  USDC: $1,240,000",
      "[!!!!] CEI violation detected at offset 0x00A4",
      "[VULN] REENTRANCY confirmed — no reentrancy guard",
      "[INFO] Optimal attack value: 10 ETH flash loan seed",
    ],
  },
  {
    id: "validate",
    label: "漏洞验证",
    sublabel: "验证漏洞可利用性",
    icon: FlaskConical,
    durationMs: 2200,
    gasUsed: 180_000,
    valueExtractedEth: 0,
    logs: [
      "[FORK] Forking ETH mainnet @ block 21,408,002",
      "[SIM]  Deploying test attack contract...",
      "[CALL] AttackTest.probe() → YieldVault.withdraw(1 ether)",
      "[REENTER] depth=2 withdraw(1 ether) triggered ✓",
      "[REENTER] depth=3 withdraw(1 ether) triggered ✓",
      "[PROFIT] Simulated gain: +2.97 ETH / iteration",
      "[OK]   Exploit confirmed. Proceeding with live attack.",
    ],
  },
  {
    id: "deploy",
    label: "合约部署",
    sublabel: "部署攻击合约到链上",
    icon: Upload,
    durationMs: 1500,
    gasUsed: 420_000,
    valueExtractedEth: 0,
    logs: [
      "[COMPILE] Solc 0.8.19 — ReentrancyAttacker.sol",
      "[GAS]  Estimated deploy gas: 412,800",
      "[TX]   0x2c3d...e4f5  PENDING  [21,408,003]",
      "[MINED] Block 21,408,004  Gas used: 418,240",
      "[ADDR]  Attack contract deployed: 0xABc1...fe32",
      "[FUND]  Seeding contract with 10 ETH (flash loan collateral)",
    ],
  },
  {
    id: "execute",
    label: "执行攻击",
    sublabel: "重入循环抽取资金",
    icon: Zap,
    durationMs: 3000,
    gasUsed: 2_840_000,
    valueExtractedEth: 284.3,
    logs: [
      "[EXEC]  AttackContract.attack{value: 10 ETH}()",
      "[CALL]  → YieldVault.withdraw(10 ether)",
      "[SEND]  ← YieldVault sending 10 ETH to attacker...",
      "[REENTER depth=2] withdraw(10 ether) ← balance not updated yet!",
      "[REENTER depth=3] withdraw(10 ether) ✓",
      "[REENTER depth=4] withdraw(10 ether) ✓",
      "... (x28 iterations)",
      "[DRAIN] YieldVault balance: 284.3 ETH → 0.0 ETH",
      "[DRAIN] YieldVault USDC: $1,240,000 → $0",
      "[GAS]   Total gas used: 2,840,000  Cost: 0.14 ETH",
    ],
  },
  {
    id: "extract",
    label: "资产提取",
    sublabel: "归集资金至控制地址",
    icon: ArrowDownToLine,
    durationMs: 1200,
    gasUsed: 84_000,
    valueExtractedEth: 284.3,
    logs: [
      "[SWEEP] AttackContract.withdraw() called",
      "[SEND]  284.3 ETH → 0xd91f...44a2 (attacker EOA)",
      "[TX]    0x3d4e...f5a6  MINED  [21,408,007]",
      "[SWAP]  284 ETH → 1,180,000 USDC via Uniswap V3",
      "[TOTAL] Extracted: 284.3 ETH + $1,240,000 USDC",
      "[NET]   Profit after gas: ~$1,420,000 USD",
    ],
  },
  {
    id: "launder",
    label: "混币转移",
    sublabel: "Tornado Cash → 跨链桥",
    icon: Shuffle,
    durationMs: 2500,
    gasUsed: 320_000,
    valueExtractedEth: 0,
    logs: [
      "[MIX]   Splitting: 142 ETH × 2 batches",
      "[TC]    Deposit 100 ETH → Tornado Cash 100 ETH pool",
      "[TC]    Note commitment stored. Withdraw after 14 blocks.",
      "[BRIDGE] 500,000 USDC → Stargate → BSC",
      "[BSC]   Received 498,120 USDC (bridge fee 0.38%)",
      "[TC]    Withdrawal: 0x6a7b...c8d9 (new address, no history)",
    ],
  },
  {
    id: "cleanup",
    label: "痕迹清退",
    sublabel: "销毁攻击合约 / 清零关联",
    icon: LogOut,
    durationMs: 900,
    gasUsed: 38_000,
    valueExtractedEth: 0,
    logs: [
      "[SELFDESTRUCT] AttackContract.destroy() called",
      "[MINED] Contract 0xABc1...fe32 destroyed. ETH → 0x0000",
      "[CLEAN] Deployer EOA: 0 ETH balance (dust swept)",
      "[CLEAN] No remaining on-chain association",
      "[DONE]  Attack complete. Total profit: ~$1,420,000 USD",
    ],
  },
];

// ─── Phase icon colors ─────────────────────────────────────────────────────────
const PHASE_COLORS = [
  "text-sky-400",
  "text-violet-400",
  "text-amber-400",
  "text-red-400",
  "text-orange-400",
  "text-emerald-400",
  "text-slate-400",
];

// ─── Main component ────────────────────────────────────────────────────────────
export function AttackPhasePipeline({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [phaseStates,  setPhaseStates]  = useState<PhaseStatus[]>(PHASES.map(() => "PENDING"));
  const [currentPhase, setCurrentPhase] = useState<number>(-1);
  const [phaseLogs,    setPhaseLogs]    = useState<LogLine[][]>(PHASES.map(() => []));
  const [running,      setRunning]      = useState(false);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [totalGas,     setTotalGas]     = useState(0);
  const logRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isComplete = phaseStates.every(s => s === "DONE" || s === "SKIPPED");
  const isDormant  = currentPhase === -1;

  async function runPhase(idx: number) {
    if (idx >= PHASES.length) { setRunning(false); return; }
    const phase = PHASES[idx];

    setCurrentPhase(idx);
    setPhaseStates(prev => {
      const n = [...prev]; n[idx] = "RUNNING"; return n;
    });

    // Stream logs one by one
    const lineDelay = phase.durationMs / phase.logs.length;
    for (let i = 0; i < phase.logs.length; i++) {
      await new Promise(r => setTimeout(r, lineDelay));
      const logText = phase.logs[i];
      const type: LogLine["type"] =
        logText.startsWith("[OK") || logText.startsWith("[DONE") || logText.startsWith("[MINED")  ? "success"
        : logText.startsWith("[!") || logText.startsWith("[VULN") || logText.startsWith("[REENTER") ? "error"
        : logText.startsWith("[TX") || logText.startsWith("[SEND") || logText.startsWith("[DRAIN")  ? "tx"
        : logText.startsWith("[GAS") || logText.startsWith("[PROFIT")                               ? "warn"
        : "info";
      setPhaseLogs(prev => {
        const n = prev.map(l => [...l]);
        n[idx] = [...n[idx], { ts: Date.now(), text: logText, type }];
        return n;
      });
      // Auto-scroll
      setTimeout(() => {
        logRefs.current[idx]?.scrollTo({ top: 9999, behavior: "smooth" });
      }, 50);
    }

    setPhaseStates(prev => {
      const n = [...prev]; n[idx] = "DONE"; return n;
    });
    setTotalExtracted(prev => prev + phase.valueExtractedEth);
    setTotalGas(prev => prev + phase.gasUsed);
  }

  async function startAll() {
    setRunning(true);
    setPhaseStates(PHASES.map(() => "PENDING"));
    setPhaseLogs(PHASES.map(() => []));
    setTotalExtracted(0);
    setTotalGas(0);
    for (let i = 0; i < PHASES.length; i++) {
      await runPhase(i);
      await new Promise(r => setTimeout(r, 300));
    }
    setRunning(false);
  }

  function reset() {
    setPhaseStates(PHASES.map(() => "PENDING"));
    setPhaseLogs(PHASES.map(() => []));
    setCurrentPhase(-1);
    setRunning(false);
    setTotalExtracted(0);
    setTotalGas(0);
  }

  const doneCount = phaseStates.filter(s => s === "DONE").length;
  const progressPct = (doneCount / PHASES.length) * 100;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-red-400" />
          <span className="text-[13px] font-semibold text-foreground/85">攻击执行流水线</span>
          
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> 攻击完成
            </span>
          )}
          {!running && (
            <button
              onClick={isDormant || isComplete ? startAll : undefined}
              disabled={running}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all",
                isDormant || isComplete
                  ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                  : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              {isComplete ? "重新执行" : "▶ 执行攻击"}
            </button>
          )}
          {running && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <Loader2 className="size-3.5 animate-spin" /> 执行中…
            </span>
          )}
          {(isComplete || doneCount > 0) && !running && (
            <button onClick={reset} className="text-[10.5px] text-muted-foreground/50 hover:text-foreground">
              重置
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 bg-secondary/10">
        {[
          { label: "已完成阶段", val: `${doneCount} / ${PHASES.length}` },
          { label: "提取资产",   val: totalExtracted > 0 ? `${totalExtracted.toFixed(1)} ETH` : "—", color: "text-red-400" },
          { label: "累计 Gas",   val: totalGas > 0 ? `${(totalGas/1000).toFixed(0)}K` : "—" },
        ].map(({ label, val, color }) => (
          <div key={label} className="px-4 py-2 text-center">
            <p className="text-[10px] text-muted-foreground/50">{label}</p>
            <p className={cn("font-mono text-[12.5px] font-semibold", color ?? "text-foreground/70")}>{val}</p>
          </div>
        ))}
      </div>

      {/* Phase stepper */}
      <div className="overflow-x-auto px-4 py-3">
        <div className="flex min-w-[600px] items-center gap-1">
          {PHASES.map((phase, i) => {
            const status = phaseStates[i];
            const Icon = phase.icon;
            const isActive = i === currentPhase;
            const isDone = status === "DONE";
            return (
              <div key={phase.id} className="flex items-center gap-1 flex-1 min-w-0">
                <div className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-all min-w-0",
                  isDone   ? "border-emerald-500/30 bg-emerald-500/5" :
                  isActive ? "border-red-500/40 bg-red-500/8 animate-pulse" :
                             "border-border/40 bg-secondary/20 opacity-50"
                )}>
                  <div className={cn("flex size-7 items-center justify-center rounded-full border",
                    isDone   ? "border-emerald-500/40 bg-emerald-500/10" :
                    isActive ? "border-red-500/50 bg-red-500/10" :
                               "border-border/40 bg-muted/30"
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className={cn("size-3.5 animate-spin", PHASE_COLORS[i])} />
                    ) : (
                      <Icon className={cn("size-3.5", PHASE_COLORS[i])} />
                    )}
                  </div>
                  <p className={cn("text-[10px] font-semibold leading-tight",
                    isDone ? "text-emerald-400" : isActive ? "text-red-400" : "text-muted-foreground/50"
                  )}>{phase.label}</p>
                  {isDone && phase.valueExtractedEth > 0 && (
                    <p className="text-[9px] text-red-400 font-mono">+{phase.valueExtractedEth} ETH</p>
                  )}
                  {isDone && phase.gasUsed > 0 && (
                    <p className="text-[9px] text-muted-foreground/40 font-mono">{(phase.gasUsed/1000).toFixed(0)}K gas</p>
                  )}
                </div>
                {i < PHASES.length - 1 && (
                  <ChevronRight className={cn("size-3.5 shrink-0",
                    isDone ? "text-emerald-500/50" : "text-muted-foreground/20"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active phase log */}
      {currentPhase >= 0 && (
        <div className="border-t border-border/40 bg-[oklch(0.12_0.02_270)] px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground/50">当前阶段：</span>
            <span className="font-semibold text-foreground/80">{PHASES[currentPhase].label}</span>
            <span className="text-muted-foreground/40">— {PHASES[currentPhase].sublabel}</span>
          </div>
          <div
            ref={el => { logRefs.current[currentPhase] = el; }}
            className="h-36 overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-0.5"
          >
            {phaseLogs[currentPhase].map((line, i) => (
              <div key={i} className={cn(
                line.type === "success" ? "text-emerald-400" :
                line.type === "error"   ? "text-red-400" :
                line.type === "tx"      ? "text-amber-400" :
                line.type === "warn"    ? "text-orange-400" :
                "text-muted-foreground/70"
              )}>
                <span className="mr-2 text-muted-foreground/30">
                  {new Date(line.ts).toISOString().slice(11, 19)}
                </span>
                {line.text}
              </div>
            ))}
            {phaseStates[currentPhase] === "RUNNING" && (
              <div className="flex items-center gap-1 text-muted-foreground/30">
                <span className="animate-pulse">█</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
