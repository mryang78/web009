"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RiskBadge, SimStatusBadge, SimulationOnlyTag } from "@/components/soc/badges";
import { attackScenarios } from "@/lib/soc/mock";
import type { AttackScenario } from "@/lib/soc/types";
import { createSimulation, resetSimulation, startSimulation, advanceStep, TERMINAL_STATUSES } from "@/lib/simulation";
import { useSimulationState } from "@/lib/simulation/use-simulation-state";
import { attachToSimulation } from "@/lib/threat-engine";
import { cn } from "@/lib/utils";

const TICK_MS = 750;

/** 每个攻击场景对应一个真实的 Simulation Engine 实例 id（纯字符串推导，不产生任何副作用，SSR/CSR 都能安全调用）。 */
function simulationIdFor(scenario: AttackScenario): string {
  return `attack-chain-${scenario.id}`;
}

/** 真正"创建"这条 Simulation Engine 记录的写操作——只允许在挂载后的 useEffect 里调用。 */
function ensureSimulationExists(id: string, scenario: AttackScenario): void {
  try {
    // 已存在则直接复用（同一浏览会话内，攻击路径分析 / Attack Chain 页面共享同一批 Simulation Engine 实例）。
    createSimulation({ id, scenarioId: scenario.id });
  } catch {
    // 已存在，忽略——这就是"复用"。
  }
}

export function AttackChainClient() {
  const [activeId, setActiveId] = useState(attackScenarios[0]?.id);
  const scenario = attackScenarios.find((s) => s.id === activeId) ?? attackScenarios[0];
  // simulationId 本身是纯推导（不接触 store），SSR 与 CSR 首次渲染算出的值
  // 完全一致。真正"创建"这条 Simulation Engine 记录是一次有副作用的写操作，
  // 不能放进渲染期间执行的 useMemo——SSR/静态构建阶段也会执行 useMemo，会把
  // "构建时创建的分析"错误地写进服务端单例，导致这个页面的静态 HTML 里出现
  // 客户端并不存在的分析记录，触发 hydration mismatch。这里改为只在挂载后的
  // useEffect 里创建（纯客户端），且这个 effect 在下面的 useSimulationState
  // 之前调用，保证「先创建、后订阅」——订阅时 Simulation Engine 会立即推送
  // 当前状态，不需要额外的 setState 或轮询。
  const simulationId = simulationIdFor(scenario);
  useEffect(() => {
    ensureSimulationExists(simulationId, scenario);
  }, [simulationId, scenario]);
  const simulation = useSimulationState(simulationId);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detachRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    detachRef.current?.();
    detachRef.current = attachToSimulation(simulationId);
    return () => detachRef.current?.();
  }, [simulationId]);

  useEffect(() => stopTimer, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }

  function selectScenario(id: string) {
    stopTimer();
    setActiveId(id);
  }

  function play() {
    if (!simulation) return;
    if (simulation.status === "IDLE") startSimulation(simulationId);
    stopTimer();
    setRunning(true);
    timerRef.current = setInterval(() => {
      try {
        const next = advanceStep(simulationId);
        if (TERMINAL_STATUSES.includes(next.status)) stopTimer();
      } catch {
        stopTimer();
      }
    }, TICK_MS);
  }

  function reset() {
    stopTimer();
    resetSimulation(simulationId);
  }

  const step = simulation?.currentStepIndex ?? -1;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "攻击链路分析" }]}
        title="Attack Chain"
        description="按真实 Simulation Engine 状态机逐步推进的攻击链路分析，全部页面读取同一份 Simulation State"
        actions={<SimulationOnlyTag />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-border/70 bg-card/65 p-3">
          {attackScenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => selectScenario(s.id)}
              className={cn(
                "w-full rounded-xl border px-3.5 py-3 text-left transition-colors",
                s.id === scenario.id ? "border-primary/50 bg-primary/10" : "border-border/70 bg-card/45 hover:bg-white/[0.05]"
              )}
            >
              <div className="text-[13px] font-medium text-foreground">{s.name}</div>
              <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{s.attackVector}</div>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-border/70 bg-card/65 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">{scenario.name}</h2>
              <p className="mt-1 max-w-xl text-[12.5px] text-muted-foreground">{scenario.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={play}
                disabled={running || !simulation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                <PlayCircle className="size-3.5" />
                Play
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </button>
            </div>
          </div>

          <ol className="mt-6 space-y-0">
            {scenario.chain.map((c, i) => {
              const reached = i <= step;
              return (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                        reached
                          ? c.status === "Blocked"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : c.status === "Detected"
                              ? "border-red-500/40 bg-red-500/10 text-red-400"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-400"
                          : "border-border/70 bg-card/45 text-muted-foreground/40"
                      )}
                    >
                      {i + 1}
                    </span>
                    {i < scenario.chain.length - 1 && (
                      <div className="my-0.5 h-8 w-px bg-accent/60" />
                    )}
                  </div>
                  <div className="flex-1 pb-6 last:pb-0">
                    <div className="text-[13px] font-medium text-foreground">{c.action}</div>
                    <div className="text-[11px] text-muted-foreground">{c.component}</div>
                    {reached && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <RiskBadge level={c.risk} />
                        <SimStatusBadge status={c.status} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-secondary/45 p-3.5">
              <h4 className="text-[11.5px] font-semibold text-muted-foreground">检测逻辑</h4>
              <p className="mt-1.5 text-[12.5px] text-foreground/90">{scenario.detectionLogic}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/45 p-3.5">
              <h4 className="text-[11.5px] font-semibold text-muted-foreground">安全建议</h4>
              <p className="mt-1.5 text-[12.5px] text-foreground/90">{scenario.recommendation}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
