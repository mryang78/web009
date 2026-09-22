"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Loader2, Play, RotateCcw, ShieldBan, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assetExtraction, attackPathSteps, simulationSteps } from "@/lib/security-data";
import { cn } from "@/lib/utils";

type SimState = "idle" | "running" | "done";

export function AttackPathSimulation() {
  const [state, setState] = useState<SimState>("idle");
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function start() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState("running");
    setStep(0);
    simulationSteps.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i + 1);
        if (i === simulationSteps.length - 1) setState("done");
      }, (i + 1) * 620);
      timers.current.push(t);
    });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState("idle");
    setStep(0);
  }

  return (
    <section id="attack-path" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">攻击路径分析</h2>
        <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-red-400">
          安全分析
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">通过实时分析数据还原潜在攻击链路。</p>

      {/* static path chain */}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-border/70 bg-card/65 p-5">
        <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
          {attackPathSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/70 bg-card/65 px-3.5 py-2.5 text-center">
                <span className="font-mono text-[10px] text-foreground0">0{i + 1}</span>
                <span className="text-[12.5px] font-medium whitespace-nowrap text-foreground/90">{s}</span>
              </div>
              {i < attackPathSteps.length - 1 && (
                <ArrowRight className="size-4 shrink-0 text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* simulated asset extraction */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card/65 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground/90">资产提取验证</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ["目标钱包", assetExtraction.targetWallet],
            ["资产", assetExtraction.asset],
            ["金额", assetExtraction.amount],
            ["目的地", assetExtraction.destination],
            ["状态", assetExtraction.status],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] text-foreground0">{label}</div>
              <div
                className={cn(
                  "mt-1 font-mono text-[13px] font-medium tabular-nums",
                  label === "状态" ? "text-amber-400" : "text-foreground/90"
                )}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-secondary/45 px-4 py-5 sm:flex-row sm:justify-between sm:gap-4">
          {["48,520 USDT", "可疑合约", "目标钱包"].map((label, i) => (
            <div key={label} className="flex items-center gap-3 sm:contents">
              <div className="rounded-lg border border-border/70 bg-card/75 px-3.5 py-2 text-center text-[12.5px] font-medium whitespace-nowrap text-foreground/90">
                {label}
              </div>
              {i < 2 && (
                <span className="relative flex h-5 w-10 items-center justify-center sm:h-10 sm:w-16">
                  <ArrowDown className="size-4 text-slate-600 sm:hidden" />
                  <ArrowRight className="hidden size-4 text-slate-600 sm:block" />
                  <span className="absolute size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)] motion-safe:animate-pulse" />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
          <ShieldBan className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
          <div className="text-[13px] leading-relaxed">
            <p className="font-semibold text-emerald-400">安全引擎 · 转账已拦截</p>
            <p className="mt-0.5 text-muted-foreground">⚠ 检测到威胁 — 已拦截该笔分析资产转移</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] tracking-wide text-foreground0">
          
        </p>
      </div>

      {/* step-by-step simulation */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card/65 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">攻击过程动画</h3>
            <p className="mt-0.5 text-xs text-foreground0">逐步还原检测与拦截流程</p>
          </div>
          {state !== "running" && (
            <Button
              onClick={state === "done" ? reset : start}
              size="sm"
              className="gap-1.5 rounded-lg bg-sky-500 text-primary-foreground hover:bg-sky-400"
            >
              {state === "done" ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5" />}
              {state === "done" ? "再次运行" : "开始分析"}
            </Button>
          )}
          {state === "running" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400">
              <Loader2 className="size-3.5 animate-spin" />
              分析中…
            </span>
          )}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / simulationSteps.length) * 100}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {simulationSteps.map((s, i) => {
            const done = step > i;
            const active = state === "running" && step === i;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[13px] transition-colors duration-300",
                  done
                    ? "border-emerald-500/20 bg-emerald-500/[0.05] text-foreground/90"
                    : "border-border/60 bg-card/45 text-foreground0"
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : active ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-sky-400" />
                ) : (
                  <Circle className="size-4 shrink-0 text-slate-700" />
                )}
                <span className="font-mono text-[11px] text-slate-600">
                  步骤 {String(s.id).padStart(2, "0")}
                </span>
                <span>{s.title}</span>
              </li>
            );
          })}
        </ul>

        {state === "done" && (
          <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] py-6 text-center">
            <span className="text-xl font-bold tracking-wide text-red-400">威胁已拦截</span>
            <span className="font-mono text-sm text-foreground/80">
              风险评分 <span className="font-bold text-red-400">98</span> / 100
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
