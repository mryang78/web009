"use client";

import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { riskAddressList, type RiskAddressRecord } from "@/lib/admin/governance";
import { adminRiskBadgeClass } from "@/lib/admin/soc-badge";
import { cn } from "@/lib/utils";

const columns: DataTableColumn<RiskAddressRecord>[] = [
  {
    key: "address",
    label: "地址",
    render: (r) => (
      <div>
        <div className="font-mono font-medium text-foreground">{r.address}</div>
        <div className="text-[11.5px] text-muted-foreground">{r.network}</div>
      </div>
    ),
  },
  { key: "category", label: "分类", render: (r) => <span className="text-muted-foreground">{r.category}</span> },
  {
    key: "riskLevel",
    label: "风险等级",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", adminRiskBadgeClass[r.riskLevel])}>
        {r.riskLevel}
      </span>
    ),
  },
  { key: "riskScore", label: "风险分", render: (r) => <span className="font-mono tabular-nums text-foreground">{r.riskScore}</span> },
  { key: "hits", label: "命中次数", render: (r) => <span className="font-mono text-muted-foreground">{r.hits}</span>, hideOnMobile: true },
  { key: "source", label: "来源", render: (r) => <span className="text-muted-foreground">{r.source}</span>, hideOnMobile: true },
  {
    key: "listed",
    label: "名单状态",
    render: (r) => (
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
          r.listed ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground",
        )}
      >
        {r.listed ? "已拦截" : "观察中"}
      </span>
    ),
  },
];

export function AdminAddressesClient() {
  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "风险地址名单" }]}
        title="风险地址名单"
        description="恶意地址、钓鱼合约与可疑收款地址的统一拦截名单，命中后在授权与转账分析中直接标红。"
      />
      <DataTable
        data={riskAddressList}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索地址 / 分类…"
        searchFn={(r, q) => r.address.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "已拦截", value: "listed" },
          { label: "观察中", value: "watch" },
        ]}
        filterFn={(r, v) => (v === "listed" ? r.listed : !r.listed)}
        pageSize={10}
      />
    </div>
  );
}
