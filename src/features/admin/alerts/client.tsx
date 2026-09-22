"use client";

import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { useToast } from "@/components/admin/ui/toast";
import { securityRules } from "@/lib/soc/mock";
import { adminAlertLevelBadgeClass } from "@/lib/admin/soc-badge";
import { useAllAlerts } from "@/lib/alert-engine/use-alerts";
import type { AlertRecord } from "@/lib/alert-engine";
import { getWalletState } from "@/lib/wallet-engine";
import { cn } from "@/lib/utils";

const SEVERITY_LABEL = { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low" } as const;

function walletAddressOf(walletId?: string): string {
  if (!walletId) return "-";
  try {
    return getWalletState(walletId).address;
  } catch {
    return walletId;
  }
}

const columns: DataTableColumn<AlertRecord>[] = [
  { key: "id", label: "告警编号", render: (r) => <span className="font-mono text-foreground">{r.id}</span> },
  {
    key: "level",
    label: "级别",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", adminAlertLevelBadgeClass[SEVERITY_LABEL[r.severity]])}>
        {SEVERITY_LABEL[r.severity]}
      </span>
    ),
  },
  { key: "title", label: "告警标题", render: (r) => <span className="text-foreground/90">{r.title}</span> },
  { key: "wallet", label: "钱包", render: (r) => <span className="font-mono text-muted-foreground">{walletAddressOf(r.walletId)}</span>, hideOnMobile: true },
  { key: "time", label: "时间", render: (r) => <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString("zh-CN")}</span>, hideOnMobile: true },
  {
    key: "read",
    label: "状态",
    render: (r) => (
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", r.acknowledged ? "bg-secondary text-muted-foreground" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
        {r.acknowledged ? "已读" : "未读"}
      </span>
    ),
  },
];

export function AdminAlertsClient() {
  const toast = useToast();
  const alerts = useAllAlerts();
  const enabledCount = securityRules.filter((r) => r.enabled).length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "告警中心" }]}
        title="安全告警中心"
        description={`由真实 Simulation → Threat Engine → Alert Engine 链路自动产生的告警记录，当前 ${enabledCount}/${securityRules.length} 条规则处于启用状态`}
        actions={
          <button
            onClick={() => toast.success("实时分析：已生成告警周报。")}
            className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium hover:bg-secondary"
          >
            生成周报
          </button>
        }
      />

      <DataTable
        data={alerts}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索告警编号 / 标题…"
        searchFn={(r, q) => r.id.toLowerCase().includes(q) || r.title.includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "Critical", value: "CRITICAL" },
          { label: "High", value: "HIGH" },
          { label: "Medium", value: "MEDIUM" },
          { label: "Low", value: "LOW" },
        ]}
        filterFn={(r, v) => r.severity === v}
        pageSize={8}
        emptyDescription="暂无告警 —— 前往 攻击路径分析 运行一次分析攻击场景以生成真实告警。"
      />
    </div>
  );
}
