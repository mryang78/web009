"use client";

import { useMemo, useState } from "react";
import {
  Globe,
  BadgeCheck,
  UserCheck,
  RefreshCcw,
  Radar,
  Siren,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RiskBadge, SimulationOnlyTag } from "@/components/soc/badges";
import { useToast } from "@/components/admin/ui/toast";
import { approvalPresets } from "@/lib/soc/mock";
import type { ApprovalType } from "@/lib/soc/types";
import { createMockWallet } from "@/lib/wallet-engine";
import { getAssets } from "@/lib/asset-engine";
import { analyzeApproval, blockApproval, requestApproval, simulateApproval, type ApprovalRecordState } from "@/lib/approval-engine";
import { cn } from "@/lib/utils";

const presetOrder: ApprovalType[] = ["Limited Approval", "Large Approval", "Unlimited Approval", "Suspicious Spender"];

const flowSteps: { label: string; icon: LucideIcon }[] = [
  { label: "DApp Request", icon: Globe },
  { label: "Approval Request", icon: BadgeCheck },
  { label: "User Confirmation", icon: UserCheck },
  { label: "授权额度已更新", icon: RefreshCcw },
  { label: "Risk Engine Detection", icon: Radar },
  { label: "Security Alert", icon: Siren },
];

export function ApprovalsClient() {
  const [selected, setSelected] = useState<ApprovalType>("Suspicious Spender");
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApprovalRecordState | null>(null);
  const toast = useToast();

  const preset = approvalPresets[selected];
  // 最终风险等级改由 Risk Engine 对这次真实创建的 Approval 记录动态评分得出，
  // 预设卡片上的 riskLevel 只是"这个分析场景通常会得到什么结果"的提示文案。
  const isHighRisk = result ? result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL" : preset.riskLevel === "HIGH" || preset.riskLevel === "CRITICAL";
  const lastStep = isHighRisk ? flowSteps.length - 1 : flowSteps.length - 3; // 低风险场景不触发告警环节

  function run() {
    if (running) return;
    setRunning(true);
    setStep(0);
    setResult(null);

    // 真实驱动 Approval Engine（内部已经接入 Risk Engine 动态评分），不是拼一个假的最终态。
    const wallet = createMockWallet({ label: `${selected} 隔离钱包`, network: "Ethereum" });
    const tokenId = getAssets(wallet.id)[0]?.tokenId ?? "token-usdt";
    let approval = requestApproval({
      walletId: wallet.id,
      tokenId,
      spenderAddress: preset.spender,
      requestedAmount: preset.requestedAmount,
    });

    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setStep(i);
      if (i === 2) approval = simulateApproval(approval.id);
      if (i === 4) {
        approval = analyzeApproval(approval.id);
        if (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL") {
          approval = blockApproval(approval.id);
        }
        setResult(approval);
      }

      const done = i >= (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL" ? flowSteps.length - 1 : flowSteps.length - 3);
      if (i >= 4 && done) {
        clearInterval(timer);
        setRunning(false);
        if (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL") {
          toast.error(`风险引擎已拦截：检测到 ${selected}（${approval.riskLevel}），已生成安全告警。`);
        } else {
          toast.success(`分析完成：${selected} 风险评估为 ${approval.riskLevel}，未触发告警规则。`);
        }
      }
    }, 650);
  }

  function reset() {
    setStep(0);
    setRunning(false);
    setResult(null);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "Token 授权风险分析器" }]}
        title="Token 授权风险分析器"
        description="分析 DApp 发起代币授权请求的完整链路，观察不同授权类型触发的风险等级与拦截逻辑"
        actions={<SimulationOnlyTag />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Preset picker */}
        <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
          <h3 className="text-[13px] font-semibold text-foreground">选择授权场景</h3>
          <div className="mt-3 space-y-2">
            {presetOrder.map((type) => {
              const p = approvalPresets[type];
              const active = selected === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setSelected(type);
                    reset();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors",
                    active ? "border-primary/50 bg-primary/10" : "border-border/70 bg-card/45 hover:bg-white/[0.05]"
                  )}
                >
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{type}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">来自 {p.dapp}</div>
                  </div>
                  <RiskBadge level={p.riskLevel} />
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-secondary/45 p-3.5 text-[12px]">
            <Row label="Token" value={preset.token} mono />
            <Row label="Spender" value={preset.spender} mono />
            <Row label="当前额度" value={preset.currentAllowance} mono />
            <Row label="请求额度" value={preset.requestedAmount} mono />
            <Row label="来源 DApp" value={preset.dapp} />
            <Row label="链" value={preset.chain} />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={run}
              disabled={running}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
              {running ? "分析中…" : "开始分析"}
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              重置
            </button>
          </div>
        </div>

        {/* Flow visualization */}
        <div className="rounded-2xl border border-border/70 bg-card/65 p-5 lg:col-span-2">
          <h3 className="text-[13px] font-semibold text-foreground">授权链路分析</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            DApp Request → Approval Request → User Confirmation → 授权额度已更新 → Risk Engine Detection → Security Alert
          </p>

          <div className="mt-6 flex flex-col">
            {flowSteps.map((s, i) => {
              const reached = i <= step;
              const isActive = i === step && running;
              const skipped = i > lastStep;
              const isAlertStep = i === flowSteps.length - 1;
              return (
                <div key={s.label} className={cn("flex gap-4", skipped && "opacity-30")}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300",
                        reached
                          ? isAlertStep && isHighRisk
                            ? "border-red-500/40 bg-red-500/10"
                            : "border-sky-500/40 bg-sky-500/10"
                          : "border-border/70 bg-card/45"
                      )}
                    >
                      {isActive ? (
                        <Loader2 className="size-4.5 animate-spin text-sky-400" />
                      ) : (
                        <s.icon
                          className={cn(
                            "size-4.5",
                            reached ? (isAlertStep && isHighRisk ? "text-red-400" : "text-sky-400") : "text-muted-foreground/40"
                          )}
                        />
                      )}
                      {reached && isAlertStep && isHighRisk && (
                        <span className="absolute inline-flex size-full animate-ping rounded-xl bg-red-500/25" />
                      )}
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div className="relative my-0.5 h-9 w-px overflow-hidden bg-accent/60">
                        <div
                          className={cn(
                            "absolute inset-x-0 top-0 w-px bg-sky-400 transition-all duration-500",
                            i < step ? "h-full" : "h-0"
                          )}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-center pb-9 last:pb-0">
                    <span className={cn("text-[13.5px] font-medium transition-colors", reached ? "text-foreground" : "text-muted-foreground/50")}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {step >= lastStep && (
            <div
              className={cn(
                "mt-2 rounded-xl border p-4 text-[13px]",
                isHighRisk ? "border-red-500/30 bg-red-500/[0.06] text-red-300" : "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
              )}
            >
              {isHighRisk
                ? `⚠ 风险引擎判定：${selected} 属于 ${preset.riskLevel} 风险，已生成 Security Alert（分析，未产生真实资产变动）。`
                : `✓ 分析完成：${selected} 风险等级为 ${preset.riskLevel}，未触发告警规则。`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right text-foreground/90", mono && "font-mono")}>{value}</span>
    </div>
  );
}
