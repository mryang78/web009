"use client";

import { Building2, Wallet, TrendingUp, Zap, Wrench, ArrowUpRight } from "lucide-react";
import { categoryMatrix, products } from "@/lib/products";
import { Reveal } from "@/components/reveal";
import { useProductModal } from "@/components/product-modal-context";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  交易所: Building2,
  钱包: Wallet,
  DeFi: TrendingUp,
  活动: Zap,
  工具: Wrench,
};

const CATEGORY_COLORS: Record<string, { icon: string; glow: string; border: string }> = {
  交易所: { icon: "text-blue-500", glow: "bg-blue-500/10", border: "group-hover:border-blue-500/30" },
  钱包: { icon: "text-cyan-500", glow: "bg-cyan-500/10", border: "group-hover:border-cyan-500/30" },
  DeFi: { icon: "text-teal-500", glow: "bg-teal-500/10", border: "group-hover:border-teal-500/30" },
  活动: { icon: "text-amber-500", glow: "bg-amber-500/10", border: "group-hover:border-amber-500/30" },
  工具: { icon: "text-slate-400", glow: "bg-slate-500/10", border: "group-hover:border-slate-400/30" },
};

export function CategoryMatrixSection() {
  const { jumpToCategory } = useProductModal();

  const countByCategory = (value: string) =>
    products.filter((p) => p.category === value).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <span className="text-sm font-medium text-primary">产品矩阵分类</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          按类目快速定位产品
        </h2>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categoryMatrix.map((cat, i) => {
          const Icon = CATEGORY_ICONS[cat.label] ?? Wrench;
          const colors = CATEGORY_COLORS[cat.label] ?? { icon: "text-muted-foreground", glow: "bg-muted/30", border: "group-hover:border-primary/30" };
          const count = countByCategory(cat.value);

          return (
            <Reveal key={cat.value} delay={i * 50}>
              <button
                onClick={() => jumpToCategory(cat.value)}
                className={`group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/80 bg-card px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${colors.border}`}
              >
                {/* Subtle glow background on hover */}
                <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${colors.glow}`} />

                {/* Icon */}
                <div className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl ${colors.glow}`}>
                  <Icon className={`size-4.5 ${colors.icon}`} />
                </div>

                {/* Label + count */}
                <div className="relative w-full">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                    <ArrowUpRight className={`size-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${colors.icon} opacity-0 group-hover:opacity-70`} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground/50">{cat.index}</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {count > 0 ? `${count} 个产品` : "即将上线"}
                    </span>
                  </div>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
