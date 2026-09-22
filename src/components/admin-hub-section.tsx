"use client";

import { useState, useEffect } from "react";
import Link from "@/components/app-link";
import {
  LayoutDashboard,
  Users,
  UserRound,
  BadgeCheck,
  Waypoints,
  PlayCircle,
  ShieldHalf,
  ArrowRight,
  Radio,
  Zap,
  Activity,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { categoryIconClass, products } from "@/lib/products";

// 后台矩阵仅展示接入统一运营后台的自研产品；精选合作入口（外部网站）不由本后台管理，不在此图中出现。
const backendManagedProducts = products.filter((p) => !p.external);
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { getProductIcon } from "@/config/icons";
import { useProductModal } from "@/components/product-modal-context";
import { cn } from "@/lib/utils";

const features = [
  { icon: Users, label: "用户管理" },
  { icon: UserRound, label: "用户资产" },
  { icon: BadgeCheck, label: "授权记录" },
  { icon: Waypoints, label: "资产流转" },
  { icon: PlayCircle, label: "钱包安全分析" },
];


// ─── Real-time Control Center Preview ─────────────────────────────────────────
const PRODUCT_CONTROLS = [
  { name: "钱包连接", status: "online", pulse: true  },
  { name: "资产追踪", status: "online", pulse: true  },
  { name: "安全拦截", status: "online", pulse: true  },
  { name: "DApp 监控", status: "online", pulse: false },
  { name: "授权审计", status: "online", pulse: false },
  { name: "风险评分", status: "online", pulse: true  },
];

const LIVE_OPS = [
  { time: "00:12", action: "拦截异常授权", target: "0xA2F1…8B4C", type: "block" },
  { time: "00:34", action: "推送风险预警", target: "TokenSwap DEX",  type: "warn"  },
  { time: "01:07", action: "更新钱包评分",  target: "0xD3E5…2C1A", type: "update"},
  { time: "02:21", action: "冻结高危地址",  target: "0x7BAC…4F2D", type: "block" },
];

function ControlCenterPreview() {
  const [tick, setTick] = useState(0);
  const [activeOp, setActiveOp] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveOp(n => (n + 1) % LIVE_OPS.length), 3400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-secondary/50 px-4 py-2.5">
        <span className="size-2 rounded-full bg-destructive/50" />
        <span className="size-2 rounded-full bg-warning/60" />
        <span className="size-2 rounded-full bg-success/60" />
        <div className="ml-3 flex items-center gap-1.5 rounded-md bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
          <LayoutDashboard className="size-3" />
          admin.yunhu · 控制面板
        </div>
        <div className="ml-auto flex items-center gap-1 text-[9.5px] text-emerald-400">
          <Radio className="size-2.5 animate-pulse" />
          实时在线
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-px border-b border-border/50 bg-border/30">
        {[
          { label: "活跃钱包", value: `${4821 + (tick % 7)}`, color: "text-primary" },
          { label: "今日拦截", value: `${127 + (tick % 5)}`, color: "text-red-400" },
          { label: "资产监控", value: "$8.24M", color: "text-emerald-400" },
        ].map(k => (
          <div key={k.label} className="bg-card px-3 py-2.5">
            <p className="text-[9.5px] text-muted-foreground/60">{k.label}</p>
            <p className={`mt-0.5 font-mono text-[13px] font-bold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Product toggles */}
      <div className="border-b border-border/50 px-3 py-2.5">
        <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/40">
          前端模块控制
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRODUCT_CONTROLS.map((p) => (
            <div key={p.name} className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2 py-1.5">
              <div className={`size-1.5 rounded-full ${p.pulse ? "bg-emerald-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="flex-1 text-[10.5px] text-foreground/70">{p.name}</span>
              <ToggleRight className="size-3.5 text-primary" />
            </div>
          ))}
        </div>
      </div>

      {/* Live ops feed */}
      <div className="px-3 py-2.5">
        <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/40">
          实时操作日志
        </p>
        <div className="space-y-1.5">
          {LIVE_OPS.map((op, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] transition-all duration-500 ${
                i === activeOp ? "bg-primary/10 border border-primary/20" : "bg-secondary/20"
              }`}
            >
              <span className="font-mono text-muted-foreground/40">{op.time}</span>
              <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                op.type === "block"  ? "bg-red-500/10 text-red-400" :
                op.type === "warn"   ? "bg-amber-500/10 text-amber-400" :
                                       "bg-blue-500/10 text-blue-400"
              }`}>
                {op.type === "block" ? "拦截" : op.type === "warn" ? "预警" : "更新"}
              </span>
              <span className="flex-1 text-foreground/70">{op.action}</span>
              <span className="font-mono text-[9.5px] text-muted-foreground/40">{op.target}</span>
              {i === activeOp && <Zap className="size-3 text-primary animate-pulse" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminHubSection() {
  const { openProduct } = useProductModal();

  return (
    <section id="matrix" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="max-w-2xl">
        <span className="text-sm font-medium text-primary">统一运营</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          一个后台，管理所有产品
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          所有产品接入同一套管理后台，统一账户体系、统一数据看板、统一权限与运营配置，
          新产品可快速接入矩阵，无需重复建设基础设施。
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-8 overflow-hidden rounded-[24px] border border-border/80 bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Real-time control center */}
          <div className="border-b border-border/70 bg-secondary/20 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <ControlCenterPreview />
          </div>

          {/* Right: feature list */}
          <div className="p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-foreground">后台核心能力</h3>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/20 px-3.5 py-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/90">{label}</span>
                </div>
              ))}

              <Link
                href="/admin/security/simulations"
                className="group flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-3.5 py-3 transition-colors hover:bg-red-500/10"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                  <ShieldHalf className="size-4 text-red-500" />
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">攻击链分析</span>
                <ArrowRight className="ml-auto size-3.5 text-red-500/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Direct admin entry */}
            <div className="mt-6">
              <Link
                href="/admin"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              >
                <LayoutDashboard className="size-4" />
                进入管理后台
                <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
                实时操控所有前端产品 · 零延迟下发配置
              </p>
            </div>
          </div>
        </div>

        {/* Flow: 1 Admin -> 20 Products */}
        <div className="border-t border-border/70 bg-secondary/10 px-6 py-10 sm:px-8">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <Link href="/admin" className="relative flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border border-primary/60 motion-reduce:hidden"
                style={{ animation: "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite" }}
              />
              <LayoutDashboard className="size-4" />
              管理后台
              <ExternalLink className="size-3 opacity-60" />
            </Link>
            <svg width="2" height="26" viewBox="0 0 2 26" className="text-primary/50" aria-hidden>
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="26"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
                className="motion-reduce:[animation:none]"
                style={{ animation: "flow-dash 0.9s linear infinite" }}
              />
            </svg>
            <span className="text-sm font-medium text-muted-foreground">20 多个自研产品统一接入</span>
          </div>

          <div className="mx-auto mt-7 grid max-w-5xl grid-cols-4 gap-3 sm:grid-cols-5 md:gap-4 lg:grid-cols-8">
            {backendManagedProducts.map((p, i) => {
              const accent = categoryIconClass[p.category];
              return (
                <Reveal key={p.id} delay={Math.min(i * 22, 320)}>
                  <button
                    onClick={() => openProduct(p)}
                    title={p.name}
                    className="group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border/70 bg-card px-2 py-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl sm:py-5"
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.09] transition-opacity duration-200 group-hover:opacity-[0.18]",
                        accent.gradient
                      )}
                    />
                    <span
                      className={cn(
                        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-0.5 sm:size-14 md:size-16",
                        accent.gradient,
                        accent.ring,
                        accent.glow
                      )}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-white/0 to-black/10" />
                      <Icon
                        icon={getProductIcon(p.id)}
                        size="hero"
                        strokeWidth={2}
                        className="relative size-6 drop-shadow-sm sm:size-7 md:size-8"
                      />
                    </span>
                    <span className="relative font-mono text-[10.5px] font-semibold text-muted-foreground/70 transition-colors group-hover:text-primary">
                      {String(p.index).padStart(2, "0")}
                    </span>
                    <span className="relative px-1 text-[12px] font-medium leading-tight text-foreground/85">
                      {p.name.length > 10 ? `${p.name.slice(0, 9)}…` : p.name}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
