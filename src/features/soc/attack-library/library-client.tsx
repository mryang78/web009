"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RiskBadge, SimulationOnlyTag } from "@/components/soc/badges";
import { attackScenarios } from "@/lib/soc/mock";
import { cn } from "@/lib/utils";

export function AttackLibraryClient() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attackScenarios;
    return attackScenarios.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.includes(query) || s.description.includes(query)
    );
  }, [query]);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "攻击案例库" }]}
        title="Web3 攻击案例库"
        description={`收录 ${attackScenarios.length} 类典型 Web3 攻击手法，附带攻击向量、检测逻辑与防御建议（内容仅供安全教育参考）`}
        actions={<SimulationOnlyTag />}
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索攻击名称 / 分类 / 关键词…"
          className="h-10 w-full rounded-xl border border-border/70 bg-card/65 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => (
          <div key={s.id} className="flex flex-col rounded-2xl border border-border/70 bg-card/65 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">{s.category}</span>
                <h3 className="mt-0.5 text-[15px] font-semibold text-foreground">{s.name}</h3>
              </div>
              <RiskBadge level={s.riskLevel} />
            </div>
            <p className="mt-3 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">{s.description}</p>
            <div className="mt-3 rounded-lg border border-border/70 bg-secondary/45 px-3 py-2 text-[11.5px] text-muted-foreground/90">
              攻击向量：{s.attackVector}
            </div>
            <div className="mt-3 space-y-1.5 text-[11.5px]">
              <p className="text-emerald-400/90">
                <span className="font-semibold">检测：</span>
                {s.detectionLogic}
              </p>
              <p className="text-sky-400/90">
                <span className="font-semibold">建议：</span>
                {s.recommendation}
              </p>
            </div>
            <a
              href={`/soc/attack-chain`}
              className={cn(
                "mt-4 inline-flex items-center justify-center rounded-lg border border-border py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              )}
            >
              查看攻击链分析 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
