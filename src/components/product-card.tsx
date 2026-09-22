"use client";
// ── 产品入口卡片 — 高逼真系统入口风格 ─────────────────────────────────────
import { useRef } from "react";
import { ArrowRight, Zap, Globe, ExternalLink, Signal } from "lucide-react";
import type { Product } from "@/lib/products";
import {
  productVersion, productUpdatedAgo, productOpsStatus,
  productOpsStatusLabel, categoryIconClass,
} from "@/lib/products";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Icon } from "@/components/icon";
import { getProductIcon } from "@/config/icons";
import { useProductModal } from "@/components/product-modal-context";
import { cn } from "@/lib/utils";

const statusDot: Record<string, string> = {
  Operational: "bg-emerald-500",
  Degraded:    "bg-amber-500",
  Maintenance: "bg-blue-500",
};
const statusBadge: Record<string, string> = {
  Operational: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Degraded:    "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Maintenance: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export function ProductCard({ product }: { product: Product }) {
  const { openProduct } = useProductModal();
  const accent = categoryIconClass[product.category];
  const status = productOpsStatus(product);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Cursor-following radial edge glow — updates CSS custom properties
  // instead of React state, so the mousemove handler never triggers a
  // re-render (cheap, 60fps-safe on a grid of many cards).
  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => openProduct(product)}
      onMouseMove={handleMouseMove}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-border/80 bg-card text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary/35 hover:shadow-2xl hover:shadow-primary/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Cursor-following radial edge glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />
      {/* Hover radial spotlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/3 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Top edge glow on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Thumbnail area */}
      <div className="relative p-3 pb-0">
        {/* Top meta row */}
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          {/* App icon — large, prominent, with badge */}
          <div className="relative">
            <span className={cn(
              "relative flex size-12 items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br text-white shadow-lg ring-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
              accent.gradient, accent.ring, accent.glow
            )}>
              {/* Inner sheen */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-black/10" />
              <Icon icon={getProductIcon(product.id)} strokeWidth={2.1} className="relative size-[22px] drop-shadow" />
            </span>
            {/* Live status badge on icon corner */}
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-card",
              statusDot[status]
            )}>
              {status === "Operational" && (
                <span className="absolute size-full animate-ping rounded-full opacity-50 bg-emerald-400" />
              )}
            </span>
          </div>

          {/* Index + status chip */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-data text-[10px] font-semibold tracking-wider text-muted-foreground/40">
              {String(product.index).padStart(2, "0")}
            </span>
            <span className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold",
              statusBadge[status]
            )}>
              <Signal className="size-2.5" />
              {productOpsStatusLabel[status]}
            </span>
          </div>
        </div>

        {/* Product preview thumbnail */}
        <div className="overflow-hidden rounded-xl ring-1 ring-border/50">
          <ProductThumbnail
            variant={product.thumbnail}
            accent={product.accent}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-2.5 p-4 pt-3.5">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/70">{product.nameZh}</p>
        </div>

        <p className="text-[12.5px] leading-[1.55] text-muted-foreground/85">
          {product.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 3).map(tag => (
            <span key={tag}
              className="rounded-full border border-border/70 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/80">
              {tag}
            </span>
          ))}
        </div>

        {/* ── System Entry CTA — the key "portal" element ── */}
        <div className="mt-auto">
          <div className={cn(
            "relative overflow-hidden rounded-xl border px-3.5 py-2.5 transition-all duration-200",
            "border-border/60 bg-secondary/20",
            "group-hover:border-primary/50 group-hover:bg-primary/6 group-hover:shadow-sm group-hover:shadow-primary/10"
          )}>
            {/* Shine sweep on hover */}
            <div className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {product.external
                  ? <ExternalLink className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                  : <Zap className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                }
                <span className="text-[12.5px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                  {product.external ? "访问平台" : "进入系统"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-data text-[10px] text-muted-foreground/50">
                  {product.external ? "外链" : productVersion(product)}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
