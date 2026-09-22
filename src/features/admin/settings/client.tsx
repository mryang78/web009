"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/admin/ui/toast";
import { settingGroups, systemMeta } from "@/lib/admin/governance";

export function AdminSettingsClient() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(settingGroups.flatMap((g) => g.toggles.map((t) => [t.id, t.enabled]))),
  );
  const toast = useToast();

  function toggle(id: string, label: string) {
    setState((prev) => {
      const next = !prev[id];
      toast.success(`${label} 已${next ? "开启" : "关闭"}`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "系统" }, { label: "系统设置" }]}
        title="系统设置"
        description="风险引擎、通知策略与平台安全边界配置。安全边界为硬约束，无法开启。"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {systemMeta.map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-[12px] text-muted-foreground">{m.label}</div>
            <div className="mt-1 font-mono text-[14px] font-semibold text-foreground">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {settingGroups.map((group) => (
          <section key={group.title} className="rounded-lg border border-border bg-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-[14.5px] font-semibold text-foreground">{group.title}</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{group.description}</p>
            </header>
            <ul className="divide-y divide-border">
              {group.toggles.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                      {t.label}
                      {t.locked && <Lock className="size-3.5 text-muted-foreground" />}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.description}</p>
                  </div>
                  <Switch
                    checked={t.locked ? false : (state[t.id] ?? false)}
                    disabled={t.locked}
                    onCheckedChange={() => !t.locked && toggle(t.id, t.label)}
                    aria-label={t.label}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
