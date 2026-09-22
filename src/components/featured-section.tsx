"use client";

import Link from "@/components/app-link";
import { ArrowRight, Sparkles } from "lucide-react";
import { featuredProducts, categoryIconClass } from "@/lib/products";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { getProductIcon } from "@/config/icons";
import { Reveal } from "@/components/reveal";
import { useProductModal } from "@/components/product-modal-context";
import { cn } from "@/lib/utils";

const featuredOrder = ["web3-security", "cryptox", "web3-wallet", "web3-portal"];

const securityTags = ["威胁情报", "风险分析", "攻击链分析", "安全防护"];

export function FeaturedSection() {
  const { openProduct } = useProductModal();

  const ordered = [...featuredProducts].sort(
    (a, b) => featuredOrder.indexOf(a.id) - featuredOrder.indexOf(b.id)
  );
  const [hero, ...rest] = ordered;

  return (
    <section id="featured" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
      <Reveal className="flex items-end justify-between px-4 sm:px-0">
        <div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-3.5" />
            Featured
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            精选产品
          </h2>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {hero && (
          <Reveal className="group overflow-hidden rounded-[24px] border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] via-card to-card shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10 lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-5 pb-0 sm:pb-5">
                <div className="relative h-48 sm:h-full sm:min-h-[220px]">
                  <ProductThumbnail
                    variant={hero.thumbnail}
                    accent={hero.accent}
                    className="h-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-background/90 px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-red-500 backdrop-blur">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/70" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
                    </span>
                    FLAGSHIP
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Web3 安全情报中心
                  </h3>
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    安全
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  实时威胁分析、攻击路径分析与资产流向可视化。
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {securityTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full border-red-500/20 bg-red-500/5 text-[10.5px] font-medium text-red-500/90"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  asChild
                  className="group/btn mt-3 h-11 w-full justify-between bg-red-600 text-[15px] font-semibold text-white hover:bg-red-600/90"
                >
                  <Link href="/lab/security">
                    进入安全中心
                    <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        )}

        <div className="flex flex-col gap-5">
          {rest.map((product, i) => {
            const accent = categoryIconClass[product.category];
            return (
              <Reveal
                key={product.id}
                delay={(i + 1) * 80}
                className="group flex flex-1 overflow-hidden rounded-[20px] border border-border/80 bg-card shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex w-full items-center gap-4 p-4">
                  <div className="relative h-20 w-24 shrink-0 sm:h-24 sm:w-28">
                    <ProductThumbnail
                      variant={product.thumbnail}
                      accent={product.accent}
                      className="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div
                      className={cn(
                        "absolute -bottom-2 -right-2 flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-md ring-1",
                        accent.gradient,
                        accent.ring
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-black/10" />
                      <Icon icon={getProductIcon(product.id)} size="stat" strokeWidth={2.25} className="relative size-4" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                        {product.name}
                      </h3>
                      <span className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-red-600 dark:text-red-400">
                        S
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{product.description}</p>
                    <button
                      onClick={() => openProduct(product)}
                      className="group/btn mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 -mx-2.5 text-[13px] font-medium text-primary transition-colors duration-200 hover:bg-primary/10"
                    >
                      打开 体验
                      <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
