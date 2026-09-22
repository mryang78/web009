"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, PlayCircle, X, CheckCircle2, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { AdminDrawer } from "@/components/admin/ui/drawer";
import { useToast } from "@/components/admin/ui/toast";
import { approvalSimSteps } from "@/lib/admin/wallet-security-data";
import type { ApprovalRiskLevel } from "@/lib/shared/types";
import { mockTokens } from "@/lib/shared/entities";
import { emptyStateCopy, walletLabDisclaimer } from "@/config/copy";
import { createMockWallet, getWalletState } from "@/lib/wallet-engine";
import { getAssets } from "@/lib/asset-engine";
import { analyzeApproval, requestApproval, type ApprovalRecordState } from "@/lib/approval-engine";
import { useAllApprovals } from "@/lib/approval-engine/use-approvals";
import { assessApprovalRisk } from "@/lib/risk-engine";
import { cn } from "@/lib/utils";

const riskStyle: Record<ApprovalRiskLevel, string> = {
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};
const riskLabel: Record<ApprovalRiskLevel, string> = {
  critical: "严重风险",
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

/** ApprovalRecordState.riskLevel（SAFE/LOW/MEDIUM/HIGH/CRITICAL）→ 本页表格使用的四档展示等级。 */
function displayRisk(level: ApprovalRecordState["riskLevel"]): ApprovalRiskLevel {
  if (level === "CRITICAL") return "critical";
  if (level === "HIGH") return "high";
  if (level === "MEDIUM") return "medium";
  return "low";
}

/** ApprovalEngineStatus → 本页表格使用的三档展示状态。 */
function displayStatus(status: ApprovalRecordState["status"]): "待处理" | "已处理" | "已忽略" {
  if (status === "BLOCKED" || status === "REVOKED_SIMULATION") return "已处理";
  return "待处理";
}

function tokenSymbolOf(tokenId: string): string {
  return mockTokens.find((t) => t.id === tokenId)?.symbol ?? tokenId;
}

function walletAddressOf(walletId: string): string {
  try {
    return getWalletState(walletId).address;
  } catch {
    return walletId;
  }
}

function SimulateApprovalModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"confirm" | "running" | "done">("confirm");
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<{ score: number; level: string } | null>(null);

  if (!open) return null;

  function start() {
    setPhase("running");
    setStep(0);

    // 真实调用 Approval Engine + 其内部接入的 Risk Engine，而不是展示写死的 "92/100"。
    // 这条记录会立刻写入 approval-store 单例，/soc/dashboard、/soc/alerts 等
    // 页面订阅的是同一份数据，会实时看到这次新增的授权与由此派生的威胁/告警。
    const wallet = createMockWallet({ label: "授权隔离钱包", network: "Ethereum" });
    const tokenId = getAssets(wallet.id)[0]?.tokenId;
    let approval = tokenId
      ? requestApproval({
          walletId: wallet.id,
          tokenId,
          spenderAddress: "0xCTCT-PROTOCOL",
          requestedAmount: "Unlimited (2^256-1)",
        })
      : undefined;

    approvalSimSteps.forEach((_, i) => {
      setTimeout(() => setStep(i), (i + 1) * 450);
    });
    setTimeout(() => {
      if (approval) approval = analyzeApproval(approval.id);
      const score = approval?.riskLevel === "CRITICAL" ? 96 : approval?.riskLevel === "HIGH" ? 82 : approval?.riskLevel === "MEDIUM" ? 55 : 20;
      setResult({ score, level: approval?.riskLevel ?? "HIGH" });
      setPhase("done");
      onDone();
    }, (approvalSimSteps.length + 1) * 450);
  }

  function close() {
    setPhase("confirm");
    setStep(-1);
    setResult(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-150" onClick={close} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-foreground">授权风险验证操作</h2>
          <button onClick={close} aria-label="关闭" title="关闭" className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          {phase === "confirm" && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 text-[12.5px]">
                <Field label="目标钱包" value="新建 目标钱包" />
                <Field label="资产" value="钱包首个真实持仓" />
                <Field label="授权风险验证额度" value="Unlimited (2^256-1)" />
                <Field label="授权对象" value="0xCTCT-PROTOCOL" />
              </div>
              <div className="mb-5 flex items-start gap-2 rounded-lg bg-secondary/20 px-3 py-2.5 text-[11.5px] text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                此操作会真实创建一条 Approval Engine 记录并由 Risk Engine 动态评分，仅停留在 Mock 状态，不会连接真实钱包或区块链。
              </div>
              <button
                onClick={start}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-[13.5px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <PlayCircle className="size-4" />
                开始分析
              </button>
            </>
          )}
          {phase === "running" && (
            <ol className="space-y-2.5">
              {approvalSimSteps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[12.5px]">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold transition-colors",
                      step >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={cn(step >= i ? "text-foreground" : "text-muted-foreground")}>Step {String(i + 1).padStart(2, "0")} {s}</span>
                </li>
              ))}
            </ol>
          )}
          {phase === "done" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-2 size-8 text-red-600 dark:text-red-400" />
              <div className="text-[14.5px] font-bold text-foreground">授权事件已分析生成</div>
              <p className="mt-1 font-mono text-[13px] text-red-600 dark:text-red-400">Risk Score {result?.score ?? "-"}/100</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">状态：{result?.level ?? "-"}</p>
              <button onClick={close} className="mt-4 rounded-lg border border-border px-4 py-2 text-[12.5px] font-medium text-foreground hover:bg-secondary">
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/10 px-3 py-2">
      <div className="text-[10.5px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[12.5px] font-medium text-foreground">{value}</div>
    </div>
  );
}

export function ApprovalsClient() {
  const approvals = useAllApprovals();
  const [selected, setSelected] = useState<ApprovalRecordState | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const toast = useToast();

  const rows = useMemo(
    () =>
      [...approvals]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((a) => ({
          record: a,
          time: new Date(a.createdAt).toLocaleTimeString("zh-CN", { hour12: false }),
          walletAddress: walletAddressOf(a.walletId),
          token: tokenSymbolOf(a.tokenId),
          risk: displayRisk(a.riskLevel),
          statusLabel: displayStatus(a.status),
        })),
    [approvals]
  );

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "time", label: "时间", render: (r) => <span className="font-mono text-muted-foreground">{r.time}</span> },
    { key: "id", label: "记录编号", render: (r) => <span className="font-mono font-medium text-foreground">{r.record.id}</span> },
    { key: "walletAddress", label: "钱包", render: (r) => <span className="font-mono text-[12px] text-muted-foreground">{r.walletAddress}</span>, hideOnMobile: true },
    { key: "token", label: "Token", render: (r) => <span className="font-semibold text-foreground">{r.token}</span> },
    { key: "spender", label: "授权对象", render: (r) => <span className="font-mono text-[12px] text-muted-foreground">{r.record.spenderAddress}</span>, hideOnMobile: true },
    { key: "amount", label: "授权额度", render: (r) => <span className="font-mono tabular-nums text-foreground">{r.record.requestedAmount}</span> },
    {
      key: "risk",
      label: "风险",
      render: (r) => <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", riskStyle[r.risk])}>{riskLabel[r.risk]}</span>,
    },
    {
      key: "status",
      label: "状态",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-muted-foreground">{r.statusLabel}</span>
          <button onClick={() => setSelected(r.record)} className="text-[11.5px] font-medium text-primary hover:underline">
            查看授权
          </button>
        </div>
      ),
    },
  ];

  const selectedAssessment = selected
    ? assessApprovalRisk({
        requestedAmount: selected.requestedAmount,
        tokenId: selected.tokenId,
        spenderAddress: selected.spenderAddress,
        dappId: selected.dappId,
      })
    : null;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "资产与钱包" }, { label: "资产授权记录" }]}
        title="资产授权记录"
        description="由 Approval Engine 真实产生的授权记录 —— 与 /soc/approvals、攻击路径分析、钱包安全分析共用同一份 Mock State，任何一处产生的授权都会实时出现在这里"
        actions={
          <button
            onClick={() => setSimOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlayCircle className="size-3.5" />
            授权风险验证
          </button>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        {walletLabDisclaimer.approvals}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.record.id}
        searchPlaceholder="搜索记录编号或钱包地址…"
        searchFn={(r, q) => r.record.id.toLowerCase().includes(q) || r.walletAddress.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "待处理", value: "待处理" },
          { label: "已处理", value: "已处理" },
        ]}
        filterFn={(r, v) => r.statusLabel === v}
        pageSize={10}
        emptyDescription="暂无授权记录 —— 点击「授权风险验证」，或前往 攻击路径分析 / 钱包安全分析 / /soc/approvals 运行一次真实推演。"
      />

      <AdminDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="授权风险分析"
        description="Security Detail"
        widthClassName="w-full max-w-md"
      >
        {selected && selectedAssessment && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <BadgeCheck className="size-4" />
              授权信息
            </div>
            <div className="grid grid-cols-1 gap-2 text-[12.5px]">
              <Field label="Wallet" value={walletAddressOf(selected.walletId)} />
              <Field label="Token" value={tokenSymbolOf(selected.tokenId)} />
              <Field label="授权对象" value={selected.spenderAddress} />
              <Field label="授权金额" value={`${selected.requestedAmount} ${tokenSymbolOf(selected.tokenId)}`} />
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center">
              <div className="text-[11px] text-muted-foreground">风险评分（Risk Engine）</div>
              <div className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">{selectedAssessment.score}/100</div>
              <div className="mt-1 text-[12.5px] font-semibold text-red-600 dark:text-red-400">风险等级：{riskLabel[displayRisk(selected.riskLevel)]}</div>
            </div>
            <div>
              <div className="mb-1.5 text-[11.5px] font-semibold text-muted-foreground">命中的风险因素</div>
              <ul className="space-y-1">
                {selectedAssessment.factors.filter((f) => f.triggered).map((f) => (
                  <li key={f.key} className="rounded-lg bg-secondary/10 px-2.5 py-1.5 text-[12px] text-foreground/85">
                    {f.reason}
                  </li>
                ))}
                {selectedAssessment.factors.every((f) => !f.triggered) && (
                  <li className="rounded-lg bg-secondary/10 px-2.5 py-1.5 text-[12px] text-muted-foreground">未命中任何风险因素</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </AdminDrawer>

      <SimulateApprovalModal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onDone={() => toast.success("授权事件已分析生成")}
      />
    </div>
  );
}
