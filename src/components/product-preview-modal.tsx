"use client";

import Link from "@/components/app-link";
import { ArrowRight, ArrowUpRight, LayoutDashboard, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/product-thumbnail";
import type { Product } from "@/lib/products";

export function ProductPreviewModal({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto right-0 bottom-0 left-0 max-h-[90vh] w-full max-w-full translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:top-[50%] sm:right-auto sm:bottom-auto sm:left-[50%] sm:max-h-[85vh] sm:w-[min(90vw,56rem)] sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border"
      >
        {product && (
          <>
            <DialogTitle className="sr-only">{product.name} 产品预览</DialogTitle>

            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="relative flex flex-col justify-center gap-4 bg-secondary/30 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {product.external ? (
                    <>
                      <ExternalLink className="size-3.5 text-primary" />
                      第三方网站 · 非本平台产品
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="size-3.5 text-primary" />
                      admin.web3studio / {product.id}
                    </>
                  )}
                </div>
                <ProductThumbnail
                  variant={product.thumbnail}
                  accent={product.accent}
                  className="h-56 sm:h-64"
                />
                <div className="flex flex-wrap gap-1.5">
                  {product.modules.map((m) => (
                    <Badge
                      key={m}
                      variant="secondary"
                      className="rounded-full text-[11px] font-medium"
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 p-6 sm:p-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(product.index).padStart(2, "0")}
                    </span>
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      {product.category} {product.external ? "· 合作入口" : "体验"}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{product.nameZh}</p>
                </div>

                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {product.detail}
                </p>

                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    产品模块
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {product.external && (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                    即将离开 Web3 Studio，前往第三方官网。该服务由第三方独立运营，与本平台无关，请自行核实其真实性与安全性。
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2.5 pt-2 sm:flex-row">
                  {product.external ? (
                    <Button asChild size="lg" className="group h-11 flex-1 text-[15px]">
                      <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                        访问官网
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="group h-11 flex-1 text-[15px]">
                      <Link href={`/lab/${product.id}`}>
                        打开 体验
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  )}
                  <DialogClose asChild>
                    <Button size="lg" variant="outline" className="h-11 text-[15px]">
                      关闭
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
