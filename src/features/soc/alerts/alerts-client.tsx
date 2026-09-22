"use client";

import { useMemo, useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { AlertLevelBadge, SimulationOnlyTag } from "@/components/soc/badges";
import { useToast } from "@/components/admin/ui/toast";
import { securityRules } from "@/lib/soc/mock";
import { useAllAlerts } from "@/lib/alert-engine/use-alerts";
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

export function AlertsClient() {
  const alerts = useAllAlerts();
  const [rules, setRules] = useState(securityRules);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;
  const enabledCount = rules.filter((r) => r.enabled).length;

  const sorted = useMemo(() => [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [alerts]);

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }
  function markAllRead() {
    setReadIds(new Set(alerts.map((a) => a.id)));
    toast.success("已全部标记为已读。");
  }
  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "安全告警中心" }]}
        title="Alerts"
        description={`由真实 Simulation → Threat Engine → Alert Engine 链路自动产生的告警（当前 ${enabledCount}/${rules.length} 条规则启用），不再由本页面维护独立的告警分析数据`}
        actions={
          <div className="flex items-center gap-2">
            <SimulationOnlyTag />
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              全部标记已读
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border/70 bg-card/65 p-4">
          <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
            <Bell className="size-4" />
            告警列表 {unreadCount > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10.5px] font-bold text-red-400">{unreadCount} 未读</span>}
          </div>

          {sorted.length === 0 ? (
            <p className="rounded-xl border border-border/70 bg-secondary/45 px-4 py-8 text-center text-[12.5px] text-muted-foreground">
              暂无告警 —— 前往 攻击路径分析 运行一次分析攻击场景，Threat Engine 检出真实威胁后会在这里自动生成告警。
            </p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((a) => {
                const unread = !readIds.has(a.id);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => markRead(a.id)}
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-3 text-left transition-colors",
                        unread ? "border-red-500/25 bg-red-500/[0.04]" : "border-border/70 bg-card/45"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                        <AlertLevelBadge level={SEVERITY_LABEL[a.severity]} />
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-foreground">{a.title}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{a.message}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/80">
                        <span className="font-mono">{walletAddressOf(a.walletId)}</span>
                        <span>{new Date(a.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="rounded-2xl border border-border/70 bg-card/65 p-4">
          <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
            <ShieldCheck className="size-4" />
            规则引擎
          </div>
          <div className="space-y-2.5">
            {rules.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/70 bg-secondary/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-foreground">{r.name}</span>
                  <button
                    onClick={() => toggleRule(r.id)}
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      r.enabled ? "bg-emerald-500/70" : "bg-accent/60"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                        r.enabled ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{r.condition} → {r.action}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
