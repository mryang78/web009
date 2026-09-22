"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ArrowUpRight,
  X,
  Wallet,
  ArrowRight,
  BadgeCheck,
  Boxes,
  ShieldX,
  CheckCircle2,
  Ban,
  Zap,
  Loader2,
  Users,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { AdminDrawer } from "@/components/admin/ui/drawer";
import { useToast } from "@/components/admin/ui/toast";
import {
  walletStatusStyle,
  userHoldings,
  userAssetHistory,
  userRiskEvents,
  type UserAssetRow,
} from "@/lib/admin/wallet-security-data";
import { emptyStateCopy, walletLabDisclaimer } from "@/config/copy";
import { cn } from "@/lib/utils";

const flowStages = ["用户钱包", "授权事件", "风险合约", "资产提取验证", "安全引擎", "目标地址"];

type ExtractionOutcome = "blocked" | "replay" | null;

// 提取的最终结果不再由 Math.random() 掷硬币决定，而是直接取决于这个用户
// 当前展示的真实风险评分（与自动扫描页面 RISK_THRESHOLD=70 的判定口径一致）：
// 同一个用户、同一份风险数据，任何时候点「资产提取验证」都会得到同一个结果。
const EXTRACTION_RISK_THRESHOLD = 70;

function AssetExtractionModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserAssetRow;
}) {
  const [running, setRunning] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [outcome, setOutcome] = useState<ExtractionOutcome>(null);

  if (!open) return null;

  function startSimulation() {
    setRunning(true);
    setOutcome(null);
    setActiveStage(0);
    flowStages.forEach((_, i) => {
      setTimeout(() => setActiveStage(i), (i + 1) * 500);
    });
    setTimeout(() => {
      setRunning(false);
      setOutcome(user.riskScore >= EXTRACTION_RISK_THRESHOLD ? "blocked" : "replay");
    }, (flowStages.length + 1) * 500);
  }

  function reset() {
    setRunning(false);
    setActiveStage(-1);
    setOutcome(null);
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-150" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">资产提取验证</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">纯安全分析，不执行任何真实 Token 转账</p>
          </div>
          <button onClick={onClose} aria-label="关闭" title="关闭" className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="源钱包" value={user.walletAddress} mono />
            <Field label="目标" value="0xANAL..." mono />
            <Field label="资产" value={user.assetSymbol} />
            <Field label="数量" value={user.assetAmount} mono />
          </div>
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-600 dark:text-red-400">
            <ShieldAlert className="size-4" />
            风险等级：Critical
          </div>

          <div className="mb-5 rounded-2xl border border-border bg-secondary/10 p-5">
            <div className="mb-4 text-[12.5px] font-semibold text-muted-foreground">资产验证流程</div>
            <div className="flex flex-wrap items-center justify-between gap-y-4">
              {flowStages.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border text-[11px] font-bold transition-colors duration-300",
                        activeStage >= i
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className="w-16 text-center text-[10.5px] text-muted-foreground">{s}</span>
                  </div>
                  {i < flowStages.length - 1 && (
                    <ArrowRight
                      className={cn(
                        "mx-1 mb-4 size-4 shrink-0 transition-colors duration-300",
                        activeStage > i ? "text-primary" : "text-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            {running && (
              <p className="mt-4 text-center text-[12px] text-muted-foreground">
                正在分析 {user.assetAmount} {user.assetSymbol} 的资产流向…
              </p>
            )}
          </div>

          {outcome === "blocked" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center">
              <ShieldX className="mx-auto mb-2 size-8 text-red-600 dark:text-red-400" />
              <div className="text-[16px] font-bold tracking-wide text-red-600 dark:text-red-400">THREAT BLOCKED</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                资产提取验证金额 {user.assetAmount} {user.assetSymbol} · 状态：已拦截 · 风险：Critical
              </p>
            </div>
          )}
          {outcome === "replay" && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-2 size-8 text-sky-600 dark:text-sky-400" />
              <div className="text-[16px] font-bold tracking-wide text-sky-600 dark:text-sky-400">Simulation Completed</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">历史案例 Replay · 状态：分析完成</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Ban className="size-3.5" />
                No Real Asset Transfer
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-3.5">
          <span className="text-[11px] text-muted-foreground">{walletLabDisclaimer.extractionFooter}</span>
          <div className="flex gap-2">
            {outcome && (
              <button onClick={reset} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-secondary">
                重置
              </button>
            )}
            <button
              onClick={startSimulation}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowUpRight className="size-3.5" />
              {running ? "分析中…" : "资产提取验证"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/10 px-3 py-2">
      <div className="text-[10.5px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate text-[12.5px] font-medium text-foreground", mono && "font-mono")}>{value}</div>
    </div>
  );
}

const columns: DataTableColumn<UserAssetRow>[] = [
  { key: "userId", label: "用户ID", render: (r) => <span className="font-mono font-medium text-foreground">{r.userId}</span> },
  { key: "walletAddress", label: "钱包地址", render: (r) => <span className="font-mono text-[12px] text-muted-foreground">{r.walletAddress}</span>, hideOnMobile: true },
  { key: "assetAmount", label: "资产数量", render: (r) => <span className="font-mono text-foreground">{r.assetSymbol} {r.assetAmount}</span> },
  { key: "assetValue", label: "资产价值", render: (r) => <span className="font-mono tabular-nums text-foreground">${r.assetValue.toLocaleString("en-US")}</span>, hideOnMobile: true },
  {
    key: "riskScore",
    label: "风险评分",
    render: (r) => (
      <span className={cn("font-mono font-semibold", r.riskScore >= 70 ? "text-red-600 dark:text-red-400" : r.riskScore >= 40 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
        {r.riskScore}
      </span>
    ),
    hideOnMobile: true,
  },
  { key: "lastActiveAgo", label: "最后活动", render: (r) => <span className="text-muted-foreground/80">{r.lastActiveAgo}</span>, hideOnMobile: true },
  {
    key: "status",
    label: "状态",
    render: (r) => (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap", walletStatusStyle[r.status])}>
        {r.status}
      </span>
    ),
  },
];

interface BulkResult {
  userId: string;
  walletAddress: string;
  assetSymbol: string;
  assetAmount: string;
  outcome: "blocked" | "replay";
}

// ── Summary KPI card ──────────────────────────────────────────────────────────
function AssetKpi({
  icon: Icon, label, value, sub, color, bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", bg)}>
        <Icon className={cn("size-4", color)} />
      </div>
      <div className="min-w-0">
        <p className="text-[20px] font-bold tabular-nums text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-[10.5px] text-muted-foreground/60">{sub}</p>
      </div>
    </div>
  );
}

export function UserAssetsClient({ rows }: { rows: UserAssetRow[] }) {
  const [selected, setSelected] = useState<UserAssetRow | null>(null);
  const [extractionOpen, setExtractionOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
  const toast = useToast();

  // Computed summary stats
  const totalValue   = rows.reduce((s, r) => s + r.assetValue, 0);
  const highRiskCnt  = rows.filter((r) => r.riskScore >= 70).length;
  const monitoredCnt = rows.filter((r) => ["监控中", "高风险", "严重风险", "中风险"].includes(r.status)).length;
  const normalCnt    = rows.filter((r) => r.status === "正常").length;

  function runBulkExtraction() {
    if (bulkRunning) return;
    setBulkRunning(true);
    setBulkResults(null);
    setTimeout(() => {
      const results: BulkResult[] = rows.map((r) => ({
        userId: r.userId,
        walletAddress: r.walletAddress,
        assetSymbol: r.assetSymbol,
        assetAmount: r.assetAmount,
        outcome: r.riskScore >= EXTRACTION_RISK_THRESHOLD ? "blocked" : "replay",
      }));
      setBulkResults(results);
      setBulkRunning(false);
      const blockedCount = results.filter((r) => r.outcome === "blocked").length;
      toast.success(
        `批量分析完成：共 ${results.length} 个用户，${blockedCount} 次拦截 / ${results.length - blockedCount} 次分析完成，未产生真实资产变动。`
      );
    }, 1100);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "资产与钱包" }, { label: "用户资产" }]}
        title="用户资产"
        description="面向全系统分析账户的资产总览与风险监控"
        actions={
          <button
            onClick={runBulkExtraction}
            disabled={bulkRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-600/90 disabled:opacity-60"
          >
            {bulkRunning ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {bulkRunning ? "批量分析中…" : `一键资产提取验证（全部 ${rows.length} 个用户）`}
          </button>
        }
      />

      {/* Summary KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AssetKpi
          icon={TrendingUp}
          label="总资产价值"
          value={`$${(totalValue / 1000).toFixed(0)}K`}
          sub="链上估值合计"
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <AssetKpi
          icon={AlertOctagon}
          label="高风险用户"
          value={String(highRiskCnt)}
          sub="风险评分 ≥ 70"
          color="text-red-500"
          bg="bg-red-500/10"
        />
        <AssetKpi
          icon={ShieldAlert}
          label="监控中"
          value={String(monitoredCnt)}
          sub="需持续跟踪"
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <AssetKpi
          icon={Users}
          label="正常用户"
          value={String(normalCnt)}
          sub={`共 ${rows.length} 个账户`}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        {walletLabDisclaimer.userAssets}
      </div>

      {bulkResults && (
        <div className="mb-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Zap className="size-4 text-red-500" />
              批量分析结果
            </div>
            <button
              onClick={() => setBulkResults(null)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="关闭"
              title="关闭"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {bulkResults.map((r) => (
              <div
                key={r.userId}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-[12.5px]",
                  r.outcome === "blocked"
                    ? "border-red-500/25 bg-red-500/5"
                    : "border-sky-500/25 bg-sky-500/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-medium text-foreground">{r.userId}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                      r.outcome === "blocked"
                        ? "text-red-600 dark:text-red-400"
                        : "text-sky-600 dark:text-sky-400"
                    )}
                  >
                    {r.outcome === "blocked" ? <ShieldX className="size-3" /> : <CheckCircle2 className="size-3" />}
                    {r.outcome === "blocked" ? "已拦截" : "分析完成"}
                  </span>
                </div>
                <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{r.walletAddress}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {r.assetSymbol} {r.assetAmount}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
            <Ban className="size-3.5 shrink-0" />
            {walletLabDisclaimer.extractionFooter}
          </div>
        </div>
      )}

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.userId}
        searchPlaceholder="搜索用户ID或钱包地址…"
        searchFn={(r, q) => r.userId.toLowerCase().includes(q) || r.walletAddress.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "正常", value: "正常" },
          { label: "监控中", value: "监控中" },
          { label: "中风险", value: "中风险" },
          { label: "高风险", value: "高风险" },
          { label: "严重风险", value: "严重风险" },
        ]}
        filterFn={(r, v) => r.status === v}
        onRowClick={(r) => setSelected(r)}
        pageSize={10}
        emptyDescription={emptyStateCopy.用户资产}
      />

      <AdminDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `用户 ${selected.userId}` : ""}
        description="用户资产详情与风险分析操作"
        widthClassName="w-full max-w-lg"
        footer={
          selected && (
            <button
              onClick={() => setExtractionOpen(true)}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-red-600/90"
            >
              <ArrowUpRight className="size-4" />
              资产提取验证
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <section className="rounded-xl border border-border bg-secondary/10 p-4">
              <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <BadgeCheck className="size-4" />
                用户信息
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                <span className="text-muted-foreground">用户ID</span>
                <span className="font-mono text-foreground">{selected.userId}</span>
                <span className="text-muted-foreground">钱包</span>
                <span className="font-mono text-foreground">{selected.walletAddress}</span>
                <span className="text-muted-foreground">状态</span>
                <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", walletStatusStyle[selected.status])}>
                  {selected.status}
                </span>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Boxes className="size-4" />
                资产
              </div>
              <div className="space-y-1.5">
                {userHoldings(selected.userId).map((h) => (
                  <div key={h.symbol} className="flex items-center justify-between rounded-lg bg-secondary/10 px-3 py-2 text-[12.5px]">
                    <span className="font-medium text-foreground">{h.symbol}</span>
                    <span className="font-mono text-muted-foreground">{h.amount}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 text-[13px] font-semibold text-foreground">资产历史</div>
              <ul className="space-y-1.5 text-[12.5px]">
                {userAssetHistory.map((h, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-foreground">{h.event}</span>
                    <span className="shrink-0 text-muted-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="mb-2 text-[13px] font-semibold text-foreground">风险事件</div>
              <ul className="space-y-1.5">
                {userRiskEvents.map((e, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-2 text-[12.5px]">
                    <span className="text-foreground">{e.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-red-600 dark:text-red-400">{e.time}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex items-center gap-2 rounded-lg bg-secondary/20 px-3 py-2 text-[11.5px] text-muted-foreground">
              <Wallet className="size-3.5 shrink-0" />
              授权记录请前往「授权记录」页面查看该钱包的完整授权风险分析。
            </div>
          </div>
        )}
      </AdminDrawer>

      {selected && <AssetExtractionModal open={extractionOpen} onClose={() => setExtractionOpen(false)} user={selected} />}
    </div>
  );
}
