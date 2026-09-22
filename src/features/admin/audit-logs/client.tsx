"use client";

import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { auditLogs, type AuditLogRecord } from "@/lib/admin/governance";
import { cn } from "@/lib/utils";

const resultClass: Record<AuditLogRecord["result"], string> = {
  成功: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  失败: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  已拦截: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const columns: DataTableColumn<AuditLogRecord>[] = [
  { key: "time", label: "时间", render: (r) => <span className="font-mono text-[12.5px] text-muted-foreground">{r.time}</span> },
  {
    key: "actor",
    label: "操作人",
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.actor}</div>
        <div className="text-[11.5px] text-muted-foreground">{r.role}</div>
      </div>
    ),
  },
  { key: "action", label: "操作", render: (r) => <span className="text-foreground/90">{r.action}</span> },
  { key: "target", label: "对象", render: (r) => <span className="font-mono text-muted-foreground">{r.target}</span>, hideOnMobile: true },
  { key: "ip", label: "来源 IP", render: (r) => <span className="font-mono text-muted-foreground">{r.ip}</span>, hideOnMobile: true },
  {
    key: "result",
    label: "结果",
    render: (r) => <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", resultClass[r.result])}>{r.result}</span>,
  },
];

export function AdminAuditLogsClient() {
  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "系统" }, { label: "操作日志" }]}
        title="操作日志"
        description="后台全部管理动作的审计留痕，包含操作人、角色、对象、来源 IP 与执行结果。"
      />
      <DataTable
        data={auditLogs}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索操作人 / 操作内容…"
        searchFn={(r, q) => r.actor.toLowerCase().includes(q) || r.action.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "成功", value: "成功" },
          { label: "失败", value: "失败" },
          { label: "已拦截", value: "已拦截" },
        ]}
        filterFn={(r, v) => r.result === v}
        pageSize={12}
      />
    </div>
  );
}
