"use client";

import { useMemo } from "react";
import { Search, LayoutGrid } from "lucide-react";
import { categories, products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/reveal";
import { useProductModal } from "@/components/product-modal-context";
import { cn } from "@/lib/utils";

export function ProductGridSection() {
  const { activeCategory, setActiveCategory, query, setQuery } = useProductModal();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === "全部" || p.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameZh.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, query]);

  return (
    <section id="products" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <LayoutGrid className="size-3.5" />
            产品矩阵
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            产品矩阵
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          20 多个自研产品，覆盖交易、钱包、DeFi、数据、活动、NFT、资讯、安全、工具与礼品卡消费场景。
        </p>
      </Reveal>

      <div id="category-filter" className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索产品..."
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>


      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((product, i) => (
          <Reveal key={product.id} delay={(i % 8) * 40}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          没有找到匹配的产品体验，换个关键词试试。
        </div>
      )}
    </section>
  );
}
