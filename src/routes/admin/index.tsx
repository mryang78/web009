"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, BadgeCheck, ShieldCheck, UserRound, Users, Waypoints, Workflow,
  TrendingUp, TrendingDown, Activity, Zap, Globe,
  DollarSign, ExternalLink, LayoutGrid, Wallet, Brain, Sparkles,
  Download, Copy, CheckCheck, ChevronRight,
  Radio, ToggleRight, Power, CheckCircle2, Signal,
} from "lucide-react";
import AppLink from "@/components/app-link";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { ThreatMap } from "@/components/admin/threat-map";
import { PageHeader } from "@/components/admin/ui/page-header";
import { MiniBars, Sparkline } from "@/components/admin/ui/sparkline";
import {
  approvalEventTrend, assetRiskTrend, assetSecurityOverview, threatEventTrend,
} from "@/lib/admin/wallet-security-data";
import { products } from "@/lib/products";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "运营工作台 · Web3 Studio" },
      { name: "description", content: "统一管理 Web3 产品、用户资产、授权记录和安全态势。" },
      { property: "og:title", content: "运营工作台 · Web3 Studio" },
      { property: "og:description", content: "统一管理 Web3 产品、用户资产、授权记录和安全态势。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

const quickLinks = [
  { label: "用户管理",     desc: "查看与管理注册用户",       href: "/admin/users",                icon: Users },
  { label: "用户资产",     desc: "查看用户当前持有资产",     href: "/admin/user-assets",          icon: UserRound },
  { label: "授权记录",     desc: "复核授权与可提取额度",     href: "/admin/approvals",            icon: BadgeCheck },
  { label: "资产流转",     desc: "追踪钱包至目标地址路径",   href: "/admin/asset-flows",          icon: Waypoints },
  { label: "钱包安全分析", desc: "验证授权与提取防护流程",   href: "/admin/wallet-simulator",     icon: Workflow },
  { label: "攻击链分析",   desc: "复现威胁场景与拦截路径",   href: "/admin/security/simulations", icon: ShieldCheck },
];

// —— 增强数据：近 7 天交易量 ——
const txVolumeData = [
  { day: "周一", volume: 4.2, count: 1820 },
  { day: "周二", volume: 5.8, count: 2340 },
  { day: "周三", volume: 3.9, count: 1560 },
  { day: "周四", volume: 7.1, count: 2890 },
  { day: "周五", volume: 9.4, count: 3750 },
  { day: "周六", volume: 6.7, count: 2680 },
  { day: "周日", volume: 8.2, count: 3210 },
];

// —— 风险分布饼图 ——
const riskDistData = [
  { name: "低风险",  value: 68, color: "#22c55e" },
  { name: "中风险",  value: 21, color: "#f59e0b" },
  { name: "高风险",  value: 8,  color: "#f97316" },
  { name: "严重风险", value: 3,  color: "#ef4444" },
];

// —— DApp 风险排名 ——
const dappRiskData = [
  { name: "TokenSwap DEX",    risk: 95, blocked: 284 },
  { name: "AirdropReward",    risk: 88, blocked: 192 },
  { name: "NFT Minter Pro",   risk: 76, blocked: 143 },
  { name: "LiquidStake",      risk: 62, blocked: 97 },
  { name: "CrossChainBridge", risk: 55, blocked: 72 },
];

// —— 告警类型 ——
interface AlertItem {
  time: string;
  type: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  msg: string;
  chain: string;
  // 详情字段
  txHash?: string;
  wallet?: string;
  amount?: string;
  description?: string;
  status?: "open" | "investigating" | "resolved";
  ruleId?: string;
}

// —— 实时安全事件流 ——
const recentAlerts: AlertItem[] = [
  {
    time: "2 分钟前",  type: "CRITICAL", msg: "检测到批量授权异常",       chain: "ETH",
    txHash: "0xf4a9…c831", wallet: "0xA2F1…8B4C", amount: "∞ USDT",
    description: "合约 0xSPEND…d44 被授权无限提取 USDT，已触发高优先级拦截规则 R-4421。建议立即撤销授权并冻结该钱包的链上操作。",
    status: "open", ruleId: "R-4421",
  },
  {
    time: "8 分钟前",  type: "HIGH",     msg: "钱包 0xA2F1 触发提取限额", chain: "BSC",
    txHash: "0xb2c1…7f20", wallet: "0xA2F1…8B4C", amount: "48.2 BNB",
    description: "24 小时内提取金额超过设定阈值（$50,000），转账目标为 Tornado.cash 混币器入口地址。",
    status: "investigating", ruleId: "R-2210",
  },
  {
    time: "15 分钟前", type: "MEDIUM",   msg: "新合约部署待审核",          chain: "ETH",
    txHash: "0xc3d4…1a90", wallet: "0xD3E5…2C1A", amount: "0 ETH",
    description: "新部署合约含 `transferFrom(address, address, uint256)` 且未设置提取上限，可能用于无限授权攻击。",
    status: "open", ruleId: "R-1104",
  },
  {
    time: "23 分钟前", type: "LOW",      msg: "用户登录异地 IP",           chain: "-",
    wallet: "0xF912…9D3B", description: "用户 ID #u-8821 从 IP 185.220.xx.xx（Tor 出口节点）登录，已触发 2FA 二次验证。",
    status: "resolved", ruleId: "R-0012",
  },
  {
    time: "41 分钟前", type: "HIGH",     msg: "DEX 流动性异常抽离警告",   chain: "ARB",
    txHash: "0xe5f6…3b40", wallet: "0x7BAC…4F2D", amount: "$2.8M",
    description: "TokenSwap DEX ETH/USDC 池中 LP 头寸在 90 秒内被全部提取，与已知的流动性抽离攻击模式匹配度 87%。",
    status: "investigating", ruleId: "R-3388",
  },
];

const alertColor: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-500/10 dark:text-red-400",
  HIGH:     "text-orange-600 bg-orange-500/10 dark:text-orange-400",
  MEDIUM:   "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  LOW:      "text-sky-600 bg-sky-500/10 dark:text-sky-400",
};

// —— KPI 卡片基础数据（运行时会动态微调） ——
const KPI_BASE = [
  { label: "今日交易量",  baseNum: 8.24,  fmt: (n: number) => `$${n.toFixed(2)}M`, change: "+12.4%", up: true,  icon: DollarSign, color: "text-emerald-500" },
  { label: "活跃钱包",    baseNum: 4821,  fmt: (n: number) => n.toLocaleString(),   change: "+8.2%",  up: true,  icon: Wallet,     color: "text-blue-500"   },
  { label: "安全拦截",    baseNum: 127,   fmt: (n: number) => String(Math.round(n)), change: "+34.6%", up: false, icon: Activity,   color: "text-red-500"    },
  { label: "平均风险评分", baseNum: 72.4, fmt: (n: number) => n.toFixed(1),         change: "-3.1%",  up: true,  icon: Activity,   color: "text-amber-500"  },
  { label: "DApp 监控中", baseNum: 28,   fmt: (n: number) => String(Math.round(n)), change: "0.0%",   up: true,  icon: Globe,      color: "text-violet-500" },
  { label: "响应时间",    baseNum: 0.8,  fmt: (n: number) => `${n.toFixed(2)}s`,    change: "-18.2%", up: true,  icon: Zap,        color: "text-cyan-500"   },
];

// ── AI 安全摘要（打字机轮播） ──
const AI_INSIGHTS = [
  "当前最高威胁：ETH 链批量 Approval 异常，置信度 94%。建议优先核查 0xA2F1 钱包的授权列表。",
  "过去 24 小时检测到 3 起闪电贷攻击模式，TokenSwap DEX 风险评分上升至 95，建议暂停交互。",
  "Polygon 链资产流转量较昨日增加 41%，Sybil 地址聚类检测命中 12 个新地址，已加入风险名单。",
  "ARB 链跨链桥出现异常大额提款（$4.2M），资金流向 Tornado.cash 混币节点，持续追踪中。",
  "合规评估：本周新增合约中 18% 含高危函数 `transferFrom(∞)` 未设限额，建议强制审计。",
];

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl text-[11px]">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ── 告警模板（实时追加用） ──
const ALERT_POOL: Omit<AlertItem, "time">[] = [
  { type: "CRITICAL", msg: "检测到批量授权异常，涉及 47 个地址",       chain: "ETH",  txHash: "0xaa11…bb22", wallet: "0x1234…abcd", amount: "∞ USDC", description: "批量扫描检测到 47 个地址在同一区块内向同一 Spender 合约发出无限授权。", status: "open",          ruleId: "R-4422" },
  { type: "HIGH",     msg: "MEV Bot 抢跑交易，损失估算 $12,400",      chain: "BSC",  txHash: "0xcc33…dd44", wallet: "0xMEV1…0000", amount: "$12,400", description: "三明治攻击：MEV Bot 在用户大额 Swap 前后各插入一笔交易，获利 $12,400。",   status: "investigating", ruleId: "R-5501" },
  { type: "MEDIUM",   msg: "新部署合约含无限授权函数 transferFrom(∞)",  chain: "ARB",  txHash: "0xee55…ff66", wallet: "0xDEPL…0001", amount: "0 ETH",   description: "新合约字节码分析：发现 `transferFrom` 函数未设上限，存在被滥用风险。",   status: "open",          ruleId: "R-1105" },
  { type: "HIGH",     msg: "钱包 0xD3A2 余额骤降 89%",                chain: "ETH",  txHash: "0x7788…9900", wallet: "0xD3A2…5566", amount: "34.7 ETH", description: "钱包在 3 分钟内余额从 31.6 ETH 降至 3.5 ETH，资金流向未知混币节点。",   status: "open",          ruleId: "R-2211" },
  { type: "LOW",      msg: "IP 异地登录，已触发 2FA 二次验证",          chain: "-",                          wallet: "0xF912…9D3B",              description: "用户从非常用国家（RU）登录，系统已发送 2FA 短信。",                       status: "resolved",      ruleId: "R-0013" },
  { type: "CRITICAL", msg: "流动性池异常抽离，$2.8M 资金外流",          chain: "ETH",  txHash: "0xaabb…ccdd", wallet: "0x7BAC…4F2D", amount: "$2.8M",   description: "LP 池资金在单笔交易中被全部取出，与 Rug Pull 攻击模式高度匹配。",        status: "open",          ruleId: "R-3389" },
  { type: "MEDIUM",   msg: "Sybil 地址聚类检测命中 8 个新地址",         chain: "Poly", txHash: "0xeeff…0011", wallet: "多地址聚类",  amount: "N/A",      description: "图神经网络聚类分析发现 8 个地址行为高度相似，疑似同一实体控制的 Sybil 集群。", status: "investigating", ruleId: "R-6601" },
];

const TIME_RANGES = ["1H", "24H", "7D", "30D"] as const;
type TimeRange = typeof TIME_RANGES[number];

function generateTrendData(range: TimeRange) {
  const pts = range === "1H" ? 12 : range === "24H" ? 24 : range === "7D" ? 14 : 30;
  return Array.from({ length: pts }, (_, i) => ({
    date: range === "1H" ? `${i * 5}m` : range === "24H" ? `${i}h` : range === "7D" ? `9/${8 + i}` : `8/${22 + i}`,
    资产风险: 40 + Math.random() * 40,
    授权事件: 5 + Math.random() * 20,
    威胁拦截: 2 + Math.random() * 18,
  }));
}

function AdminDashboard() {
  // ── KPI 实时跳动 ──
  const [kpiNums, setKpiNums] = useState(() => KPI_BASE.map(k => k.baseNum));
  useEffect(() => {
    const t = setInterval(() => {
      setKpiNums(prev => prev.map((n, i) => {
        const jitter = (Math.random() - 0.48) * KPI_BASE[i].baseNum * 0.012;
        return Math.max(0, n + jitter);
      }));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // ── 图表时间轴切换 ──
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  const [trendData, setTrendData] = useState(() => generateTrendData("7D"));
  useEffect(() => { setTrendData(generateTrendData(timeRange)); }, [timeRange]);

  // ── 实时告警流 ──
  const [liveAlerts, setLiveAlerts] = useState(recentAlerts);
  useEffect(() => {
    const t = setInterval(() => {
      const pick = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
      const mins = Math.floor(Math.random() * 3) + 1;
      setLiveAlerts(prev => [{ ...pick, time: `${mins} 分钟前` }, ...prev.slice(0, 7)]);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // ── 告警行点击抽屉 ──
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // ── CSV 导出 ──
  const [csvCopied, setCsvCopied] = useState(false);
  const exportCSV = useCallback(() => {
    const header = ["时间", "级别", "消息", "链", "钱包", "金额", "状态", "规则ID"];
    const rows = liveAlerts.map(a => [
      a.time, a.type, a.msg, a.chain,
      a.wallet ?? "-", a.amount ?? "-",
      a.status ?? "open", a.ruleId ?? "-",
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alerts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setCsvCopied(true);
    setTimeout(() => setCsvCopied(false), 2000);
  }, [liveAlerts]);

  // ── AI 摘要打字机 ──
  const [insightIdx, setInsightIdx] = useState(0);
  const [displayed, setDisplayed]   = useState("");
  const charRef = useRef(0);
  useEffect(() => {
    charRef.current = 0;
    setDisplayed("");
    const full = AI_INSIGHTS[insightIdx];
    const t = setInterval(() => {
      charRef.current++;
      setDisplayed(full.slice(0, charRef.current));
      if (charRef.current >= full.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [insightIdx]);
  useEffect(() => {
    const t = setInterval(() => {
      setInsightIdx(i => (i + 1) % AI_INSIGHTS.length);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "工作台" }]}
        title="运营工作台"
        description="资产、安全与用户状态统一视图 · 每日 00:00 更新"
      />

      {/* ── AI 智能安全摘要卡 ── */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-cyan/5 to-violet-500/5 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.65_0.2_253/8%),transparent_60%)]" />
        <div className="relative flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">AI 安全态势分析</span>
              <Sparkles className="size-3 text-primary/50 animate-pulse" />
              <span className="ml-auto text-[10px] text-muted-foreground/60">
                {insightIdx + 1} / {AI_INSIGHTS.length}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90">
              {displayed}
              <span className="ml-px inline-block h-3.5 w-0.5 animate-pulse bg-primary align-text-bottom" />
            </p>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary/40 transition-all duration-[12000ms] ease-linear"
            style={{ width: `${((insightIdx + 1) / AI_INSIGHTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── KPI 卡片行（实时跳动数字） ── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold">今日关键指标</h2>
            <p className="text-xs text-muted-foreground">与昨日对比 · 实时更新</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {KPI_BASE.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="surface-gradient rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <span className={`rounded-md p-1.5 bg-secondary/60 ${k.color}`}>
                    <Icon className="size-3.5" />
                  </span>
                </div>
                <p className="mt-2 font-display text-xl font-bold tabular-nums text-foreground transition-all duration-500">
                  {k.fmt(kpiNums[i])}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {k.up ? (
                    <TrendingUp className="size-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                  <span className={`text-[10.5px] font-medium ${k.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {k.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 全球威胁地图 ── */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-sm font-semibold">全球攻击态势地图</h2>
          <p className="text-xs text-muted-foreground">实时追踪链上攻击来源与目标节点分布</p>
        </div>
        <ThreatMap />
      </section>

      {/* ── 主趋势图 + 实时告警 ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 综合趋势图（带时间轴切换） */}
        <div className="surface-gradient rounded-xl border border-border/70 p-4 lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-sm font-semibold">综合安全趋势</h3>
              <p className="text-xs text-muted-foreground">资产风险 · 授权事件 · 威胁拦截</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg border border-border/60 bg-secondary/40 p-0.5">
                {TIME_RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors ${
                      timeRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >{r}</button>
                ))}
              </div>
              <AppLink href="/admin/alerts" className="text-xs font-semibold text-primary">全部 →</AppLink>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(0.65 0.2 253)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 253)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(0.68 0.2 25)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.68 0.2 25)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 248 / 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.03 248)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.03 248)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="资产风险"  stroke="oklch(0.65 0.2 253)"  strokeWidth={2} fill="url(#gRisk)"   dot={false} />
              <Area type="monotone" dataKey="威胁拦截" stroke="oklch(0.68 0.2 25)"   strokeWidth={2} fill="url(#gThreat)" dot={false} />
              <Line  type="monotone" dataKey="授权事件" stroke="oklch(0.82 0.13 210)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 实时告警流 */}
        <div className="surface-gradient rounded-xl border border-border/70 p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-sm font-semibold">实时安全告警</h3>
              <p className="text-xs text-muted-foreground">过去 1 小时 · 点击查看详情</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {csvCopied ? <CheckCheck className="size-3 text-emerald-500" /> : <Download className="size-3" />}
                {csvCopied ? "已导出" : "CSV"}
              </button>
              <AppLink href="/admin/alerts" className="text-xs font-semibold text-primary">全部 →</AppLink>
            </div>
          </div>
          <div className="space-y-1.5">
            {liveAlerts.slice(0, 6).map((a, i) => (
              <button
                key={`${a.time}-${i}`}
                onClick={() => setSelectedAlert(a)}
                className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-all hover:bg-secondary/40 cursor-pointer ${i === 0 ? "animate-[fadeIn_0.4s_ease]" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${alertColor[a.type]}`}>
                  {a.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium text-foreground">{a.msg}</p>
                  <p className="text-[10.5px] text-muted-foreground">{a.time} · {a.chain}</p>
                </div>
                <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 第二行：交易量 + 风险分布 + DApp排名 ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 近 7 天交易量 */}
        <div className="surface-gradient rounded-xl border border-border/70 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">近 7 天资产流转量</h3>
            <p className="text-xs text-muted-foreground">单位：百万 USD</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={txVolumeData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 248 / 15%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "oklch(0.55 0.03 248)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.03 248)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="volume" name="流转量(M)" radius={[4, 4, 0, 0]}
                fill="oklch(0.65 0.2 253)"
                fillOpacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 风险分布饼图 */}
        <div className="surface-gradient rounded-xl border border-border/70 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">钱包风险分布</h3>
            <p className="text-xs text-muted-foreground">当前全量钱包</p>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="50%" height={140}>
              <PieChart>
                <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={1} stroke="transparent">
                  {riskDistData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {riskDistData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px] text-foreground/80">{d.name}</span>
                  <span className="ml-auto text-[11px] font-semibold text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DApp 风险排名 */}
        <div className="surface-gradient rounded-xl border border-border/70 p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-sm font-semibold">高风险 DApp Top 5</h3>
              <p className="text-xs text-muted-foreground">按风险评分排序</p>
            </div>
            <AppLink href="/admin/dapps" className="text-xs font-semibold text-primary">全部 →</AppLink>
          </div>
          <div className="space-y-2.5">
            {dappRiskData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11.5px] font-medium text-foreground">{d.name}</span>
                    <span className={`ml-2 shrink-0 text-[10.5px] font-bold ${d.risk >= 85 ? "text-red-500" : d.risk >= 70 ? "text-orange-500" : "text-amber-500"}`}>
                      {d.risk}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${d.risk >= 85 ? "bg-red-500" : d.risk >= 70 ? "bg-orange-500" : "bg-amber-500"}`}
                      style={{ width: `${d.risk}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 第三行：原有迷你趋势图 ── */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-sm font-semibold">14 日细粒度趋势</h2>
          <p className="text-xs text-muted-foreground">资产风险 · 授权事件 · 威胁事件</p>
        </div>
        <div className="mt-0 grid gap-4 lg:grid-cols-3">
          <div className="surface-gradient rounded-lg border border-border/70 p-4">
            <h3 className="text-sm font-semibold">资产风险评分</h3>
            <p className="text-xs text-muted-foreground">近 14 日</p>
            <Sparkline data={assetRiskTrend} className="mt-3 h-16 w-full" color="stroke-primary" />
          </div>
          <div className="surface-gradient rounded-lg border border-border/70 p-4">
            <h3 className="text-sm font-semibold">授权事件数量</h3>
            <p className="text-xs text-muted-foreground">近 14 日</p>
            <Sparkline data={approvalEventTrend} className="mt-3 h-16 w-full" color="stroke-cyan" />
          </div>
          <div className="surface-gradient rounded-lg border border-border/70 p-4">
            <h3 className="text-sm font-semibold">威胁拦截次数</h3>
            <p className="text-xs text-muted-foreground">近 14 日</p>
            <MiniBars data={threatEventTrend} className="mt-3 h-16 w-full" />
          </div>
        </div>
      </section>

      {/* ── 快捷入口 ── */}
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold">快捷入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ label, desc, href, icon: Icon }) => (
            <AppLink
              key={href}
              href={href}
              className="surface-gradient group flex items-start gap-3 rounded-lg border border-border/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-gradient-brand text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {label}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
              </span>
            </AppLink>
          ))}
        </div>
      </section>


      {/* ── 前端实时管控面板 ── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold flex items-center gap-2">
              <Signal className="size-4 text-emerald-500 animate-pulse" />
              前端实时管控
            </h2>
            <p className="text-xs text-muted-foreground">后台直连前端 · 推送配置实时生效</p>
          </div>
          <AppLink href="/" className="flex items-center gap-1 text-xs font-semibold text-primary">
            查看前端效果 <ExternalLink className="size-3" />
          </AppLink>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* 连接状态面板 */}
          <div className="surface-gradient rounded-xl border border-emerald-500/20 bg-emerald-500/3 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">系统连接状态</h3>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-500">
                <Radio className="size-3 animate-pulse" />
                全部在线
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "前端展示层",    status: "已连接", latency: "2ms",   color: "text-emerald-400" },
                { label: "钱包接口层",    status: "已连接", latency: "8ms",   color: "text-emerald-400" },
                { label: "链上数据节点",  status: "已连接", latency: "43ms",  color: "text-emerald-400" },
                { label: "安全分析引擎",  status: "已连接", latency: "12ms",  color: "text-emerald-400" },
                { label: "告警推送服务",  status: "已连接", latency: "5ms",   color: "text-emerald-400" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 rounded-lg bg-background/30 px-3 py-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                  <span className="flex-1 text-[12px] text-foreground/80">{row.label}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground/50">{row.latency}</span>
                  <span className={`text-[10.5px] font-semibold ${row.color}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 前端模块开关控制 */}
          <div className="surface-gradient rounded-xl border border-border/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">前端模块开关</h3>
              <span className="text-[10.5px] text-muted-foreground/50">配置实时下发</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "首页展示",      enabled: true,  users: "全部用户" },
                { name: "钱包连接模块",  enabled: true,  users: "已认证用户" },
                { name: "资产提取功能",  enabled: true,  users: "高级用户" },
                { name: "安全分析面板",  enabled: true,  users: "全部用户" },
                { name: "DeFi 操作入口", enabled: true,  users: "全部用户" },
                { name: "NFT 市场入口",  enabled: true,  users: "全部用户" },
              ].map(mod => (
                <div key={mod.name} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <ToggleRight className={`size-4 shrink-0 ${mod.enabled ? "text-primary" : "text-muted-foreground/30"}`} />
                  <span className="flex-1 text-[12px] font-medium text-foreground/80">{mod.name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9.5px] text-muted-foreground/60">{mod.users}</span>
                  <span className={`h-2 w-2 rounded-full ${mod.enabled ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 前端产品矩阵一览 ── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold flex items-center gap-2">
              <LayoutGrid className="size-4 text-primary" />
              前端产品矩阵
            </h2>
            <p className="text-xs text-muted-foreground">{products.length} 个前端产品由本后台统一管控 · 点击直达</p>
          </div>
          <AppLink href="/" className="flex items-center gap-1 text-xs font-semibold text-primary">
            前往前端主页 <ExternalLink className="size-3" />
          </AppLink>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/50">
          {/* 分类标题行 */}
          {(["交易所", "钱包", "DeFi", "数据", "NFT", "社交", "游戏", "工具"] as const).map((cat) => {
            const catProducts = products.filter((p) => p.category === cat);
            if (!catProducts.length) return null;
            return (
              <div key={cat} className="border-b border-border/50 last:border-b-0">
                <div className="flex items-center gap-2 bg-secondary/30 px-4 py-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                    {cat}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{catProducts.length} 个产品</span>
                </div>
                <div className="flex flex-wrap gap-2 px-4 py-3">
                  {catProducts.map((p) => (
                    <AppLink
                      key={p.id}
                      href={`/lab/${p.id}`}
                      className="group flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-[11.5px] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                    >
                      <span className="font-mono text-[9.5px] text-muted-foreground/50">
                        {String(p.index).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-foreground/85 group-hover:text-foreground">
                        {p.name}
                      </span>
                    </AppLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 告警详情抽屉 ── */}
      <DetailDrawer
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.msg}
        subtitle={`${selectedAlert?.type} · ${selectedAlert?.chain} · ${selectedAlert?.time}`}
        width="w-[500px]"
      >
        {selectedAlert && (
          <div className="space-y-4">
            {/* 状态徽章 */}
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${alertColor[selectedAlert.type]}`}>
                {selectedAlert.type}
              </span>
              {selectedAlert.status && (
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
                  selectedAlert.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                  selectedAlert.status === "investigating" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {selectedAlert.status === "resolved" ? "已处理" : selectedAlert.status === "investigating" ? "调查中" : "待处理"}
                </span>
              )}
              {selectedAlert.ruleId && (
                <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{selectedAlert.ruleId}</span>
              )}
            </div>

            {/* 描述 */}
            {selectedAlert.description && (
              <div className="rounded-xl bg-secondary/40 p-3.5">
                <p className="text-[12.5px] leading-relaxed text-foreground/85">{selectedAlert.description}</p>
              </div>
            )}

            {/* 技术详情 */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">技术详情</h4>
              {[
                { label: "链", value: selectedAlert.chain },
                { label: "钱包地址", value: selectedAlert.wallet },
                { label: "涉及金额", value: selectedAlert.amount },
                { label: "交易 Hash", value: selectedAlert.txHash },
                { label: "触发时间", value: selectedAlert.time },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-start justify-between gap-2 border-b border-border/40 pb-2 last:border-0">
                  <span className="shrink-0 text-[11.5px] text-muted-foreground">{row.label}</span>
                  <span className="font-mono text-[11.5px] text-foreground/90 text-right break-all">{row.value}</span>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1">
              {selectedAlert.status !== "resolved" && (
                <button
                  onClick={() => {
                    setLiveAlerts(prev => prev.map(a =>
                      a === selectedAlert ? { ...a, status: "resolved" as const } : a
                    ));
                    setSelectedAlert(prev => prev ? { ...prev, status: "resolved" } : null);
                  }}
                  className="flex-1 rounded-xl bg-emerald-500/15 py-2.5 text-[12.5px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
                >
                  标记为已处理
                </button>
              )}
              <button
                onClick={() => {
                  if (selectedAlert.txHash) {
                    navigator.clipboard.writeText(selectedAlert.txHash).catch(() => {});
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="size-3.5" />
                复制 Hash
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
