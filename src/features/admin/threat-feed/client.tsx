"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 实时威胁情报流 — SOC 操作中心风格全屏监控页（仅模拟数据）
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Zap, ShieldOff, Eye, GitBranch,
  Radio, Activity, Filter, Pause, Play, Trash2,
  ChevronDown, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type ThreatType =
  | "REENTRANCY"
  | "FLASH_LOAN"
  | "RUG_PULL"
  | "MEV_SANDWICH"
  | "APPROVAL_DRAIN"
  | "ORACLE_MANIP"
  | "BRIDGE_EXPLOIT"
  | "GOVERNANCE_ATTACK";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ThreatStatus = "ACTIVE" | "BLOCKED" | "INVESTIGATING" | "RESOLVED";

interface ThreatEvent {
  id: string;
  ts: number;
  type: ThreatType;
  severity: Severity;
  status: ThreatStatus;
  chain: string;
  attacker: string;
  target: string;
  lossUsd?: number;
  gasUsed?: number;
  blockNumber: number;
  txHash: string;
  description: string;
  iocs: string[];          // Indicators of Compromise
}

// ─── Seed events ─────────────────────────────────────────────────────────────
const SEED_EVENTS: ThreatEvent[] = [
  {
    id: "te-001", ts: Date.now() - 95_000,
    type: "REENTRANCY", severity: "CRITICAL", status: "BLOCKED",
    chain: "ETH", attacker: "0xd91f...44a2", target: "VictimPool v2",
    lossUsd: 4_500_000, gasUsed: 148_320, blockNumber: 19_847_310,
    txHash: "0xa4f2b8c1e9d3...0847",
    description: "3 层重入攻击，withdraw() 前 balances 未归零，攻击者连续提取 4.5 ETH × 3",
    iocs: ["Tornado Cash 关联地址", "合约部署 < 24h", "单笔 Gas > 100K"],
  },
  {
    id: "te-002", ts: Date.now() - 312_000,
    type: "FLASH_LOAN", severity: "CRITICAL", status: "ACTIVE",
    chain: "BSC", attacker: "0xbb91...c3f0", target: "PancakeSwap Oracle",
    lossUsd: 2_300_000, gasUsed: 420_810, blockNumber: 37_412_201,
    txHash: "0xf7d3c2a8b1e4...9921",
    description: "Aave 闪电贷 $23M → 操控 AMM 价格 +340% → 触发清算套利",
    iocs: ["闪电贷金额 > $10M", "价格偏差 > 100%", "同一区块多次 swap"],
  },
  {
    id: "te-003", ts: Date.now() - 780_000,
    type: "RUG_PULL", severity: "HIGH", status: "RESOLVED",
    chain: "BSC", attacker: "0x3fe1...8800", target: "MoonFarm Token",
    lossUsd: 890_000, gasUsed: 88_102, blockNumber: 37_411_990,
    txHash: "0xc3d9e1f4a2b8...4412",
    description: "LP 流动性在 8 秒内被 Owner 100% 撤出，$890K 受害者资产归零",
    iocs: ["Owner 权限未放弃", "LP 锁定期 < 30 天", "合约含 emergencyWithdraw()"],
  },
  {
    id: "te-004", ts: Date.now() - 1_440_000,
    type: "MEV_SANDWICH", severity: "MEDIUM", status: "RESOLVED",
    chain: "ETH", attacker: "0xMEV...bot1", target: "Uniswap v3 Swap",
    lossUsd: 12_400, gasUsed: 62_040, blockNumber: 19_847_098,
    txHash: "0xb2a1c4d8e9f0...3391",
    description: "MEV Bot 前插 buy → 受害者 swap（滑点 +3.2%）→ 后插 sell，净利润 $4,820",
    iocs: ["Flashbot bundle", "前后交易相同代币对", "Gas 溢价 > 2×"],
  },
  {
    id: "te-005", ts: Date.now() - 2_760_000,
    type: "APPROVAL_DRAIN", severity: "HIGH", status: "INVESTIGATING",
    chain: "ETH", attacker: "0xA1b2...9f3C", target: "用户钱包集群 (×23)",
    lossUsd: 340_000, gasUsed: 41_230, blockNumber: 19_846_772,
    txHash: "0x9e4f1a2b3c8d...1102",
    description: "伪装 Router 诱导 MAX_UINT256 授权，批量 transferFrom 转走 23 个钱包 USDC",
    iocs: ["MAX_UINT256 授权", "合约未验证", "钓鱼域名关联"],
  },
  {
    id: "te-006", ts: Date.now() - 5_040_000,
    type: "ORACLE_MANIP", severity: "HIGH", status: "RESOLVED",
    chain: "ARB", attacker: "0x77c4...ee21", target: "GMX Oracle",
    lossUsd: 560_000, gasUsed: 188_400, blockNumber: 194_803_001,
    txHash: "0x4f8e2b1a9d3c...8820",
    description: "操控 GMX 现货 Oracle 单边偏差 +18%，触发错误清算套利 $560K",
    iocs: ["Oracle 更新间隔异常", "大额未平仓合约", "跨链资金关联"],
  },
  {
    id: "te-007", ts: Date.now() - 8_100_000,
    type: "BRIDGE_EXPLOIT", severity: "CRITICAL", status: "RESOLVED",
    chain: "ETH→BSC", attacker: "0xBrid...g3H4", target: "CrossChain Bridge v1",
    lossUsd: 8_200_000, gasUsed: 302_100, blockNumber: 19_846_401,
    txHash: "0x1a3b5c7d9e2f...4499",
    description: "伪造跨链消息签名，重放 Bridge 锁定证明，双花提款 $8.2M",
    iocs: ["签名重放", "非常规 relayer 地址", "Bridge 合约暂停未触发"],
  },
];

// ─── Templates for live stream ───────────────────────────────────────────────
const LIVE_TEMPLATES: Omit<ThreatEvent, "id" | "ts" | "attacker" | "txHash" | "blockNumber">[] = [
  {
    type: "MEV_SANDWICH", severity: "MEDIUM", status: "ACTIVE",
    chain: "ETH", target: "Uniswap v3",
    lossUsd: Math.floor(Math.random() * 20_000 + 1_000), gasUsed: 58_000,
    description: "MEV Bot 三明治攻击，受害者 swap 滑点异常",
    iocs: ["Flashbot bundle", "Gas 溢价 > 2×"],
  },
  {
    type: "REENTRANCY", severity: "CRITICAL", status: "BLOCKED",
    chain: "ETH", target: "DeFi Lending Pool",
    lossUsd: Math.floor(Math.random() * 3_000_000 + 500_000), gasUsed: 132_000,
    description: "重入攻击已被 onlyOnce modifier 拦截，攻击者 tx revert",
    iocs: ["已知攻击模式", "合约调用深度异常"],
  },
  {
    type: "APPROVAL_DRAIN", severity: "HIGH", status: "INVESTIGATING",
    chain: "BSC", target: "钱包授权批量转移",
    lossUsd: Math.floor(Math.random() * 500_000 + 50_000), gasUsed: 44_000,
    description: "新钓鱼合约上线，诱导 MAX 授权，已转移多个受害者 BEP-20 Token",
    iocs: ["合约部署 < 1h", "MAX_UINT256 授权", "钓鱼域名"],
  },
  {
    type: "FLASH_LOAN", severity: "HIGH", status: "ACTIVE",
    chain: "ARB", target: "Arbitrum DEX",
    lossUsd: Math.floor(Math.random() * 1_000_000 + 200_000), gasUsed: 380_000,
    description: "闪电贷价格操控攻击，AMM 价格偏差 > 200%",
    iocs: ["闪电贷 > $5M", "单区块多 swap"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TYPE_META: Record<ThreatType, { label: string; icon: typeof AlertTriangle; color: string }> = {
  REENTRANCY:        { label: "重入攻击",     icon: GitBranch,  color: "text-red-400" },
  FLASH_LOAN:        { label: "闪电贷攻击",   icon: Zap,        color: "text-amber-400" },
  RUG_PULL:          { label: "Rug Pull",     icon: ShieldOff,  color: "text-orange-400" },
  MEV_SANDWICH:      { label: "MEV 三明治",   icon: Activity,   color: "text-yellow-400" },
  APPROVAL_DRAIN:    { label: "授权转移",     icon: Eye,        color: "text-violet-400" },
  ORACLE_MANIP:      { label: "Oracle 操控",  icon: AlertTriangle, color: "text-sky-400" },
  BRIDGE_EXPLOIT:    { label: "跨链攻击",     icon: AlertTriangle, color: "text-rose-400" },
  GOVERNANCE_ATTACK: { label: "治理攻击",     icon: ShieldOff,  color: "text-pink-400" },
};

const SEV_CONFIG: Record<Severity, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-500 animate-pulse" },
  HIGH:     { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-500 animate-pulse" },
  MEDIUM:   { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  LOW:      { bg: "bg-sky-500/15",    text: "text-sky-400",    dot: "bg-sky-400" },
};

const STATUS_CONFIG: Record<ThreatStatus, { label: string; color: string }> = {
  ACTIVE:        { label: "进行中",  color: "text-red-400 border-red-500/40 bg-red-500/10" },
  BLOCKED:       { label: "已拦截",  color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  INVESTIGATING: { label: "调查中",  color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  RESOLVED:      { label: "已解决",  color: "text-muted-foreground border-border bg-muted/20" },
};

function randHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
function randAddr() { return `0x${randHex(4)}...${randHex(4)}`; }

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtRelTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s 前`;
  if (s < 3600) return `${Math.floor(s / 60)}m 前`;
  return `${Math.floor(s / 3600)}h 前`;
}

// ─── Event row ───────────────────────────────────────────────────────────────
function EventRow({ ev, isNew }: { ev: ThreatEvent; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const tm = TYPE_META[ev.type];
  const Icon = tm.icon;
  const sev = SEV_CONFIG[ev.severity];
  const sta = STATUS_CONFIG[ev.status];

  return (
    <div className={cn(
      "border-b border-border/30 transition-all",
      isNew && "animate-[fadeSlideIn_0.4s_ease-out]",
      ev.status === "ACTIVE" && "bg-red-500/3"
    )}>
      <button
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary/20"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Severity dot */}
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", sev.dot)} />

        {/* Type icon + label */}
        <div className="flex w-32 shrink-0 items-center gap-1.5">
          <Icon className={cn("size-3.5 shrink-0", tm.color)} />
          <span className={cn("text-[11px] font-semibold", tm.color)}>{tm.label}</span>
        </div>

        {/* Chain badge */}
        <span className="hidden w-20 shrink-0 font-mono text-[10.5px] text-sky-400/70 sm:block">
          {ev.chain}
        </span>

        {/* Description */}
        <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/80">
          {ev.description}
        </span>

        {/* Loss */}
        {ev.lossUsd && (
          <span className="hidden w-28 shrink-0 text-right font-mono text-[11.5px] font-semibold text-red-400 sm:block">
            -${(ev.lossUsd / 1000).toFixed(0)}K
          </span>
        )}

        {/* Status */}
        <span className={cn("hidden rounded border px-1.5 py-px text-[10px] font-semibold sm:inline", sta.color)}>
          {sta.label}
        </span>

        {/* Time */}
        <span className="hidden w-16 shrink-0 text-right text-[10.5px] text-muted-foreground/50 sm:block">
          {fmtRelTime(ev.ts)}
        </span>

        {/* Expand */}
        <span className="ml-1 shrink-0 text-muted-foreground/40">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/20 bg-black/20 px-4 py-3">
          <div className="grid gap-3 text-[12px] sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">攻击者</div>
              <span className="font-mono text-sky-300/80">{ev.attacker}</span>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">目标</div>
              <span className="text-foreground/80">{ev.target}</span>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">交易哈希</div>
              <span className="font-mono text-[10.5px] text-foreground/60">{ev.txHash}</span>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">区块</div>
              <span className="font-mono text-foreground/70">#{ev.blockNumber.toLocaleString()}</span>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Gas Used</div>
              <span className="font-mono text-foreground/70">{ev.gasUsed?.toLocaleString()}</span>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">时间</div>
              <span className="text-foreground/70">{fmtTime(ev.ts)}</span>
            </div>
          </div>

          {/* IOCs */}
          <div className="mt-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">威胁指标 (IOC)</div>
            <div className="flex flex-wrap gap-1.5">
              {ev.iocs.map((ioc) => (
                <span key={ioc} className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-300/80">
                  {ioc}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ThreatFeedClient() {
  const [events, setEvents]     = useState<ThreatEvent[]>(SEED_EVENTS);
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const [paused, setPaused]     = useState(false);
  const [filterSev, setFilterSev] = useState<Severity | "ALL">("ALL");
  const [filterType, setFilterType] = useState<ThreatType | "ALL">("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Live stream: new event every 12s
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current) return;
      const tpl = LIVE_TEMPLATES[Math.floor(Math.random() * LIVE_TEMPLATES.length)];
      const id = `te-live-${Date.now()}`;
      const newEv: ThreatEvent = {
        ...tpl,
        id,
        ts: Date.now(),
        attacker: randAddr(),
        txHash: `0x${randHex(8)}...${randHex(4)}`,
        blockNumber: 19_847_310 + Math.floor(Math.random() * 100),
        lossUsd: tpl.lossUsd ?? Math.floor(Math.random() * 500_000),
      };
      setEvents((prev) => [newEv, ...prev].slice(0, 80));
      setNewIds((prev) => new Set([...prev, id]));
      setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 2000);
    }, 12_000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to top on new event
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length, autoScroll]);

  const displayed = events.filter((e) => {
    if (filterSev !== "ALL" && e.severity !== filterSev) return false;
    if (filterType !== "ALL" && e.type !== filterType) return false;
    return true;
  });

  const counts = {
    CRITICAL: events.filter((e) => e.severity === "CRITICAL").length,
    HIGH:     events.filter((e) => e.severity === "HIGH").length,
    ACTIVE:   events.filter((e) => e.status === "ACTIVE").length,
    total:    events.length,
  };

  return (
    <div>
      <PageHeader
        title="实时威胁情报流"
        description="全链攻击事件监控 · 实时推送 · 可展开查看 IOC 与交易详情"
      />

      {/* Live indicator + stats */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Radio className={cn("size-4", !paused ? "text-emerald-400" : "text-muted-foreground/40")} />
          <span className={cn("text-[11.5px] font-semibold", !paused ? "text-emerald-400" : "text-muted-foreground/50")}>
            {paused ? "已暂停" : "实时监控中"}
          </span>
        </div>
        {[
          { label: "CRITICAL", val: counts.CRITICAL, color: "text-red-400 bg-red-500/10" },
          { label: "HIGH",     val: counts.HIGH,     color: "text-amber-400 bg-amber-500/10" },
          { label: "进行中",   val: counts.ACTIVE,   color: "text-orange-400 bg-orange-500/10" },
          { label: "总事件",   val: counts.total,    color: "text-foreground/60 bg-muted/40" },
        ].map(({ label, val, color }) => (
          <span key={label} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", color)}>
            {label} <span className="ml-0.5 tabular-nums">{val}</span>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Severity filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSev(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-colors",
                filterSev === s
                  ? s === "ALL" ? "bg-primary/15 text-primary" : `${SEV_CONFIG[s as Severity].bg} ${SEV_CONFIG[s as Severity].text}`
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {s === "ALL" ? "全部" : s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ThreatType | "ALL")}
          className="h-8 rounded-lg border border-border/60 bg-card/60 px-2 text-[11px] text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="ALL">所有类型</option>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors",
              autoScroll ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowUpRight className="size-3" />
            {autoScroll ? "自动滚动" : "手动滚动"}
          </button>

          {/* Pause/Resume */}
          <button
            onClick={() => setPaused((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors",
              paused ? "border-sky-500/40 text-sky-400" : "border-amber-500/40 text-amber-400"
            )}
          >
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
            {paused ? "恢复" : "暂停"}
          </button>

          {/* Clear resolved */}
          <button
            onClick={() => setEvents((prev) => prev.filter((e) => e.status !== "RESOLVED"))}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trash2 className="size-3" />
            清除已解决
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="mt-3 hidden grid-cols-[8px_128px_80px_1fr_112px_80px_72px_24px] items-center gap-3 border-b border-border/50 px-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 sm:grid">
        <span />
        <span>类型</span>
        <span>链</span>
        <span>描述</span>
        <span className="text-right">损失</span>
        <span>状态</span>
        <span className="text-right">时间</span>
        <span />
      </div>

      {/* Event list */}
      <div
        ref={listRef}
        className="mt-1 max-h-[62vh] overflow-y-auto rounded-xl border border-border/60 bg-card/40"
      >
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            <Filter className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            当前筛选条件下暂无事件
          </div>
        ) : (
          displayed.map((ev) => (
            <EventRow key={ev.id} ev={ev} isNew={newIds.has(ev.id)} />
          ))
        )}
      </div>

      <p className="mt-2 text-right text-[10.5px] text-muted-foreground/40">
        显示 {displayed.length} / {events.length} 条事件 · 每 12 秒推送新告警
      </p>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); background: oklch(0.55 0.2 25 / 0.15); }
          to   { opacity: 1; transform: translateY(0);    background: transparent; }
        }
      `}</style>
    </div>
  );
}
