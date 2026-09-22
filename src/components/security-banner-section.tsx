"use client";

import Link from "@/components/app-link";
import { ArrowRight, ShieldHalf, Wallet, FileWarning, Radar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

const graphNodes = [
  { id: "wallet", label: "钱包", icon: Wallet, angle: -140, level: "neutral" as const },
  { id: "contract", label: "合约", icon: FileWarning, angle: -60, level: "critical" as const },
  { id: "flow", label: "资金流向", icon: Radar, angle: 20, level: "high" as const },
  { id: "engine", label: "已拦截", icon: ShieldCheck, angle: 100, level: "safe" as const },
];

const nodeColor = {
  neutral: "border-border text-foreground/80",
  critical: "border-red-500/40 text-red-400",
  high: "border-orange-500/40 text-orange-400",
  safe: "border-emerald-500/40 text-emerald-400",
};

function pos(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

export function SecurityBannerSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="relative overflow-hidden rounded-[28px] border border-red-500/20 bg-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative grid grid-cols-1 gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-red-400">
              <ShieldHalf className="size-3.5" />
              Web3 安全情报
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-[32px]">
              保护每一笔数字资产交互
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              从可疑地址、恶意合约到异常资产流向，
              <br className="hidden sm:block" />
              通过可视化分析进行威胁分析。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="group h-11 gap-2 rounded-xl bg-red-600 px-6 text-[15px] font-semibold text-white hover:bg-red-600/90"
              >
                <Link href="/lab/security#simulation-lab">
                  开始分析
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group h-11 gap-2 rounded-xl border-border bg-muted/70 px-6 text-[15px] font-medium text-foreground hover:bg-accent/60"
              >
                <Link href="/soc">
                  全链路安全分析平台
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[320px]">
            <div className="absolute inset-[8%] rounded-full border border-dashed border-border/70" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
              {graphNodes.map((n) => {
                const p = pos(n.angle, 38);
                return (
                  <line
                    key={n.id}
                    x1={50}
                    y1={50}
                    x2={p.x}
                    y2={p.y}
                    stroke="currentColor"
                    strokeWidth="0.4"
                    strokeDasharray="1.4 1.6"
                    className="text-white/15"
                  />
                );
              })}
              {graphNodes.map((n) => {
                const p = pos(n.angle, 38);
                return (
                  <circle key={`${n.id}-dot`} r="0.9" className="fill-red-400">
                    <animateMotion
                      dur="3.4s"
                      repeatCount="indefinite"
                      path={`M50,50 L${p.x},${p.y}`}
                    />
                  </circle>
                );
              })}
            </svg>

            <div className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl border border-red-500/40 bg-background shadow-[0_0_0_1px_rgba(239,68,68,0.15),0_20px_40px_-16px_rgba(239,68,68,0.5)]">
              <ShieldHalf className="size-5 text-red-400" />
              <span className="text-[8.5px] font-bold tracking-wide text-red-400">引擎</span>
            </div>

            {graphNodes.map((n) => {
              const p = pos(n.angle, 38);
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl border bg-background ${nodeColor[n.level]}`}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
