"use client";
// ────────────────────────────────────────────────────────────────────────────
// 拦截/放行决策面板 + 实时损失计算器
// ────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, ShieldOff, SkipForward, DollarSign, TrendingDown, AlertTriangle } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

// ── 损失估算：根据快照提取金额 ──
function estimateLoss(snap: ScenarioPlayerSnapshot): number {
  if (snap.assetMovement) return snap.assetMovement.amount * 2800; // 粗估 ETH 价格
  if (snap.approval?.requestedAmount) {
    const raw = snap.approval.requestedAmount.replace(/[^0-9.]/g, "");
    const n = parseFloat(raw);
    if (!isNaN(n)) return n * 2800;
  }
  return 0;
}

// ── 攻击步骤枚举（从事件流派生） ──
interface AttackStep {
  id: string;
  label: string;
  sub: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  done: boolean;
  intercepted?: boolean;
}

function buildSteps(snap: ScenarioPlayerSnapshot): AttackStep[] {
  const evTypes = new Set(snap.simulation.events.map(e => e.type));
  return [
    {
      id: "init",
      label: "部署恶意合约",
      sub: "Spender contract 已上链",
      risk: "MEDIUM",
      done: evTypes.has("DAPP_OPENED") || evTypes.has("REQUEST_CREATED"),
    },
    {
      id: "approval",
      label: "诱导无限授权",
      sub: `spender: ${snap.approval?.spenderAddress?.slice(0,10) ?? "0xSPEND"}…`,
      risk: "HIGH",
      done: evTypes.has("APPROVAL_ANALYZED"),
    },
    {
      id: "drain",
      label: "执行资产提取",
      sub: snap.assetMovement ? `${snap.assetMovement.amount} ${snap.assetMovement.symbol}` : "transferFrom ∞",
      risk: "CRITICAL",
      done: evTypes.has("ASSET_MOVEMENT_SIMULATED"),
      intercepted: snap.simulation.status === "BLOCKED",
    },
    {
      id: "launder",
      label: "混币器洗钱",
      sub: "Tornado.cash · 资金分散",
      risk: "HIGH",
      done: evTypes.has("ASSET_MOVEMENT_SIMULATED") && snap.simulation.status !== "BLOCKED",
    },
    {
      id: "bridge",
      label: "跨链桥离场",
      sub: "ETH → BSC / ARB",
      risk: "HIGH",
      done: false,
    },
  ];
}

const RISK_STYLE = {
  LOW:      { badge: "bg-sky-500/10 text-sky-400",      dot: "bg-sky-400" },
  MEDIUM:   { badge: "bg-amber-500/10 text-amber-400",  dot: "bg-amber-400" },
  HIGH:     { badge: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400" },
  CRITICAL: { badge: "bg-red-500/10 text-red-400",      dot: "bg-red-500 animate-pulse" },
};

export function InterceptPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const baseLoss = estimateLoss(snapshot);
  const [displayLoss, setDisplayLoss] = useState(0);
  const targetRef = useRef(0);

  // 损失数字滚动动效
  useEffect(() => {
    const target = snapshot.simulation.status === "BLOCKED" ? 0 : baseLoss;
    targetRef.current = target;
    if (target === 0) { setDisplayLoss(0); return; }
    // 逐步递增
    const step = target / 40;
    let cur = displayLoss;
    const t = setInterval(() => {
      cur = Math.min(cur + step + Math.random() * step, target);
      setDisplayLoss(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, [baseLoss, snapshot.simulation.status]); // eslint-disable-line

  const steps = buildSteps(snapshot);
  const isBlocked = snapshot.simulation.status === "BLOCKED";
  const isRunning = snapshot.playing;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── 左：实时损失计算器 ── */}
      <div className={cn(
        "rounded-2xl border p-5 transition-all",
        isBlocked
          ? "border-emerald-500/30 bg-emerald-950/20"
          : displayLoss > 0
          ? "border-red-500/30 bg-red-950/20"
          : "border-border/70 bg-card/65"
      )}>
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground/80">
          <DollarSign className="size-4" />
          实时损失估算
        </div>

        <div className="mt-4 text-center">
          <div className={cn(
            "font-mono text-4xl font-bold tabular-nums transition-colors",
            isBlocked ? "text-emerald-400" : displayLoss > 100_000 ? "text-red-400" : "text-amber-400"
          )}>
            {isBlocked ? "$0" : `$${displayLoss.toLocaleString()}`}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {isBlocked ? "✓ 已全额拦截，损失归零" : displayLoss > 0 ? "资产已流失" : "攻击尚未触发"}
          </div>
        </div>

        {!isBlocked && displayLoss > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="size-3 text-red-400" />
                ETH 损失
              </span>
              <span className="font-mono text-red-400">{snapshot.assetMovement?.amount ?? "?"} ETH</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">混币手续费 (est.)</span>
              <span className="font-mono text-amber-400">~${Math.floor(displayLoss * 0.003).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">跨链桥 Gas (est.)</span>
              <span className="font-mono text-amber-400">~$420</span>
            </div>
            <div className="mt-2 border-t border-border/50 pt-2 flex justify-between text-[11.5px] font-semibold">
              <span className="text-foreground/80">净损失</span>
              <span className="font-mono text-red-400">${Math.floor(displayLoss * 0.997).toLocaleString()}</span>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-[11.5px] text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            安全引擎已在提取阶段完成拦截，资产完整保留
          </div>
        )}
      </div>

      {/* ── 右：攻击步骤 + 拦截/放行 ── */}
      <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground/80">
          <AlertTriangle className="size-4 text-amber-400" />
          攻击步骤追踪
        </div>

        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => {
            const rs = RISK_STYLE[step.risk];
            const isCurrentStep = isRunning && !step.done && steps.slice(0, i).every(s => s.done);
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all",
                  step.intercepted ? "bg-emerald-500/8 ring-1 ring-emerald-500/20" :
                  isCurrentStep   ? "bg-amber-500/8 ring-1 ring-amber-500/20" :
                  step.done       ? "bg-secondary/40" :
                                    "opacity-45"
                )}
              >
                {/* 序号 / 状态图标 */}
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground mt-0.5">
                  {step.intercepted ? "✓" : step.done ? "•" : i + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[12px] font-medium",
                      step.intercepted ? "text-emerald-400 line-through" :
                      step.done ? "text-foreground/90" : "text-foreground/50"
                    )}>
                      {step.label}
                    </span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", rs.badge)}>
                      {step.risk}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{step.sub}</div>
                </div>

                {/* 状态指示点 */}
                <div className={cn("mt-2 size-2 shrink-0 rounded-full", rs.dot, !step.done && "opacity-30")} />
              </li>
            );
          })}
        </ol>

        {/* 决策按钮区 */}
        {isRunning && !isBlocked && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="text-[11px] text-muted-foreground mb-2">SOC 分析师操作</div>
            <div className="flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-[12px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
                onClick={() => {}}
              >
                <ShieldCheck className="size-3.5" />
                拦截
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                onClick={() => {}}
              >
                <ShieldOff className="size-3.5" />
                放行
              </button>
              <button
                className="flex items-center justify-center gap-1 rounded-xl border border-border/60 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {}}
              >
                <SkipForward className="size-3.5" />
                跳过
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
