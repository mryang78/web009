"use client";
// ---------------------------------------------------------------------------
// 首页实时监控仪表盘 — 用户资产 / 用户管理 / 安全态势
// ---------------------------------------------------------------------------
import {
  Users, Wallet, ShieldCheck, Activity,
  AlertTriangle, ArrowRight, Zap,
  BarChart3, Globe, BadgeCheck, UserPlus,
  MapPin, TrendingUp, Clock,
} from "lucide-react";

// ── KPI 卡片 ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color, pulse = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full opacity-10 blur-2xl ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`flex size-10 items-center justify-center rounded-xl bg-opacity-15 ${color}`}>
          <Icon className={`size-5 ${color.replace("bg-", "text-")}`} />
        </div>
        {pulse && (
          <span className="relative mt-1 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="mt-4">
        <span className="text-[28px] font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="mt-3 text-[11.5px] font-medium text-muted-foreground">{sub}</div>
    </div>
  );
}

// ── 链上节点 ──────────────────────────────────────────────────────────────────
const CHAIN_NODES = [
  { name: "Ethereum", short: "ETH" },
  { name: "BNB Chain", short: "BSC" },
  { name: "Polygon",  short: "POL" },
  { name: "Arbitrum", short: "ARB" },
];

// ── 用户状态类别 ──────────────────────────────────────────────────────────────
const USER_CATS = [
  { label: "正常", color: "bg-emerald-500", count: "3,214", pct: 64 },
  { label: "VIP",  color: "bg-blue-500",    count: "891",   pct: 18 },
  { label: "活跃", color: "bg-violet-500",  count: "412",   pct: 8  },
  { label: "风险", color: "bg-amber-500",   count: "176",   pct: 3  },
  { label: "封禁", color: "bg-red-500",     count: "49",    pct: 1  },
];

// ── 近期活动记录 ──────────────────────────────────────────────────────────────
const ACTIVITY = [
  { icon: ShieldCheck, label: "风控规则触发",   sub: "IP 异常 · 同一 IP 连续 5 次失败登录", time: "3 分钟前",  color: "text-red-500",    bg: "bg-red-500/10"    },
  { icon: BadgeCheck,  label: "KYC 审核通过",  sub: "用户 U-9203 实名认证成功 · 等级已解锁", time: "6 分钟前",  color: "text-emerald-500",bg: "bg-emerald-500/10"},
  { icon: Users,       label: "新用户注册",     sub: "批量注册 12 个新账户 · 已通过 KYC",   time: "8 分钟前",  color: "text-blue-500",   bg: "bg-blue-500/10"   },
  { icon: TrendingUp,  label: "VIP 等级升级",  sub: "用户 U-5512 升级至 VIP 3 · 已发放权益", time: "12 分钟前", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Activity,    label: "链上资金归集",   sub: "ETH 主网归集 84.32 ETH → 冷钱包",    time: "15 分钟前", color: "text-cyan-500",   bg: "bg-cyan-500/10"   },
];

// ── 最近注册用户 ──────────────────────────────────────────────────────────────
const RECENT_USERS = [
  { id: "U-9211", initials: "张", time: "2 分钟前",  kyc: "已通过", risk: "正常", color: "bg-blue-500"    },
  { id: "U-9210", initials: "李", time: "11 分钟前", kyc: "审核中", risk: "待审", color: "bg-amber-500"   },
  { id: "U-9209", initials: "王", time: "28 分钟前", kyc: "已通过", risk: "正常", color: "bg-emerald-500" },
  { id: "U-9208", initials: "陈", time: "41 分钟前", kyc: "已通过", risk: "VIP",  color: "bg-violet-500"  },
];

// ── 用户地域 Top 5 ────────────────────────────────────────────────────────────
const GEO_DIST = [
  { country: "中国大陆", flag: "🇨🇳", count: 2103, pct: 44 },
  { country: "中国香港", flag: "🇭🇰", count: 891,  pct: 19 },
  { country: "新加坡",   flag: "🇸🇬", count: 534,  pct: 11 },
  { country: "美国",     flag: "🇺🇸", count: 317,  pct: 7  },
  { country: "日本",     flag: "🇯🇵", count: 214,  pct: 5  },
];

// ── 主组件 ────────────────────────────────────────────────────────────────────
export function HomeDashboardSection() {
  return (
    <section className="relative overflow-hidden bg-background py-12 md:py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                实时监控中心
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              平台运营全景仪表盘
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              接入实时链上数据源后自动展示 · 所有指标来源于链上实时状态
            </p>
          </div>
          <a
            href="/admin"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            进入管理后台
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={Users}         label="注册用户总数"   value="4,742"  sub="↑ 128 本月新增" color="bg-blue-500"    pulse />
          <KpiCard icon={Activity}      label="当前在线用户"   value="1,209"  sub="↑ 较昨日 +8.3%" color="bg-emerald-500" pulse />
          <KpiCard icon={Wallet}        label="平台资产总值"   value="$8.4M"  sub="实时链上估值"   color="bg-violet-500" />
          <KpiCard icon={AlertTriangle} label="待处理风险告警" value="7"      sub="需立即处理"     color="bg-amber-500" />
          <KpiCard icon={BarChart3}     label="今日链上交易"   value="3,847"  sub="成功率 99.9%"   color="bg-cyan-500"    pulse />
        </div>

        {/* Main content grid */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* Left: activity feed + recent users */}
          <div className="flex flex-col gap-5 lg:col-span-2">

            {/* Activity feed */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Zap className="size-4 text-primary" />
                  <span className="text-[13.5px] font-semibold text-foreground">实时活动流</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">LIVE</span>
                </div>
                <a href="/admin/audit-logs" className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                  查看全部 <ArrowRight className="size-3" />
                </a>
              </div>
              <div className="divide-y divide-border/50">
                {ACTIVITY.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 transition hover:bg-secondary/30">
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                        <Icon className={`size-3.5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent registered users */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="size-4 text-primary" />
                  <span className="text-[13.5px] font-semibold text-foreground">最近注册用户</span>
                </div>
                <a href="/admin/users" className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                  用户管理 <ArrowRight className="size-3" />
                </a>
              </div>
              <div className="divide-y divide-border/50">
                {RECENT_USERS.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3 transition hover:bg-secondary/30">
                    {/* Avatar */}
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${u.color} text-[12px] font-bold text-white`}>
                      {u.initials}
                    </div>
                    {/* ID */}
                    <span className="w-20 shrink-0 font-mono text-[12.5px] font-semibold text-foreground">{u.id}</span>
                    {/* KYC */}
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      u.kyc === "已通过"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      {u.kyc === "已通过" ? "✓ " : "⏳ "}{u.kyc}
                    </span>
                    {/* Risk */}
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      u.risk === "VIP"  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      u.risk === "正常" ? "bg-secondary text-muted-foreground" :
                                          "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      {u.risk}
                    </span>
                    {/* Time */}
                    <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/60">
                      <Clock className="size-3" />
                      {u.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: panels */}
          <div className="space-y-4">
            {/* User status distribution */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">用户状态分布</span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                {USER_CATS.map((s) => (
                  <div key={s.label} className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {USER_CATS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct * 1.5}%` }} />
                      </div>
                      <span className="w-12 text-right font-semibold tabular-nums text-foreground">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic distribution */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">用户地域 Top 5</span>
              </div>
              <div className="space-y-3">
                {GEO_DIST.map((g) => (
                  <div key={g.country} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 text-foreground/90">
                        <span className="text-base leading-none">{g.flag}</span>
                        {g.country}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">{g.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${g.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain status */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">链上节点状态</span>
              </div>
              <div className="space-y-3">
                {CHAIN_NODES.map((chain) => (
                  <div key={chain.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[12px] font-medium text-foreground">{chain.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">在线</span>
                      <span className="text-[11px] tabular-nums text-muted-foreground/50">— ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: quick nav cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/users",       icon: Users,       label: "用户管理",  sub: "管理注册用户与权限",  color: "text-blue-500"   },
            { href: "/admin/user-assets", icon: Wallet,      label: "资产与钱包", sub: "链上资产追踪与管控",  color: "text-violet-500" },
            { href: "/admin/approvals",   icon: ShieldCheck, label: "安全中心",  sub: "风险告警与合规复核",  color: "text-amber-500"  },
            { href: "/admin/asset-flows", icon: Activity,    label: "资金流向",  sub: "链上资金路径追踪",    color: "text-cyan-500"   },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-px hover:border-primary/30"
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary ${item.color}`}>
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
                <ArrowRight className={`ml-auto size-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 ${item.color}`} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
