"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DeFi 协议风险矩阵 — 主流协议综合安全评级（仅模拟，不接入真实数据）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldOff, TrendingDown,
  ExternalLink, Filter, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type RiskGrade = "A+" | "A" | "B+" | "B" | "C" | "D";
type Chain = "ETH" | "BSC" | "ARB" | "OP" | "AVAX" | "POLY";

interface Incident {
  date: string;
  desc: string;
  lossUsd: number;
}

interface Protocol {
  id: string;
  name: string;
  category: string;
  chains: Chain[];
  tvlUsd: number;
  riskScore: number;   // 0-100, lower = safer
  grade: RiskGrade;
  auditCount: number;
  bugBountyUsd: number;
  lastAuditDays: number;   // days since last audit
  incidents: Incident[];
  hasInsurance: boolean;
  upgradeableProxy: boolean;
  adminKeyMultisig: boolean;
  oracleType: string;
  tags: string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const PROTOCOLS: Protocol[] = [
  {
    id: "uniswap-v3", name: "Uniswap V3", category: "DEX", chains: ["ETH","ARB","OP","POLY"],
    tvlUsd: 4_200_000_000, riskScore: 12, grade: "A+", auditCount: 8, bugBountyUsd: 2_000_000,
    lastAuditDays: 45, incidents: [], hasInsurance: true, upgradeableProxy: false,
    adminKeyMultisig: true, oracleType: "TWAP", tags: ["已审计", "无升级代理", "多签管理"],
  },
  {
    id: "aave-v3", name: "Aave V3", category: "借贷", chains: ["ETH","ARB","OP","POLY","AVAX"],
    tvlUsd: 7_800_000_000, riskScore: 18, grade: "A+", auditCount: 12, bugBountyUsd: 5_000_000,
    lastAuditDays: 22, incidents: [], hasInsurance: true, upgradeableProxy: true,
    adminKeyMultisig: true, oracleType: "Chainlink", tags: ["已审计", "保险覆盖", "Chainlink 预言机"],
  },
  {
    id: "compound-v3", name: "Compound V3", category: "借贷", chains: ["ETH","ARB"],
    tvlUsd: 1_100_000_000, riskScore: 22, grade: "A", auditCount: 7, bugBountyUsd: 150_000,
    lastAuditDays: 120, incidents: [{ date: "2023-07", desc: "预言机异常（无损）", lossUsd: 0 }],
    hasInsurance: false, upgradeableProxy: true, adminKeyMultisig: true,
    oracleType: "Chainlink", tags: ["已审计", "可升级合约"],
  },
  {
    id: "curve", name: "Curve Finance", category: "DEX", chains: ["ETH","ARB","OP","POLY","AVAX"],
    tvlUsd: 2_400_000_000, riskScore: 35, grade: "B+", auditCount: 6, bugBountyUsd: 250_000,
    lastAuditDays: 180,
    incidents: [{ date: "2023-07", desc: "Vyper 编译器漏洞重入攻击", lossUsd: 47_000_000 }],
    hasInsurance: false, upgradeableProxy: false, adminKeyMultisig: true,
    oracleType: "内置 TWAP", tags: ["已审计", "历史漏洞"],
  },
  {
    id: "lido", name: "Lido Finance", category: "流动质押", chains: ["ETH"],
    tvlUsd: 21_000_000_000, riskScore: 28, grade: "A", auditCount: 10, bugBountyUsd: 2_000_000,
    lastAuditDays: 60, incidents: [], hasInsurance: true, upgradeableProxy: true,
    adminKeyMultisig: true, oracleType: "Chainlink", tags: ["已审计", "保险覆盖", "可升级合约"],
  },
  {
    id: "gmx-v2", name: "GMX V2", category: "衍生品", chains: ["ARB","AVAX"],
    tvlUsd: 580_000_000, riskScore: 41, grade: "B", auditCount: 4, bugBountyUsd: 500_000,
    lastAuditDays: 90,
    incidents: [{ date: "2022-09", desc: "预言机价格操纵（$560K）", lossUsd: 560_000 }],
    hasInsurance: false, upgradeableProxy: false, adminKeyMultisig: true,
    oracleType: "Chainlink + 自研", tags: ["已审计", "历史漏洞"],
  },
  {
    id: "balancer-v2", name: "Balancer V2", category: "DEX", chains: ["ETH","ARB","OP","POLY"],
    tvlUsd: 820_000_000, riskScore: 38, grade: "B+", auditCount: 5, bugBountyUsd: 1_000_000,
    lastAuditDays: 150,
    incidents: [{ date: "2023-08", desc: "访问控制漏洞预警（已修复）", lossUsd: 0 }],
    hasInsurance: false, upgradeableProxy: true, adminKeyMultisig: true,
    oracleType: "内置 TWAP", tags: ["已审计", "可升级合约"],
  },
  {
    id: "synthetix", name: "Synthetix V3", category: "衍生品", chains: ["ETH","OP"],
    tvlUsd: 340_000_000, riskScore: 52, grade: "B", auditCount: 9, bugBountyUsd: 300_000,
    lastAuditDays: 200,
    incidents: [
      { date: "2019-06", desc: "预言机操纵（1 亿 sETH）", lossUsd: 0 },
      { date: "2020-12", desc: "错误定价套利", lossUsd: 1_000_000 },
    ],
    hasInsurance: false, upgradeableProxy: true, adminKeyMultisig: true,
    oracleType: "Chainlink", tags: ["可升级合约", "历史漏洞"],
  },
  {
    id: "radiant-capital", name: "Radiant Capital", category: "借贷", chains: ["ARB","BSC"],
    tvlUsd: 58_000_000, riskScore: 85, grade: "D", auditCount: 2, bugBountyUsd: 50_000,
    lastAuditDays: 380,
    incidents: [
      { date: "2024-01", desc: "闪电贷价格操纵 $4.5M", lossUsd: 4_500_000 },
      { date: "2024-10", desc: "多签私钥被盗 $50M", lossUsd: 50_000_000 },
    ],
    hasInsurance: false, upgradeableProxy: true, adminKeyMultisig: false,
    oracleType: "Chainlink", tags: ["审计陈旧", "历史漏洞", "高风险"],
  },
  {
    id: "mango-markets", name: "Mango Markets (Solana)", category: "借贷", chains: ["ETH"],
    tvlUsd: 8_000_000, riskScore: 78, grade: "C", auditCount: 1, bugBountyUsd: 0,
    lastAuditDays: 500,
    incidents: [{ date: "2022-10", desc: "预言机价格操纵 $114M", lossUsd: 114_000_000 }],
    hasInsurance: false, upgradeableProxy: false, adminKeyMultisig: false,
    oracleType: "内置 TWAP", tags: ["无漏洞赏金", "历史漏洞", "审计陈旧"],
  },
];

// ─── Grade config ─────────────────────────────────────────────────────────────
const GRADE_STYLE: Record<RiskGrade, { bg: string; text: string; border: string }> = {
  "A+": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "A":  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "B+": { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30" },
  "B":  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30" },
  "C":  { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30" },
  "D":  { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30" },
};

const SCORE_COLOR = (s: number) =>
  s <= 25 ? "bg-emerald-500" : s <= 45 ? "bg-sky-500" : s <= 65 ? "bg-amber-500" : "bg-red-500";

// ─── Chain badge ──────────────────────────────────────────────────────────────
const CHAIN_COLOR: Record<Chain, string> = {
  ETH: "bg-violet-500/15 text-violet-400", BSC: "bg-amber-500/15 text-amber-400",
  ARB: "bg-sky-500/15 text-sky-400", OP: "bg-red-400/15 text-red-400",
  AVAX: "bg-red-500/15 text-red-400", POLY: "bg-violet-400/15 text-violet-300",
};

// ─── Main client ──────────────────────────────────────────────────────────────
export function ProtocolRiskClient() {
  const [chainFilter, setChainFilter]     = useState<Chain | "ALL">("ALL");
  const [riskFilter,  setRiskFilter]      = useState<"ALL" | "LOW" | "MED" | "HIGH">("ALL");
  const [sortBy,      setSortBy]          = useState<"score" | "tvl" | "name">("score");
  const [selected,    setSelected]        = useState<Protocol | null>(null);
  const [tvlJitter,   setTvlJitter]       = useState<Record<string, number>>({});

  // Live TVL jitter
  useEffect(() => {
    const id = setInterval(() => {
      setTvlJitter(prev => {
        const next = { ...prev };
        const idx = Math.floor(Math.random() * PROTOCOLS.length);
        const p = PROTOCOLS[idx];
        next[p.id] = (Math.random() - 0.5) * 0.01 * p.tvlUsd;
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const chains: Chain[] = ["ETH","ARB","BSC","OP","AVAX","POLY"];

  const filtered = PROTOCOLS
    .filter(p => chainFilter === "ALL" || p.chains.includes(chainFilter))
    .filter(p => {
      if (riskFilter === "LOW")  return p.riskScore <= 30;
      if (riskFilter === "MED")  return p.riskScore > 30 && p.riskScore <= 60;
      if (riskFilter === "HIGH") return p.riskScore > 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "tvl")  return (b.tvlUsd + (tvlJitter[b.id] ?? 0)) - (a.tvlUsd + (tvlJitter[a.id] ?? 0));
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.riskScore - b.riskScore;
    });

  const stats = {
    total: PROTOCOLS.length,
    lowRisk:  PROTOCOLS.filter(p => p.riskScore <= 30).length,
    medRisk:  PROTOCOLS.filter(p => p.riskScore > 30 && p.riskScore <= 60).length,
    highRisk: PROTOCOLS.filter(p => p.riskScore > 60).length,
    totalTvl: PROTOCOLS.reduce((s, p) => s + p.tvlUsd, 0),
  };

  function tvlStr(v: number) {
    if (v >= 1e9) return `$${(v/1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v/1e6).toFixed(0)}M`;
    return `$${(v/1e3).toFixed(0)}K`;
  }

  return (
    <div>
      <PageHeader title="DeFi 协议风险矩阵" description="主流协议综合安全评级 · TVL 实时监控 · 历史漏洞记录" />

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "总 TVL",       val: tvlStr(stats.totalTvl),  icon: ShieldCheck, color: "text-foreground/80" },
          { label: "低风险协议",   val: `${stats.lowRisk} 个`,   icon: ShieldCheck, color: "text-emerald-400" },
          { label: "中等风险",     val: `${stats.medRisk} 个`,   icon: ShieldAlert, color: "text-amber-400" },
          { label: "高风险协议",   val: `${stats.highRisk} 个`,  icon: ShieldOff,   color: "text-red-400" },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Icon className="size-3.5" />{label}
            </div>
            <p className={cn("mt-1 text-xl font-bold", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground/50" />
        <div className="flex gap-1">
          {(["ALL", "ETH", "ARB", "BSC", "OP", "AVAX", "POLY"] as const).map(c => (
            <button key={c}
              onClick={() => setChainFilter(c as typeof chainFilter)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all",
                chainFilter === c
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border/40 text-muted-foreground/60 hover:border-border hover:text-foreground"
              )}
            >{c}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-2">
          {(["ALL", "LOW", "MED", "HIGH"] as const).map(r => (
            <button key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all",
                riskFilter === r
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border/40 text-muted-foreground/60 hover:border-border hover:text-foreground"
              )}
            >
              {r === "ALL" ? "全部" : r === "LOW" ? "低风险" : r === "MED" ? "中风险" : "高风险"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11.5px] text-muted-foreground/60">
          <span>排序：</span>
          {(["score", "tvl", "name"] as const).map(s => (
            <button key={s}
              onClick={() => setSortBy(s)}
              className={cn("rounded px-2 py-0.5 transition-all",
                sortBy === s ? "bg-secondary text-foreground" : "hover:text-foreground")}
            >
              {s === "score" ? "风险分" : s === "tvl" ? "TVL" : "名称"}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol grid */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => {
          const gs = GRADE_STYLE[p.grade];
          const currentTvl = p.tvlUsd + (tvlJitter[p.id] ?? 0);
          const isSelected = selected?.id === p.id;
          return (
            <button key={p.id}
              onClick={() => setSelected(isSelected ? null : p)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all hover:border-primary/30",
                isSelected ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-foreground/90">{p.name}</span>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", gs.bg, gs.text, gs.border)}>
                      {p.grade}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">{p.category}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[12px] text-foreground/80">{tvlStr(currentTvl)}</p>
                  <p className="text-[10px] text-muted-foreground/50">TVL</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10.5px] text-muted-foreground/60 mb-1">
                  <span>风险评分</span>
                  <span className="font-mono font-semibold text-foreground/70">{p.riskScore}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
                  <div className={cn("h-full rounded-full transition-all duration-500", SCORE_COLOR(p.riskScore))}
                    style={{ width: `${p.riskScore}%` }} />
                </div>
              </div>

              {/* Chain badges */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {p.chains.map(c => (
                  <span key={c} className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold", CHAIN_COLOR[c])}>{c}</span>
                ))}
              </div>

              {/* Quick stats */}
              <div className="mt-2.5 flex gap-3 text-[11px] text-muted-foreground/60">
                <span>审计 ×{p.auditCount}</span>
                <span>赏金 {p.bugBountyUsd >= 1_000_000 ? `$${p.bugBountyUsd/1_000_000}M` : `$${p.bugBountyUsd/1_000}K`}</span>
                {p.incidents.length > 0 && (
                  <span className="text-orange-400/80 font-medium flex items-center gap-0.5">
                    <TrendingDown className="size-3" /> {p.incidents.length} 次漏洞
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-card/65 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-bold text-foreground/90">{selected.name} — 详细分析</h3>
            <button onClick={() => setSelected(null)} className="text-[11px] text-muted-foreground/50 hover:text-foreground">关闭</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Security properties */}
            <div>
              <p className="mb-2 text-[11.5px] font-semibold text-foreground/60">安全属性</p>
              <div className="space-y-1.5">
                {[
                  { label: "可升级代理合约", val: selected.upgradeableProxy, bad: true },
                  { label: "管理员多签",     val: selected.adminKeyMultisig, bad: false },
                  { label: "保险覆盖",       val: selected.hasInsurance,    bad: false },
                  { label: "预言机类型",     val: selected.oracleType,      isStr: true },
                  { label: "距上次审计",     val: `${selected.lastAuditDays} 天`, isStr: true, warn: selected.lastAuditDays > 180 },
                  { label: "Bug Bounty",     val: `$${(selected.bugBountyUsd/1_000).toFixed(0)}K`, isStr: true },
                ].map(({ label, val, bad, isStr, warn }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground/60">{label}</span>
                    {isStr ? (
                      <span className={cn("font-mono text-[11px]", warn ? "text-amber-400" : "text-foreground/70")}>{val as string}</span>
                    ) : (
                      <span className={cn("flex items-center gap-1 text-[11px] font-semibold",
                        (val as boolean) !== bad ? "text-emerald-400" : "text-red-400")}>
                        {(val as boolean) ? <><ShieldCheck className="size-3" /> 是</> : <><ShieldOff className="size-3" /> 否</>}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Incidents */}
            <div>
              <p className="mb-2 text-[11.5px] font-semibold text-foreground/60">历史漏洞事件</p>
              {selected.incidents.length === 0 ? (
                <div className="flex items-center gap-2 text-[12px] text-emerald-400">
                  <ShieldCheck className="size-4" /> 暂无已记录漏洞事件
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.incidents.map((inc, i) => (
                    <div key={i} className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-orange-400">{inc.date}</span>
                        {inc.lossUsd > 0 && (
                          <span className="font-mono text-[11px] text-red-400">
                            损失 ${(inc.lossUsd/1_000_000).toFixed(2)}M
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11.5px] text-foreground/70">{inc.desc}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.tags.map(t => (
                  <span key={t} className="rounded-full border border-border/50 bg-secondary/40 px-2.5 py-0.5 text-[10.5px] text-muted-foreground/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
