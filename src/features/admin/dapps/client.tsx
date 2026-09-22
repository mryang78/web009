"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { AdminDrawer } from "@/components/admin/ui/drawer";
import { useToast } from "@/components/admin/ui/toast";
import { adminRiskBadgeClass } from "@/lib/admin/soc-badge";
import { setDAppStatus, type DAppDirectoryEntry } from "@/lib/dapp-directory";
import { useDAppDirectory } from "@/lib/dapp-directory/use-dapp-directory";
import { cn } from "@/lib/utils";

export function DAppsClient() {
  const dapps = useDAppDirectory();
  const [active, setActive] = useState<DAppDirectoryEntry | null>(null);
  const toast = useToast();

  const columns: DataTableColumn<DAppDirectoryEntry>[] = [
    { key: "name", label: "名称", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "domain", label: "域名", render: (r) => <span className="font-mono text-muted-foreground">{r.domain}</span> },
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
    {
      key: "status",
      label: "状态",
      render: (r) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            r.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-secondary text-muted-foreground"
          )}
        >
          {r.status === "Active" ? "监控中" : "已停用"}
        </span>
      ),
    },
  ];

  function toggleStatus(dapp: DAppDirectoryEntry) {
    const next = dapp.status === "Active" ? "Disabled" : "Active";
    const updated = setDAppStatus(dapp.id, next);
    setActive(updated);
    toast.success(
      next === "Active"
        ? `已将 ${dapp.name} 加入重点监控 —— /soc/dashboard 的 Suspicious DApps 统计会立即反映这次变化。`
        : `已停用对 ${dapp.name} 的监控。`
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全运营" }, { label: "DApp 库" }]}
        title="DApp 样本库"
        description="全链路安全运营平台中使用的高风险 / 钓鱼 DApp 样本库 —— 与 /soc/dashboard 共用同一份 DApp Directory，这里的编辑会实时反映到 SOC 统计"
      />

      <DataTable
        data={dapps}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="搜索 DApp 名称 / 域名…"
        searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "CRITICAL", value: "CRITICAL" },
          { label: "HIGH", value: "HIGH" },
          { label: "MEDIUM", value: "MEDIUM" },
        ]}
        filterFn={(r, v) => r.riskLevel === v}
        onRowClick={(r) => setActive(r)}
        pageSize={8}
      />

      <AdminDrawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name ?? ""}
        description="DApp 详情"
        footer={
          active && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toggleStatus(active)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  active.status === "Active"
                    ? "border border-border text-foreground hover:bg-secondary"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {active.status === "Active" ? "停用监控" : "加入重点监控"}
              </button>
            </div>
          )
        }
      >
        {active && (
          <div className="space-y-3 text-[13px]">
            <Field label="域名" value={active.domain} mono />
            <Field label="合约地址" value={active.contractAddress} mono />
            <Field label="分类" value={active.category} />
            <Field label="风险等级" value={active.riskLevel} />
            <Field label="状态" value={active.status === "Active" ? "监控中" : "已停用"} />
            {active.updatedAt && <Field label="最近编辑" value={new Date(active.updatedAt).toLocaleString("zh-CN")} />}
          </div>
        )}
      </AdminDrawer>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-foreground" : "text-foreground"}>{value}</div>
    </div>
  );
}
