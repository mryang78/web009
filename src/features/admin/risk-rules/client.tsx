"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { securityRules } from "@/lib/soc/mock";
import { useToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/utils";

interface RuleRow {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  weight: number;
  category: string;
}

const extraRules: RuleRow[] = [
  { id: "RULE-005", name: "Permit / Permit2 离线签名检测", condition: "EIP-2612 / Permit2 signature", action: "Risk = CRITICAL", enabled: true, weight: 24, category: "签名" },
  { id: "RULE-006", name: "恶意签名意图还原", condition: "Typed data → transfer intent", action: "Trigger Alert", enabled: true, weight: 20, category: "签名" },
  { id: "RULE-007", name: "钓鱼域名匹配", condition: "Domain similarity > 0.85", action: "Risk = CRITICAL", enabled: true, weight: 22, category: "DApp" },
  { id: "RULE-008", name: "风险地址名单命中", condition: "Address in blocklist", action: "Block", enabled: true, weight: 30, category: "地址" },
  { id: "RULE-009", name: "可升级代理合约提示", condition: "Proxy + upgradeable", action: "Risk = MEDIUM", enabled: false, weight: 10, category: "合约" },
  { id: "RULE-010", name: "资金异常外流检测", condition: "Outflow > 60% in 1h", action: "Trigger Alert", enabled: true, weight: 18, category: "资金流" },
];

const baseRules: RuleRow[] = securityRules.map((r, i) => ({
  ...r,
  weight: [26, 28, 20, 16][i] ?? 15,
  category: ["授权", "授权", "授权", "资金流"][i] ?? "授权",
}));

export function AdminRiskRulesClient() {
  const [rules, setRules] = useState<RuleRow[]>([...baseRules, ...extraRules]);
  const toast = useToast();

  function toggle(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    const rule = rules.find((r) => r.id === id);
    toast.success(`${rule?.name ?? id} 已${rule?.enabled ? "停用" : "启用"}`);
  }

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全中心" }, { label: "风险规则" }]}
        title="风险规则"
        description={`风险评分与自动处置的规则集合，共 ${rules.length} 条，当前启用 ${activeCount} 条。`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{rule.id}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{rule.category}</span>
                </div>
                <h3 className="mt-1.5 text-[14px] font-semibold text-foreground">{rule.name}</h3>
              </div>
              <Switch checked={rule.enabled} onCheckedChange={() => toggle(rule.id)} aria-label={`启用 ${rule.name}`} />
            </div>

            <dl className="mt-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">触发条件</dt>
                <dd className="font-mono text-right text-foreground/90">{rule.condition}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">处置动作</dt>
                <dd className="font-mono text-right text-foreground/90">{rule.action}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">评分权重</dt>
                <dd className="font-mono tabular-nums text-foreground/90">{rule.weight}</dd>
              </div>
            </dl>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", rule.enabled ? "bg-gradient-to-r from-primary to-accent" : "bg-muted-foreground/30")}
                style={{ width: `${Math.min(100, rule.weight * 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
