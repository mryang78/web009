"use client";
import { ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-cyan-600 px-6 py-20 text-center shadow-2xl shadow-primary/25 sm:px-12">
          {/* Animated orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
          {/* Grid */}
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.06]" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white/90 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              云虎安全后台 · 企业级智能管控
            </div>
            <h2 className="text-balance text-[2rem] font-bold tracking-tight text-white sm:text-[2.5rem]">
              进入云虎智能钱包提取后台
            </h2>
            <p className="mt-4 text-[15px] text-white/70">
              实时监控 · 链上资产管理 · AI 风险拦截 · 多签安全体系
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="group h-12 gap-2.5 rounded-full bg-white px-8 text-[14.5px] font-bold text-primary shadow-xl shadow-black/20 hover:bg-white/95 hover:scale-[1.02] transition-all"
              >
                <a href="/admin">
                  <LayoutDashboard className="size-4" />
                  立即进入后台
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="group h-12 gap-2 rounded-full border border-white/25 text-[14px] font-semibold text-white hover:bg-white/10 hover:border-white/40"
              >
                <a href="#products">
                  查看全部产品
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {["多重签名保护", "实时链上监控", "99.99% 可用率", "企业级加密"].map(badge => (
                <div key={badge} className="flex items-center gap-1.5 text-[12px] font-medium text-white/60">
                  <span className="size-1.5 rounded-full bg-white/40" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
