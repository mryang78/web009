"use client";

import { useMemo, useState } from "react";
import Link from "@/components/app-link";
import { PlayCircle, ShieldAlert, ShieldX, RotateCcw, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import {
  walletSimulatorSteps,
  buildSimulationReport,
  type WalletRow,
  type UserAssetRow,
  type SimulationReportData,
} from "@/lib/admin/wallet-security-data";
import { walletLabDisclaimer } from "@/config/copy";
import { cn } from "@/lib/utils";
import * as walletEngine from "@/lib/wallet-engine";
import * as assetEngine from "@/lib/asset-engine";
import * as approvalEngine from "@/lib/approval-engine";
import type { ApprovalRecordState } from "@/lib/approval-engine";
import type { AssetHoldingState, MockAssetMovementRecord } from "@/lib/asset-engine";

// 本页面已从"本地 setTimeout 播放假进度"改为接入统一的 Wallet / Asset /
// Approval Engine（见 @/lib/wallet-engine、@/lib/asset-engine、
// @/lib/approval-engine）：每个 Simulation Timeline 步骤在被"点亮"之前，
// 都会先真实调用对应引擎的动作函数、产生真实的状态变化（创建/分析授权记录、
// 记录资产异动），setTimeout 只负责控制这些真实调用之间的播放节奏，不再
// 
// 或资产转移，Actual Loss 恒为 0（由 Asset Engine 保证）。

const actionOptions = [
  { key: "approve", label: "授权风险验证" },
  { key: "extract", label: "资产提取验证" },
  { key: "detect", label: "风险检测" },
] as const;

export function WalletSimulatorClient({ wallets, users }: { wallets: WalletRow[]; users: UserAssetRow[] }) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [userId, setUserId] = useState(users[0]?.userId ?? "");
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("48520");
  const [action, setAction] = useState<(typeof actionOptions)[number]["key"]>("extract");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [report, setReport] = useState<SimulationReportData | null>(null);
  const [lastApproval, setLastApproval] = useState<ApprovalRecordState | null>(null);
  const [lastMovement, setLastMovement] = useState<MockAssetMovementRecord | null>(null);

  const wallet = wallets.find((w) => w.id === walletId);

  // 通过 Asset Engine 真实加载（并在首次访问时确定性生成）这个钱包的持仓，
  // 资产选择器的可选项改为跟随这份真实持仓，而不是写死的固定列表。
  const holdings = useMemo<AssetHoldingState[]>(() => (walletId ? assetEngine.getAssets(walletId) : []), [walletId]);
  // 钱包切换后若之前选中的资产不在新持仓里，派生出一个可用的默认值，
  // 而不是在 effect 里同步 setState。
  const selectedAsset = holdings.some((h) => h.symbol === asset) ? asset : (holdings[0]?.symbol ?? "");
  const currentHolding = useMemo(() => holdings.find((h) => h.symbol === selectedAsset), [holdings, selectedAsset]);

  function startSimulation() {
    if (!walletId || !currentHolding) return;
    setReport(null);
    setRunning(true);
    setStep(-1);
    setLastApproval(null);
    setLastMovement(null);

    const tokenId = currentHolding.tokenId;
    const parsedAmount = Number(amount || "0");
    let approvalId = "";
    let finalApproval: ApprovalRecordState | null = null;
    let movement: MockAssetMovementRecord | null = null;

    // 每一步都真实调用对应引擎的动作函数——状态变化发生在这里，
    // setTimeout 只决定"什么时候把这次真实变化展示给用户"。
    function runStep(i: number) {
      switch (i) {
        case 0:
          walletEngine.selectMockWallet(walletId);
          break;
        case 1:
          walletEngine.getWalletState(walletId);
          break;
        case 2:
          assetEngine.getAssets(walletId);
          break;
        case 3: {
          const created = approvalEngine.requestApproval({
            walletId,
            tokenId,
            spenderAddress: `0xSPEND-PROTOCOL${walletId.toUpperCase()}`,
            requestedAmount: parsedAmount > 0 ? parsedAmount.toLocaleString("en-US") : "0",
          });
          approvalId = created.id;
          finalApproval = created;
          break;
        }
        case 4:
          finalApproval = approvalEngine.analyzeApproval(approvalId);
          break;
        case 5:
          movement = assetEngine.createMockAssetMovement({
            walletId,
            tokenId,
            amount: parsedAmount,
            riskLevel: finalApproval?.riskLevel,
          });
          break;
        case 6:
          assetEngine.calculateProjectedLoss({ walletId, tokenId, riskLevel: finalApproval?.riskLevel ?? "MEDIUM" });
          break;
        case 7: {
          const isRisky = finalApproval?.riskLevel === "HIGH" || finalApproval?.riskLevel === "CRITICAL";
          finalApproval = isRisky ? approvalEngine.blockApproval(approvalId) : approvalEngine.simulateApproval(approvalId);
          break;
        }
        default:
          break;
      }
      setStep(i);
    }

    walletSimulatorSteps.forEach((_, i) => {
      setTimeout(() => runStep(i), (i + 1) * 380);
    });

    setTimeout(() => {
      setRunning(false);
      setLastApproval(finalApproval);
      setLastMovement(movement);

      const w = walletEngine.getWalletState(walletId);
      const base = buildSimulationReport({
        userId,
        walletAddress: w.address,
        asset: selectedAsset,
        amount: parsedAmount.toLocaleString("en-US"),
      });
      const risk: SimulationReportData["risk"] =
        finalApproval?.riskLevel === "CRITICAL" ? "Critical" : finalApproval?.riskLevel === "HIGH" ? "High" : "Medium";
      const result: SimulationReportData["result"] =
        finalApproval?.status === "BLOCKED" ? "Threat Blocked" : "Simulation Completed";
      setReport({ ...base, risk, result });
    }, (walletSimulatorSteps.length + 1) * 380);
  }

  function again() {
    setReport(null);
    setStep(-1);
    setLastApproval(null);
    setLastMovement(null);
    if (walletId) walletEngine.resetWallet(walletId);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "钱包安全分析" }]}
        title="钱包安全分析"
        description="配置分析参数，生成完整的钱包安全分析验证流程"
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        {walletLabDisclaimer.walletSimulator}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">选择钱包</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-secondary/20 px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">选择用户</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-secondary/20 px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.userId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">选择资产</label>
            <div className="flex flex-wrap gap-1.5">
              {holdings.map((h) => (
                <button
                  key={h.symbol}
                  onClick={() => setAsset(h.symbol)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    selectedAsset === h.symbol ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {h.symbol}
                </button>
              ))}
            </div>
            {currentHolding && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                该钱包当前持有 {currentHolding.actualBalance.toLocaleString("en-US", { maximumFractionDigits: 4 })} {currentHolding.symbol}（实时分析）
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">输入分析金额</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-10 w-full rounded-lg border border-border bg-secondary/20 px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">操作</label>
            <div className="flex flex-wrap gap-1.5">
              {actionOptions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAction(a.key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    action === a.key ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={startSimulation}
            disabled={running || !currentHolding}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <PlayCircle className="size-4" />
            {running ? "分析中…" : "开始分析"}
          </button>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-[14px] font-semibold text-foreground">Simulation Timeline</h3>
            {step === -1 && !report ? (
              <p className="text-[12.5px] text-muted-foreground">配置左侧参数后点击「开始分析」，实时查看分析流程。</p>
            ) : (
              <ol className="space-y-2.5">
                {walletSimulatorSteps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-[12.5px]">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold transition-colors",
                        step >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={cn(step >= i ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-[14px] font-semibold text-foreground">Simulation Result</h3>
            {!report ? (
              <p className="text-[12.5px] text-muted-foreground">分析完成后将在此处生成安全报告。</p>
            ) : (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldX className="size-6 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="text-[14px] font-bold text-foreground">Threat Blocked</div>
                    <div className="font-mono text-[11.5px] text-muted-foreground">{report.caseId}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
                  <ReportField label="用户" value={report.userId} />
                  <ReportField label="钱包" value={report.walletAddress} />
                  <ReportField label="资产" value={report.asset} />
                  <ReportField label="分析金额" value={report.amount} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400">风险：{report.risk}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">最终结果：{report.result}</span>
                </div>
                {lastApproval && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    授权状态引擎：{lastApproval.status}（Approval Engine 记录，未产生真实链上调用）
                  </p>
                )}
                {lastMovement && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    资产流向引擎：Mock 交易 {lastMovement.mockTxHash} → {lastMovement.destinationAddress}
                    （仅记录 projectedMovement，actualBalance / actualLoss 未发生任何真实变化）
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={again} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90">
                    <RotateCcw className="size-3.5" />
                    再次分析
                  </button>
                  {wallet && (
                    <Link
                      href="/admin/user-assets"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-secondary"
                    >
                      <ArrowLeft className="size-3.5" />
                      查看用户资产
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/10 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-[11.5px] font-medium text-foreground">{value}</div>
    </div>
  );
}
