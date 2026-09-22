import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/hero-visual";

const scenes = ["交易所", "钱包", "DeFi", "活动", "工具"];

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-40" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              云虎安全系统
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold tracking-wide text-foreground/70">
              智能钱包提取系统
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
              实时链上监控
            </span>
          </div>

          <span className="mt-6 block text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/50">
            Web3 Security Platform
          </span>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            云虎智能钱包提取后台
          </h1>

          <p className="mt-5 max-w-lg text-balance text-lg text-muted-foreground">
            精选链上核心场景，覆盖交易所、钱包、DeFi 全链路，一站直达最优入口
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground/80">
            {scenes.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {s}
                {i !== scenes.length - 1 && (
                  <span className="text-border">·</span>
                )}
              </span>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group h-11 px-6 text-[15px]">
              <a href="#products">
                浏览全部产品
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-[15px] border-primary/30 text-primary hover:bg-primary/5">
              <a href="/admin" className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                进入管理后台
              </a>
            </Button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
