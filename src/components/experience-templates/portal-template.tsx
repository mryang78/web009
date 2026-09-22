"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { products, tierMeta, type ProductTier } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { EmptyState } from "@/components/product-kit/empty-state";
import { cn } from "@/lib/utils";

const tierOrder: ProductTier[] = ["S", "A", "B"];
const tierPillClass: Record<ProductTier, string> = {
  S: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  A: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  B: "border-border bg-secondary text-muted-foreground",
};

export function PortalTemplate() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameZh.includes(q) ||
        p.category.includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="产品导航" subtitle="Unified Product Gateway · 快速跳转至任意产品体验" className="pb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="产品总数" value="20" />
          <StatTile label="S 级旗舰" value="4" />
          <StatTile label="A 级核心" value="5" />
          <StatTile label="B 级运营" value="11" />
        </div>
      </Section>

      <Section title="搜索产品" subtitle="Search" className="pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按产品名称 / 分类 / 标签搜索…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Section>

      {filtered.length === 0 ? (
        <EmptyState variant="no-results" description="换个关键词试试，例如「交易所」「安全」或「NFT」。" />
      ) : (
        tierOrder.map((tier) => {
          const list = filtered.filter((p) => p.tier === tier);
          if (list.length === 0) return null;
          return (
            <Section key={tier} title={tierMeta[tier].label} subtitle={tierMeta[tier].description}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((p) => (
                  <a
                    key={p.id}
                    href={`/lab/${p.id}`}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] text-muted-foreground">
                        {String(p.index).padStart(2, "0")}
                      </span>
                      <span className={cn("rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold", tierPillClass[p.tier])}>
                        {p.tier}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground group-hover:text-primary">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{p.nameZh}</span>
                  </a>
                ))}
              </div>
            </Section>
          );
        })
      )}
    </div>
  );
}
