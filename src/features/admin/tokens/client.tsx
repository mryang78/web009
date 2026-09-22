"use client";

import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { socTokens } from "@/lib/soc/mock";
import { adminRiskBadgeClass } from "@/lib/admin/soc-badge";
import type { SocToken } from "@/lib/soc/types";
import { cn } from "@/lib/utils";

const columns: DataTableColumn<SocToken>[] = [
  {
    key: "name",
    label: "代币",
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        <div className="text-[11.5px] text-muted-foreground">{r.symbol}</div>
      </div>
    ),
  },
  { key: "decimals", label: "精度", render: (r) => <span className="font-mono text-muted-foreground">{r.decimals}</span>, hideOnMobile: true },
  {
    key: "mockPrice",
    label: "参考价格",
    render: (r) => <span className="font-mono tabular-nums text-foreground">${r.mockPrice.toLocaleString()}</span>,
  },
  { key: "totalSupply", label: "总供应量", render: (r) => <span className="font-mono text-muted-foreground">{r.totalSupply}</span>, hideOnMobile: true },
  {
    key: "riskLevel",
    label: "风险等级",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", adminRiskBadgeClass[r.riskLevel])}>
        {r.riskLevel}
      </span>
    ),
  },
];

export function TokensClient() {
  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "Token 库" }]}
        title="Token 样本库"
        description="安全运营平台中使用的代币样本库，包含正常主流代币与仿冒 / 高风险代币（均为分析数据）"
      />

      <DataTable
        data={socTokens}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索代币名称 / 代号…"
        searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.symbol.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "SAFE", value: "SAFE" },
          { label: "HIGH", value: "HIGH" },
          { label: "CRITICAL", value: "CRITICAL" },
        ]}
        filterFn={(r, v) => r.riskLevel === v}
        pageSize={8}
      />
    </div>
  );
}
