"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 链上治理攻击监控 — 提案风险评估 / 闪电贷投票检测 / 鲸鱼异常积累（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  Vote, AlertTriangle, ShieldAlert, Clock, TrendingUp,
  CheckCircle2, XCircle, Zap, Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProposalStatus = "ACTIVE" | "PASSED" | "FAILED" | "CANCELLED" | "QUEUED";
type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface RiskSignal {
  type: string;
  description: string;
  severity: RiskLevel;
}

interface VoteBreakdown {
  for: number;        // percentage
  against: number;
  abstain: number;
  quorumPct: number;  // current quorum % reached
  quorumRequired: number;
}

interface WhaleMove {
  address: string;
  tokens: string;
  action: "ACQUIRE" | "DELEGATE" | "VOTE_FOR" | "VOTE_AGAINST";
  blockDelta: number; // blocks before vote end
  suspicious: boolean;
}

interface Proposal {
  id: string;
  protocol: string;
  chain: string;
  title: string;
  proposer: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: ProposalStatus;
  votingEndsIn: string;
  blocksRemaining: number;
  votes: VoteBreakdown;
  riskSignals: RiskSignal[];
  whaleMoves: WhaleMove[];
  description: string;
  proposedAction: string;
}

// ─── Mock proposals ───────────────────────────────────────────────────────────
const PROPOSALS: Proposal[] = [
  {
    id: "COMP-174",
    protocol: "Compound",
    chain: "ETH",
    title: "将 USDC 借贷上限提升至 $800M 并调低清算奖励",
    proposer: "0xd91f...44a2",
    riskScore: 91,
    riskLevel: "CRITICAL",
    status: "ACTIVE",
    votingEndsIn: "4h 22m",
    blocksRemaining: 1_340,
    description: "本提案建议将 USDC 借贷上限从 $400M 提升至 $800M，同时将清算奖励从 8% 降至 3%，降低协议激励清算人及时清算的能力。",
    proposedAction: "setCollateralFactor(USDC, 0.92); setLiquidationIncentive(1.03);",
    votes: { for: 52, against: 31, abstain: 4, quorumPct: 87, quorumRequired: 4 },
    riskSignals: [
      { type: "闪电贷投票", description: "提案人在同一区块内借入 12M COMP 并投票", severity: "CRITICAL" },
      { type: "短窗口提案", description: "投票窗口仅 24h，远低于协议 3 天标准", severity: "HIGH" },
      { type: "鲸鱼异常积累", description: "投票前 6h 内 3 个地址累计获取 8.4M COMP 委托", severity: "HIGH" },
      { type: "参数设置激进", description: "清算奖励降至 3% 低于 Gas 成本，清算激励实质消失", severity: "MEDIUM" },
    ],
    whaleMoves: [
      { address: "0xd91f...44a2", tokens: "12.0M COMP", action: "ACQUIRE",      blockDelta: 1200, suspicious: true },
      { address: "0xA1b2...9f3C", tokens: "3.2M COMP",  action: "DELEGATE",     blockDelta: 800,  suspicious: true },
      { address: "0x8812...cc10", tokens: "2.1M COMP",  action: "ACQUIRE",      blockDelta: 450,  suspicious: true },
      { address: "0xDeF1...0021", tokens: "1.1M COMP",  action: "VOTE_FOR",     blockDelta: 200,  suspicious: false },
      { address: "0x4491...b77e", tokens: "980K COMP",  action: "VOTE_AGAINST", blockDelta: 180,  suspicious: false },
    ],
  },
  {
    id: "UNI-42",
    protocol: "Uniswap",
    chain: "ETH",
    title: "部署 Uniswap V3 至新链并修改费用接收地址",
    proposer: "0x7f3D...29ab",
    riskScore: 67,
    riskLevel: "HIGH",
    status: "ACTIVE",
    votingEndsIn: "2d 11h",
    blocksRemaining: 18_900,
    description: "授权在 X 链部署 Uniswap V3，并将协议费用接收地址修改为提案人控制的多签合约。",
    proposedAction: "deployToChain(chainId=9999); setFeeReceiver(0x7f3D...29ab);",
    votes: { for: 41, against: 48, abstain: 7, quorumPct: 62, quorumRequired: 4 },
    riskSignals: [
      { type: "费用地址更改", description: "新费用接收地址为提案人个人钱包而非 DAO Treasury", severity: "HIGH" },
      { type: "未知目标链",   description: "chainId=9999 为未知链，无公开文档", severity: "HIGH" },
      { type: "参数混淆",     description: "提案 calldata 与描述不完全一致，存在混淆", severity: "MEDIUM" },
    ],
    whaleMoves: [
      { address: "0x7f3D...29ab", tokens: "4.8M UNI", action: "VOTE_FOR",  blockDelta: 5000, suspicious: true },
      { address: "0xbEbc...8BE4", tokens: "6.1M UNI", action: "VOTE_AGAINST", blockDelta: 3200, suspicious: false },
    ],
  },
  {
    id: "AAVE-320",
    protocol: "Aave",
    chain: "ETH",
    title: "上架新资产 $MOON 并设置 75% 抵押率",
    proposer: "0xF1a3...8c20",
    riskScore: 44,
    riskLevel: "MEDIUM",
    status: "QUEUED",
    votingEndsIn: "执行队列中",
    blocksRemaining: 0,
    description: "上架 $MOON 代币作为抵押品，初始抵押率 75%，供应上限 $50M。",
    proposedAction: "addAsset(MOON, ltv=7500, liqThreshold=8000, supplyCap=50_000_000);",
    votes: { for: 78, against: 14, abstain: 8, quorumPct: 100, quorumRequired: 4 },
    riskSignals: [
      { type: "低流动性资产",   description: "$MOON 24h 交易量 $2.1M，易受价格操纵", severity: "MEDIUM" },
      { type: "抵押率偏高",    description: "75% LTV 对新资产偏激进，历史攻击案例中常见", severity: "MEDIUM" },
    ],
    whaleMoves: [
      { address: "0xF1a3...8c20", tokens: "2.2M AAVE", action: "VOTE_FOR",  blockDelta: 10000, suspicious: false },
    ],
  },
  {
    id: "MKR-118",
    protocol: "MakerDAO",
    chain: "ETH",
    title: "增加 ETH-A 债务上限 +$200M",
    proposer: "0x9e88...1234",
    riskScore: 15,
    riskLevel: "LOW",
    status: "PASSED",
    votingEndsIn: "已通过",
    blocksRemaining: 0,
    description: "常规参数调整，将 ETH-A 金库债务上限提升 $200M，应对市场需求增长。",
    proposedAction: "file(ETH-A, line, 1_500_000_000 * RAD);",
    votes: { for: 94, against: 3, abstain: 3, quorumPct: 100, quorumRequired: 4 },
    riskSignals: [],
    whaleMoves: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RISK_STYLE: Record<RiskLevel, { badge: string; dot: string; bar: string }> = {
  CRITICAL: { badge: "bg-red-500/10 text-red-400 border-red-500/30",       dot: "bg-red-500",     bar: "bg-red-500" },
  HIGH:     { badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-500",   bar: "bg-amber-500" },
  MEDIUM:   { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-500", bar: "bg-yellow-500" },
  LOW:      { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500", bar: "bg-emerald-500" },
};

const STATUS_STYLE: Record<ProposalStatus, string> = {
  ACTIVE:    "bg-sky-500/10 text-sky-400 border-sky-500/30",
  PASSED:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  FAILED:    "bg-red-500/10 text-red-400 border-red-500/30",
  CANCELLED: "bg-muted/30 text-muted-foreground border-border/40",
  QUEUED:    "bg-violet-500/10 text-violet-400 border-violet-500/30",
};
const STATUS_LABEL: Record<ProposalStatus, string> = {
  ACTIVE: "投票中", PASSED: "已通过", FAILED: "已否决", CANCELLED: "已撤销", QUEUED: "执行队列",
};

const WHALE_LABEL: Record<string, string> = {
  ACQUIRE: "购入委托", DELEGATE: "委托", VOTE_FOR: "投赞成票", VOTE_AGAINST: "投反对票",
};

// ─── Vote bar ─────────────────────────────────────────────────────────────────
function VoteBar({ votes }: { votes: Proposal["votes"] }) {
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/30">
        <div className="bg-emerald-500 transition-all" style={{ width: `${votes.for}%` }} />
        <div className="bg-red-500 transition-all"     style={{ width: `${votes.against}%` }} />
        <div className="bg-muted/50 transition-all"   style={{ width: `${votes.abstain}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-muted-foreground/60">
        <span className="text-emerald-400">赞成 {votes.for}%</span>
        <span className="text-red-400">反对 {votes.against}%</span>
        <span>弃权 {votes.abstain}%</span>
        <span>法定人数 {votes.quorumPct}%</span>
      </div>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────
export function GovernanceClient() {
  const [selected,    setSelected]    = useState<Proposal>(PROPOSALS[0]);
  const [filterRisk,  setFilterRisk]  = useState<"ALL" | RiskLevel>("ALL");
  const [quorumTick,  setQuorumTick]  = useState(0);

  // Simulate quorum slowly growing for ACTIVE proposals
  useEffect(() => {
    const id = setInterval(() => setQuorumTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const displayed = PROPOSALS.filter(p =>
    filterRisk === "ALL" || p.riskLevel === filterRisk
  );

  const activeCount   = PROPOSALS.filter(p => p.status === "ACTIVE").length;
  const criticalCount = PROPOSALS.filter(p => p.riskLevel === "CRITICAL").length;

  return (
    <div>
      <PageHeader title="治理攻击监控" description="链上提案风险评估 · 闪电贷投票检测 · 鲸鱼行为追踪" />

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "活跃提案",   val: activeCount,                      color: "text-sky-400" },
          { label: "极高风险",   val: criticalCount,                    color: "text-red-400" },
          { label: "检测到鲸鱼积累", val: PROPOSALS.filter(p => p.whaleMoves.some(w => w.suspicious)).length, color: "text-amber-400" },
          { label: "已通过提案", val: PROPOSALS.filter(p => p.status === "PASSED").length, color: "text-emerald-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-3.5">
            <p className="text-[11px] text-muted-foreground/60">{label}</p>
            <p className={cn("mt-1 text-2xl font-bold", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mt-4 flex gap-2">
        {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(r => (
          <button key={r}
            onClick={() => setFilterRisk(r)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-all",
              filterRisk === r
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground/60 hover:border-border hover:text-foreground"
            )}
          >
            {r === "ALL" ? "全部" : r}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Proposal list */}
        <div className="space-y-3">
          {displayed.map(p => {
            const rs = RISK_STYLE[p.riskLevel];
            const isSelected = selected.id === p.id;
            return (
              <button key={p.id}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/30",
                  isSelected ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn("mt-0.5 flex-none rounded border px-1.5 py-0.5 text-[10px] font-bold", rs.badge)}>
                    {p.riskLevel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] text-muted-foreground/50">{p.protocol} #{p.id}</span>
                      <span className={cn("rounded border px-1.5 py-0.5 text-[9.5px] font-semibold", STATUS_STYLE[p.status])}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] font-semibold text-foreground/85 leading-snug">{p.title}</p>
                  </div>
                </div>
                {p.status === "ACTIVE" && (
                  <div className="mt-3">
                    <VoteBar votes={p.votes} />
                  </div>
                )}
                {p.riskSignals.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.riskSignals.slice(0, 3).map(s => (
                      <span key={s.type} className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                        {s.type}
                      </span>
                    ))}
                    {p.riskSignals.length > 3 && (
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                        +{p.riskSignals.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="space-y-3">
          {/* Risk score */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground/50">{selected.protocol} · {selected.chain}</span>
                <p className="mt-0.5 text-[12.5px] font-bold text-foreground/85">{selected.id}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-3xl font-bold",
                  selected.riskScore >= 80 ? "text-red-400" : selected.riskScore >= 60 ? "text-amber-400" : selected.riskScore >= 40 ? "text-yellow-400" : "text-emerald-400"
                )}>{selected.riskScore}</p>
                <p className="text-[10px] text-muted-foreground/50">综合风险分</p>
              </div>
            </div>

            {selected.status === "ACTIVE" && (
              <div className="mt-3 flex items-center gap-2 text-[11.5px]">
                <Clock className="size-3.5 text-amber-400/70" />
                <span className="text-amber-400">投票结束：{selected.votingEndsIn}</span>
                <span className="text-muted-foreground/40">({selected.blocksRemaining.toLocaleString()} blocks)</span>
              </div>
            )}

            <div className="mt-3 rounded-xl bg-secondary/20 p-3 text-[11.5px] text-muted-foreground/70 leading-relaxed">
              {selected.description}
            </div>

            {/* Calldata */}
            <div className="mt-2 rounded-xl bg-secondary/40 px-3 py-2 font-mono text-[10px] text-foreground/60 overflow-x-auto">
              {selected.proposedAction}
            </div>
          </div>

          {/* Risk signals */}
          {selected.riskSignals.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
              <p className="mb-2 text-[12px] font-semibold text-foreground/80">风险信号 ({selected.riskSignals.length})</p>
              <div className="space-y-2">
                {selected.riskSignals.map((s, i) => {
                  const rs = RISK_STYLE[s.severity];
                  return (
                    <div key={i} className="flex items-start gap-2 rounded-xl border border-border/40 bg-secondary/20 p-2.5">
                      <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", rs.dot)} />
                      <div>
                        <p className="text-[11.5px] font-semibold text-foreground/80">{s.type}</p>
                        <p className="text-[11px] text-muted-foreground/60">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Whale moves */}
          {selected.whaleMoves.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
              <p className="mb-2 text-[12px] font-semibold text-foreground/80">鲸鱼行为追踪</p>
              <div className="space-y-1.5">
                {selected.whaleMoves.map((w, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px]",
                    w.suspicious ? "bg-red-500/5 border border-red-500/15" : "bg-secondary/20"
                  )}>
                    {w.suspicious && <AlertTriangle className="size-3 shrink-0 text-amber-400" />}
                    <span className="font-mono text-[10.5px] text-muted-foreground/60">{w.address}</span>
                    <span className="ml-auto text-foreground/70">{w.tokens}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold",
                      w.action === "VOTE_FOR" ? "bg-emerald-500/10 text-emerald-400"
                      : w.action === "VOTE_AGAINST" ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                    )}>
                      {WHALE_LABEL[w.action]}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      -{w.blockDelta} blk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
