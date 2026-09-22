"use client";

import Link from "@/components/app-link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { simulationCases, simulationStatusLabel, type SimulationCaseRow } from "@/lib/admin-security-data";
import { threatLevelStyle } from "@/lib/security-data";
import { getScenarioById } from "@/lib/simulation-data";
import { emptyStateCopy } from "@/config/copy";
import { cn } from "@/lib/utils";


const columns: DataTableColumn<SimulationCaseRow>[] = [
  { key: "caseId", label: "案例编号", render: (r) => <span className="font-mono text-foreground">{r.caseId}</span> },
  { key: "threatType", label: "威胁类型", render: (r) => <span className="text-foreground/90">{r.threatType}</span> },
  {
    key: "risk",
    label: "风险等级",
    render: (r) => {
      const s = threatLevelStyle[r.risk];
      return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", s.bg, s.text)}>{s.label}</span>;
    },
  },
  { key: "asset", label: "资产", render: (r) => <span className="text-muted-foreground">{r.asset}</span>, hideOnMobile: true },
  { key: "amount", label: "金额", render: (r) => <span className="font-mono text-foreground">{r.amount}</span> },
  { key: "status", label: "状态", render: (r) => <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{simulationStatusLabel[r.status]}</span> },
];

export function AdminSecuritySimulationsPage() {
  const scenario = getScenarioById("token-drain");

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "攻击链分析" }]}
        title="攻击链分析"
        description="攻击路径与资产提取验证案例（实时分析，示例场景：Token Drain）"
      />

      <Link
        href={`/lab/security/simulation?scenario=${scenario.id}`}
        className="surface-gradient mb-5 flex flex-col items-start justify-between gap-3 rounded-lg border border-border/70 p-5 text-foreground transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <FlaskConical className="size-5" />
          </span>
          <div>
            <div className="text-[13.5px] font-semibold">{scenario.name} · {scenario.nameZh}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">前往 攻击路径分析 查看由真实 Simulation / Risk / Threat Engine 驱动的完整推演过程</div>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground">
          打开分析
          <ArrowRight className="size-3.5" />
        </span>
      </Link>

      <DataTable
        data={simulationCases}
        columns={columns}
        rowKey={(r) => r.caseId}
        searchPlaceholder="搜索案例编号 / 威胁类型…"
        searchFn={(r, q) => r.caseId.toLowerCase().includes(q) || r.threatType.toLowerCase().includes(q)}
        emptyDescription={emptyStateCopy.攻击链分析}
      />
    </div>
  );
}
