"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { AdminDrawer } from "@/components/admin/ui/drawer";
import { attackScenarios } from "@/lib/soc/mock";
import { adminRiskBadgeClass } from "@/lib/admin/soc-badge";
import type { AttackScenario } from "@/lib/soc/types";
import { cn } from "@/lib/utils";

const columns: DataTableColumn<AttackScenario>[] = [
  { key: "name", label: "案例名称", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
  { key: "category", label: "分类", render: (r) => <span className="text-muted-foreground">{r.category}</span>, hideOnMobile: true },
  {
    key: "riskLevel",
    label: "风险等级",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", adminRiskBadgeClass[r.riskLevel])}>
        {r.riskLevel}
      </span>
    ),
  },
  { key: "chain", label: "链路步骤", render: (r) => <span className="font-mono text-muted-foreground">{r.chain.length} 步</span>, hideOnMobile: true },
];

export function AttackCasesClient() {
  const [active, setActive] = useState<AttackScenario | null>(null);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "攻击案例" }]}
        title="攻击案例库管理"
        description="维护前台攻击案例库与攻击链分析器所使用的案例内容（内容仅供安全教育参考）"
      />

      <DataTable
        data={attackScenarios}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索案例名称 / 分类…"
        searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.category.includes(q)}
        onRowClick={(r) => setActive(r)}
        pageSize={8}
      />

      <AdminDrawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name ?? ""}
        description="攻击案例详情"
        footer={
          active && (
            <Link
              href="/soc/attack-chain"
              className="flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              前往攻击链分析器查看
            </Link>
          )
        }
      >
        {active && (
          <div className="space-y-3 text-[13px]">
            <p className="text-muted-foreground">{active.description}</p>
            <div>
              <div className="text-[11.5px] text-muted-foreground">攻击向量</div>
              <div className="text-foreground">{active.attackVector}</div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground">检测逻辑</div>
              <div className="text-foreground">{active.detectionLogic}</div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground">安全建议</div>
              <div className="text-foreground">{active.recommendation}</div>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
}
