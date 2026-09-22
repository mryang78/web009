"use client";

import { useEffect, useRef } from "react";
import Link from "@/components/app-link";
import { ArrowLeft, Pause, Play, RotateCcw, Repeat } from "lucide-react";
import {
  PLAYBACK_SPEEDS,
  pause as pausePlayer,
  play as playPlayer,
  replay as replayPlayer,
  restart as restartPlayer,
  setSpeed as setPlayerSpeed,
  startScenario,
  type PlaybackSpeed,
} from "@/lib/attack-scenarios/scenario-player";
import { useScenarioPlayer } from "@/lib/attack-scenarios/use-scenario-player";
import { SimulationOnlyTag } from "@/components/soc/badges";
import { TargetPanel } from "./target-panel";
import { AttackCanvas } from "./attack-canvas";
import { AssetFlow } from "./asset-flow";
import { AttackTimeline } from "./attack-timeline";
import { TransactionIntelligence } from "./transaction-intelligence";
import { FundFlowGraph } from "./fund-flow-graph";
import { SimulationReport } from "./simulation-report";
import { SecurityRecommendations } from "./security-recommendations";
import { AttackTerminal } from "./attack-terminal";
import { FundFlowSankey } from "./fund-flow-sankey";
import { InterceptPanel } from "./intercept-panel";
import { MempoolPanel } from "./mempool-panel";
import { ContractAuditPanel } from "./contract-audit-panel";
import { CallTracePanel } from "./call-trace-panel";
import { BytecodePanel } from "./bytecode-panel";
import { MevPanel } from "./mev-panel";
import { AttackPhasePipeline } from "./attack-phase-pipeline";
import { FlashLoanDecomposer } from "./flash-loan-decomposer";
import { AssetExtractionPanel } from "./asset-extraction-panel";
import { cn } from "@/lib/utils";

const TERMINAL_STATUSES = new Set(["BLOCKED", "DETECTED", "COMPLETED", "FAILED"]);

export function AttackSimulation({ scenarioId, walletId }: { scenarioId: string; walletId?: string }) {
  const snapshot = useScenarioPlayer();
  const startedFor = useRef<string | null>(null);

  // 每次进入这个场景（scenarioId 变化，或本页面第一次挂载而 Player 里还没有对应场景）
  // 就创建一次新的统一 Simulation State；同一个场景在同一次浏览里重复挂载不会
  // 重新创建，保证跨组件读到的是同一份状态。
  useEffect(() => {
    if (startedFor.current === scenarioId && snapshot?.scenario.id === scenarioId) return;
    startedFor.current = scenarioId;
    startScenario(scenarioId, walletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  if (!snapshot || snapshot.scenario.id !== scenarioId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-[13.5px] text-foreground0 sm:px-6 lg:px-8">
        正在初始化 Simulation Engine…
      </div>
    );
  }

  const { simulation, scenario } = snapshot;
  const done = TERMINAL_STATUSES.has(simulation.status);
  const progressPct = simulation.totalSteps > 0 ? Math.round(((simulation.currentStepIndex + 1) / simulation.totalSteps) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/lab/security"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground/90"
      >
        <ArrowLeft className="size-3.5" />
        返回安全实验室
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">攻击路径分析</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {scenario.name} · {scenario.category}
          </p>
        </div>
        <SimulationOnlyTag />
      </div>

      {/* Simulation Controller —— Play / Pause / Restart / Replay / 1x / 2x / 4x，全部驱动真实的 Simulation Engine 状态机 */}
      <div className="mt-5 rounded-2xl border border-border/70 bg-card/65 p-4">
        <div className="flex items-center justify-between text-[11.5px] text-foreground0">
          <span>
            Step {Math.max(simulation.currentStepIndex + 1, 0)} / {simulation.totalSteps} · {simulation.status}
          </span>
          <span className="font-mono">{progressPct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => (snapshot.playing ? pausePlayer() : playPlayer())}
            disabled={done && !snapshot.playing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              snapshot.playing ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" : "bg-sky-500 text-primary-foreground hover:bg-sky-400"
            )}
          >
            {snapshot.playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {snapshot.playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => restartPlayer()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
            Restart
          </button>
          <button
            onClick={() => replayPlayer()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-muted"
          >
            <Repeat className="size-3.5" />
            Replay
          </button>

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/45 p-1">
            {PLAYBACK_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setPlayerSpeed(s as PlaybackSpeed)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                  snapshot.speed === s ? "bg-sky-500 text-primary-foreground" : "text-muted-foreground hover:text-foreground/90"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TargetPanel snapshot={snapshot} />
        <AttackCanvas snapshot={snapshot} />
      </div>

      <div className="mt-5">
        <AssetFlow snapshot={snapshot} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AttackTimeline snapshot={snapshot} />
        <TransactionIntelligence snapshot={snapshot} />
      </div>

      {/* Mempool 实时待处理交易池 */}
      <div className="mt-5">
        <MempoolPanel snapshot={snapshot} />
      </div>

      {/* 动态资金流向 Sankey 图（替换原静态 FundFlowGraph） */}
      <div className="mt-5">
        <FundFlowSankey snapshot={snapshot} />
      </div>

      {/* 攻击执行流水线 */}
      <div className="mt-5">
        <AttackPhasePipeline snapshot={snapshot} />
      </div>

      {/* 闪电贷原子交易解构 */}
      <div className="mt-5">
        <FlashLoanDecomposer snapshot={snapshot} />
      </div>

      {/* 实时资产提取可视化 */}
      <div className="mt-5">
        <AssetExtractionPanel snapshot={snapshot} />
      </div>

      {/* 智能合约安全审计面板 */}
      <div className="mt-5">
        <ContractAuditPanel snapshot={snapshot} />
      </div>

      {/* MEV 三明治分析 */}
        <div className="mt-5">
          <MevPanel snapshot={snapshot} />
        </div>

        {/* EVM 调用栈追踪 */}
      <div className="mt-5">
        <CallTracePanel snapshot={snapshot} />
      </div>

      {/* 字节码安全分析 */}
      <div className="mt-5">
        <BytecodePanel snapshot={snapshot} />
      </div>

      {/* 拦截/放行决策面板 + 损失计算器 */}
      <div className="mt-5">
        <InterceptPanel snapshot={snapshot} />
      </div>

      {/* 攻击执行终端 */}
      <div className="mt-5">
        <AttackTerminal snapshot={snapshot} />
      </div>

      {done ? (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SimulationReport snapshot={snapshot} />
          <SecurityRecommendations scenario={scenario} />
        </div>
      ) : (
        <div className="mt-5">
          <SecurityRecommendations scenario={scenario} />
        </div>
      )}
    </div>
  );
}
