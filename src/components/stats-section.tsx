"use client";
import { useEffect, useState } from "react";
import { stats } from "@/lib/products";
import { Reveal } from "@/components/reveal";
import { TrendingUp } from "lucide-react";

// Animate numbers upward on mount
function AnimatedNum({ target, duration = 1400 }: { target: string; duration?: number }) {
  const num = parseFloat(target.replace(/[^0-9.]/g, ""));
  const prefix = target.match(/^[^0-9]*/)?.[0] ?? "";
  const suffix = target.match(/[^0-9.]+$/)?.[0] ?? "";
  const isDecimal = target.includes(".");
  const [cur, setCur] = useState(0);

  useEffect(() => {
    if (isNaN(num)) return;
    let start: number;
    function step(ts: number) {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setCur(parseFloat((ease * num).toFixed(isDecimal ? 1 : 0)));
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [num, duration, isDecimal]);

  if (isNaN(num)) return <span>{target}</span>;
  return <span>{prefix}{isDecimal ? cur.toFixed(1) : cur.toLocaleString()}{suffix}</span>;
}

const GRADIENTS = [
  "from-primary to-cyan-500",
  "from-cyan-500 to-emerald-500",
  "from-violet-500 to-primary",
  "from-emerald-500 to-teal-500",
];

const SUBLABELS = [
  "精选优质合作伙伴",
  "集中式管理平台",
  "覆盖核心 Web3 场景",
  "零延迟链上监控",
];

export function StatsSection() {
  return (
    <section className="relative mx-auto -mt-4 max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
          {/* Subtle gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-cyan-500/3 rounded-2xl" />
          <div className="grid grid-cols-2 gap-0 sm:divide-x sm:divide-border lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-7 text-center sm:rounded-none"
              >
                <span className={`bg-gradient-to-br ${GRADIENTS[i]} bg-clip-text text-[2rem] font-bold tracking-tight text-transparent sm:text-[2.25rem]`}>
                  <AnimatedNum target={stat.value} />
                </span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-[12.5px] font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground/50 tracking-wide">
                  {SUBLABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
