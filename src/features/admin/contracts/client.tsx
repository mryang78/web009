"use client";

import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { contractRecords, type ContractRecord } from "@/lib/admin/governance";
import { adminRiskBadgeClass } from "@/lib/admin/soc-badge";
import { cn } from "@/lib/utils";

const columns: DataTableColumn<ContractRecord>[] = [
  {
    key: "name",
    label: "合约",
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        <div className="font-mono text-[11.5px] text-muted-foreground">{r.address}</div>
      </div>
    ),
  },
  { key: "network", label: "所属链", render: (r) => <span className="text-muted-foreground">{r.network}</span>, hideOnMobile: true },
  { key: "type", label: "类型", render: (r) => <span className="text-muted-foreground">{r.type}</span> },
  {
    key: "riskLevel",
    label: "风险等级",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", adminRiskBadgeClass[r.riskLevel])}>
        {r.riskLevel}
      </span>
    ),
  },
  {
    key: "verified",
    label: "源码校验",
    render: (r) => (
      <span className={cn("text-[12.5px]", r.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
        {r.verified ? "已验证" : "未验证"}
      </span>
    ),
  },
  {
    key: "findings",
    label: "风险特征",
    render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.findings.join("、")}</span>,
    hideOnMobile: true,
  },
  { key: "firstSeen", label: "首次发现", render: (r) => <span className="text-muted-foreground">{r.firstSeen}</span>, hideOnMobile: true },
];

export function AdminContractsClient() {
  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "合约管理" }]}
        title="合约管理"
        description="合约静态特征与风险结论台账，用于判定恶意合约、可升级代理与异常授权入口。"
      />
      <DataTable
        data={contractRecords}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索合约名称 / 地址…"
        searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "SAFE", value: "SAFE" },
          { label: "MEDIUM", value: "MEDIUM" },
          { label: "HIGH", value: "HIGH" },
          { label: "CRITICAL", value: "CRITICAL" },
        ]}
        filterFn={(r, v) => r.riskLevel === v}
        pageSize={10}
      />
    </div>
  );
}
