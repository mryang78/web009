"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  FlaskConical,
  History,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Droplets,
  Fish,
  FileWarning,
  Waypoints,
  Repeat,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { scenarios, previousSimulations, previousSimulationResultLabel, getScenarioById } from "@/lib/simulation-data";
import { cn } from "@/lib/utils";

const scenarioIcons: Record<string, typeof KeyRound> = {
  "malicious-approval": KeyRound,
  "token-drain": Droplets,
  "phishing-wallet": Fish,
  "malicious-contract": FileWarning,
  "abnormal-fund-flow": Waypoints,
  "suspicious-swap": Repeat,
};

export function ThreatSimulationLab() {
  const router = useRouter();
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  function selectScenario(id: string) {
    setScenarioOpen(false);
    router.push(`/lab/security/simulation?scenario=${id}`);
  }

  return (
    <section id="simulation-lab" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] via-white/[0.02] to-transparent p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 security-grid opacity-40" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-sky-400">
              <FlaskConical className="size-3.5" />
              分析攻击实验室
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
              分析攻击实验室
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              通过可视化方式分析潜在 Web3 攻击路径、资产流向与风险拦截。
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
            <Button
              onClick={() => setScenarioOpen(true)}
              size="lg"
              className="gap-2 rounded-xl bg-sky-500 px-6 text-primary-foreground hover:bg-sky-400"
            >
              开始分析
              <ArrowRight className="size-4" />
            </Button>
            <Button
              onClick={() => setHistoryOpen(true)}
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-border bg-card/65 text-foreground/90 hover:bg-muted/80"
            >
              <History className="size-4" />
              查看历史分析
            </Button>
          </div>
        </div>
      </div>

      {/* scenario select dialog */}
      <Dialog open={scenarioOpen} onOpenChange={setScenarioOpen}>
        <DialogContent className="max-h-[85vh] w-[min(94vw,44rem)] max-w-2xl overflow-y-auto border-border/70 bg-popover p-0 text-foreground/90">
          <DialogTitle className="sr-only">选择威胁场景</DialogTitle>
          <div className="border-b border-border/70 px-6 py-5">
            <h3 className="text-base font-semibold text-foreground">选择威胁场景</h3>
            <p className="mt-1 text-xs text-foreground0">
              选择攻击场景进行深度安全分析与风险验证。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {scenarios.map((s) => {
              const Icon = scenarioIcons[s.id] ?? FileWarning;
              return (
                <button
                  key={s.id}
                  onClick={() => selectScenario(s.id)}
                  className="group flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card/65 p-4 text-left transition-colors hover:border-sky-500/40 hover:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-foreground0">{s.index}</span>
                    <Icon className="size-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.nameZh}</div>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
                    运行分析
                    <ArrowRight className="size-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* previous simulations dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] w-[min(94vw,36rem)] max-w-xl overflow-y-auto border-border/70 bg-popover p-0 text-foreground/90">
          <DialogTitle className="sr-only">历史分析记录</DialogTitle>
          <div className="border-b border-border/70 px-6 py-5">
            <h3 className="text-base font-semibold text-foreground">历史分析记录</h3>
            <p className="mt-1 text-xs text-foreground0">Previous Simulations · 隔离数据</p>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {previousSimulations.map((run) => {
              const scenario = getScenarioById(run.scenarioId);
              return (
                <li key={run.id}>
                  <button
                    onClick={() => {
                      setHistoryOpen(false);
                      router.push(`/lab/security/simulation?scenario=${run.scenarioId}`);
                    }}
                    className="flex w-full items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-card/75"
                  >
                    <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-foreground/90">
                        {scenario.name} <span className="text-foreground0">· {scenario.nameZh}</span>
                      </div>
                      <div className="text-[11.5px] text-foreground0">{run.time}</div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                        "bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {previousSimulationResultLabel[run.result]}
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                      {run.riskScore}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
