"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { AdminDrawer } from "@/components/admin/ui/drawer";
import { useToast } from "@/components/admin/ui/toast";
import { emptyStateCopy } from "@/config/copy";
import type { UserRow } from "@/lib/admin/mock";

export function UsersClient({ rows }: { rows: UserRow[] }) {
  const [active, setActive] = useState<UserRow | null>(null);
  const toast = useToast();

  const columns: DataTableColumn<UserRow>[] = [
    { key: "userId", label: "用户ID", render: (r) => <span className="font-mono font-medium text-foreground">{r.userId}</span> },
    { key: "wallet", label: "钱包地址", render: (r) => <span className="font-mono text-muted-foreground">{r.wallet}</span> },
    { key: "vip", label: "VIP 等级", render: (r) => <span className="text-muted-foreground">{r.vip}</span>, hideOnMobile: true },
    { key: "points", label: "积分", render: (r) => <span className="font-mono tabular-nums text-foreground">{r.points}</span>, hideOnMobile: true },
    { key: "lastActive", label: "最后活跃", render: (r) => <span className="text-muted-foreground/80">{r.lastActive}</span>, hideOnMobile: true },
    { key: "status", label: "状态", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "用户管理" }]}
        title="用户管理"
        description="按用户ID或钱包地址搜索、按状态筛选用户"
      />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.userId}
        searchPlaceholder="搜索用户ID / 钱包地址…"
        searchFn={(r, q) => r.userId.toLowerCase().includes(q) || r.wallet.toLowerCase().includes(q)}
        filters={[
          { label: "全部", value: "all" },
          { label: "正常", value: "正常" },
          { label: "VIP", value: "VIP" },
          { label: "活跃", value: "活跃" },
          { label: "风险", value: "风险" },
          { label: "封禁", value: "封禁" },
        ]}
        filterFn={(r, v) => r.status === v}
        onRowClick={(r) => setActive(r)}
        pageSize={8}
        emptyDescription={emptyStateCopy.用户管理}
      />

      <AdminDrawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.userId ?? ""}
        description="用户详情（隔离数据）"
        footer={
          active && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toast.success(`实时分析：已向 ${active.userId} 发送风控复核。`)}
                className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium hover:bg-secondary"
              >
                发起风控复核
              </button>
              <button
                onClick={() => toast.success(`实时分析：${active.userId} 状态已更新。`)}
                className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                保存
              </button>
            </div>
          )
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Field label="钱包地址" value={active.wallet} mono />
              <Field label="邮箱" value={active.email} />
              <Field label="VIP 等级" value={active.vip} />
              <Field label="积分" value={active.points} mono />
              <Field label="加入时间" value={active.joinedAt} />
              <Field label="最后活跃" value={active.lastActive} />
            </div>
            <div>
              <div className="mb-1.5 text-[12.5px] font-medium text-muted-foreground">状态</div>
              <StatusPill status={active.status} />
            </div>
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-muted-foreground">最近活动</div>
              <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
                <li>· 登录 · {active.lastActive}</li>
                <li>· 完成测试网交易 0.42 ETH → 1,462.08 USDT</li>
                <li>· 参与「新用户体验金活动」</li>
              </ul>
            </div>
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
