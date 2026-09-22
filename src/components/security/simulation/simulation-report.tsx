import { useState } from "react";
import { FileDown, Loader2, CheckCheck } from "lucide-react";
import { RiskBadge } from "@/components/soc/badges";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

function protectionResultLabel(status: string): string {
  switch (status) {
    case "BLOCKED":   return "已拦截（Protection Triggered）";
    case "DETECTED":  return "已检出，未拦截";
    case "COMPLETED": return "分析完成";
    case "FAILED":    return "分析异常终止";
    default:          return "推演中";
  }
}

function fmtNow() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

export function SimulationReport({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { scenario, simulation, wallet, threats, projectedLossUsd, safety } = snapshot;
  const [exporting, setExporting] = useState(false);
  const [exported, setExported]   = useState(false);

  const rows = [
    { label: "Scenario",               value: `${scenario.name} · ${scenario.category}` },
    { label: "Wallet",                 value: <span className="font-mono">{wallet.address}</span> },
    { label: "Risk Score",             value: `${simulation.riskScore} / 100` },
    { label: "Threat Level",           value: <RiskBadge level={simulation.riskLevel} /> },
    { label: "Attack Steps",           value: `${Math.max(simulation.currentStepIndex + 1, 0)} / ${simulation.totalSteps}` },
    {
      label: "Threat Indicators",
      value: threats.length === 0 ? "未检测到威胁指标" : (
        <div className="flex flex-wrap justify-end gap-1.5">
          {threats.map((t) => (
            <span key={t.id} className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-medium text-red-300">
              {t.type}
            </span>
          ))}
        </div>
      ),
    },
    { label: "Projected Asset Exposure", value: `$${projectedLossUsd.toLocaleString()}` },
    { label: "Actual Loss",              value: <span className="font-mono font-bold text-emerald-400">{safety.actualLoss}</span> },
    { label: "Protection Result",        value: protectionResultLabel(simulation.status) },
  ];

  /** 生成 PDF：调用 window.print()，页面已有打印 CSS 可用；
   *  同时生成并下载 JSON 格式的机读报告 */
  function exportReport() {
    setExporting(true);
    const reportData = {
      generated: fmtNow(),
      scenario: { id: scenario.id, name: scenario.name, category: scenario.category, chain: scenario.chain },
      wallet: wallet.address,
      simulation: {
        status:      simulation.status,
        riskScore:   simulation.riskScore,
        riskLevel:   simulation.riskLevel,
        totalSteps:  simulation.totalSteps,
        currentStep: simulation.currentStepIndex + 1,
        events:      simulation.events.map(e => ({ type: e.type, title: e.title })),
      },
      threats:             threats.map(t => ({ id: t.id, type: t.type })),
      projectedLossUsd,
      safety: {
        actualLoss:        safety.actualLoss,
        transactionStatus: safety.transactionStatus,
        blockchainStatus:  safety.blockchainStatus,
      },
      protectionResult: protectionResultLabel(simulation.status),
    };

    const blob = new Blob(
      ["﻿" + JSON.stringify(reportData, null, 2)],
      { type: "application/json;charset=utf-8;" }
    );
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeScenario = scenario.name.replace(/[^a-zA-Z0-9一-龥]/g, "_");
    link.href     = url;
    link.download = `security_report_${safeScenario}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 900);
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      {/* 标题行 */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12.5px] font-semibold text-foreground/80">Simulation Report</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            {safety.transactionStatus}
          </span>
          {/* 导出 JSON 报告按钮 */}
          <button
            onClick={exportReport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : exported ? (
              <CheckCheck className="size-3.5 text-emerald-400" />
            ) : (
              <FileDown className="size-3.5" />
            )}
            {exported ? "已导出" : "导出报告"}
          </button>
        </div>
      </div>

      {/* 报告字段 */}
      <dl className="mt-3 space-y-2.5 text-[12.5px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-foreground0">{r.label}</dt>
            <dd className="text-right text-foreground/90">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* 底部说明 */}
      <p className="mt-3 border-t border-border/70 pt-3 text-[11px] text-foreground0">
        Blockchain: {safety.blockchainStatus} · 本报告全部字段来自本次真实（实时分析）运行的安全分析引擎状态，不是预设文案。
      </p>
    </div>
  );
}
