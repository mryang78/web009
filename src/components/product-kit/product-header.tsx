"use client";

import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import type { Product } from "@/lib/products";
import { tierMeta, categoryIconClass } from "@/lib/products";
import { Icon } from "@/components/icon";
import { getProductIcon } from "@/config/icons";
import { cn } from "@/lib/utils";

const tierBadgeClass: Record<string, string> = {
  S: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  A: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  B: "border-border bg-secondary text-muted-foreground",
};

/**
 * Full product-identity header shown at the top of every experience page:
 * name / English tagline / "体验 Environment" live dot, plus a
 * right-aligned Language / Theme / 体验 Mode control cluster. Purely
 * decorative (no real i18n or theme switching) — it exists to make each
 * experience read as a real shipped product, not a template page.
 */
export function ProductHeader({ product }: { product: Product }) {
  const [lang, setLang] = useState<"中文" | "EN">("中文");
  const accent = categoryIconClass[product.category];

  return (
    <div className="border-b border-border/70 bg-secondary/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1",
              accent.gradient,
              accent.ring,
              accent.glow
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-black/10" />
            <Icon icon={getProductIcon(product.id)} size="title" strokeWidth={2.25} className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">{product.name}</h1>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                  tierBadgeClass[product.tier]
                )}
                title={tierMeta[product.tier].label}
              >
                {product.tier}
              </span>
              <span className="hidden items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                实时分析
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {product.tagline ?? product.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setLang((l) => (l === "中文" ? "EN" : "中文"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="size-3.5" />
            {lang}
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
}
