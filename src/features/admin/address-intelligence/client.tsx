"use client";

import { useState, useEffect } from "react";
import { Search, AlertTriangle, Shield, Eye, ExternalLink, Clock, Skull, Globe, Database, Copy, CheckCheck } from "lucide-react";
import { AttackerClusterPanel } from "@/components/security/intelligence/attacker-cluster-panel";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
type AddressTag  = string;

interface AttackRecord {
  id: string;
  date: string;
  type: string;
  target: string;
  lossUsd: number;
  chain: string;
}

interface DarkwebRecord {
  platform: string;
  date: string;
  snippet: string;
}

interface IntelProfile {
  address: string;
  chain: string;
  riskScore: number;       // 0-100
  riskLevel: RiskLevel;
  tags: AddressTag[];
  firstSeen: string;
  lastActivity: string;
  totalTxCount: number;
  nativeBalance: string;
  associatedAttacks: AttackRecord[];
  darkwebMentions: DarkwebRecord[];
  relatedAddresses: string[];
  verdict: string;
}

// ─── Mock database ──────────────────────────────────────────────────────────
const INTEL_DB: Record<string, IntelProfile> = {
  "0xd91f...44a2": {
    address: "0xd91f44a2c8e3b0f1289047c3d5521a4e12b8c7d3",
    chain: "ETH",
    riskScore: 96,
    riskLevel: "CRITICAL",
    tags: ["Reentrancy Attacker", "Flash Loan Exploiter", "Tornado Cash User", "Known Hacker"],
    firstSeen: "2024-11-03",
    lastActivity: "2026-09-21 08:42 UTC",
    totalTxCount: 487,
    nativeBalance: "142.3 ETH",
    associatedAttacks: [
      { id: "atk-001", date: "2026-09-21", type: "Reentrancy Attack", target: "VictimPool v2", lossUsd: 4_500_000, chain: "ETH" },
      { id: "atk-002", date: "2026-07-14", type: "Flash Loan + Price Manipulation", target: "DEX Oracle", lossUsd: 2_100_000, chain: "ETH" },
      { id: "atk-003", date: "2026-03-28", type: "Reentrancy Attack", target: "LiquidityVault", lossUsd: 980_000, chain: "BSC" },
    ],
    darkwebMentions: [
      { platform: "Telegram Channel @defi_exploits", date: "2026-09-18", snippet: "new drain script targeting VictimPool, address: 0xd91f..." },
      { platform: "Forum post (onion)", date: "2026-08-02", snippet: "sold reentrancy PoC, contact 0xd91f for bulk discount" },
    ],
    relatedAddresses: ["0xa4f2...b8c1", "0x3e7d...99ff", "0xf0c8...2231"],
    verdict: "高度活跃的链上攻击者，持续从事重入攻击与闪电贷价格操控，已向 Tornado Cash 洗钱超过 $7.5M。建议立即封锁所有交互请求。",
  },
  "0xA1b2...9f3C": {
    address: "0xA1b29f3Cc4d821e0bf412e3f74c9d821e0bf412e",
    chain: "BSC",
    riskScore: 74,
    riskLevel: "HIGH",
    tags: ["Infinite Approval", "Suspicious Contract", "MEV Bot"],
    firstSeen: "2025-06-12",
    lastActivity: "2026-09-20 22:17 UTC",
    totalTxCount: 1_203,
    nativeBalance: "8.1 BNB",
    associatedAttacks: [
      { id: "atk-004", date: "2026-09-20", type: "Unlimited Approval Drain", target: "User Wallet Cluster", lossUsd: 340_000, chain: "BSC" },
    ],
    darkwebMentions: [
      { platform: "Telegram @bsc_alpha_calls", date: "2026-09-15", snippet: "new router trick, approve 0xA1b2 for free token airdrop" },
    ],
    relatedAddresses: ["0xcc83...1a00", "0x9d44...bc22"],
    verdict: "通过伪装成 DeFi Router 诱导用户授权 MAX_UINT256，随后批量转移受害者 Token。已关联至多起钓鱼活动。",
  },
};

// ─── Default / demo address list ────────────────────────────────────────────
const QUICK_ADDRESSES = Object.keys(INTEL_DB);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",    label: "极高风险" },
  HIGH:     { color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30", label: "高风险" },
  MEDIUM:   { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "中等风险" },
  LOW:      { color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/30",    label: "低风险" },
  SAFE:     { color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/30", label: "安全" },
};

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const cfg = RISK_CONFIG[level];
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg className="-rotate-90 size-20">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5" className="stroke-muted/30" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5"
          className={cn("transition-all duration-700", level === "CRITICAL" ? "stroke-red-500" : level === "HIGH" ? "stroke-amber-500" : "stroke-sky-500")}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-xl font-bold", cfg.color)}>{score}</span>
        <span className="text-[9px] text-muted-foreground/60">/ 100</span>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
    >
      {copied ? <CheckCheck className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
    </button>
  );
}

// ─── Main client ─────────────────────────────────────────────────────────────
export function AddressIntelligenceClient() {
  const [query,     setQuery]   = useState("");
  const [profile,  setProfile]  = useState<IntelProfile | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);

  function lookup(addr: string) {
    const key = addr.trim();
    if (!key) return;
    setLoading(true);
    setNotFound(false);
    setProfile(null);
    setTimeout(() => {
      const found = INTEL_DB[key] ?? Object.values(INTEL_DB).find(
        (p) => p.address.toLowerCase().includes(key.toLowerCase())
      ) ?? null;
      if (!found) setNotFound(true);
      else setProfile(found);
      setLoading(false);
    }, 800);
  }

  function handleSearch() { lookup(query); }

  // Auto-load first profile on mount
  useEffect(() => {
    lookup(QUICK_ADDRESSES[0]);
    setQuery(QUICK_ADDRESSES[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = profile ? RISK_CONFIG[profile.riskLevel] : null;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "安全中心" }, { label: "地址情报" }]}
        title="地址情报分析"
        description="输入链上地址，获取威胁标签、风险评分、攻击历史与 Darkweb 记录"
      />

      {/* Search bar */}
      <div className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="输入 0x 地址或标签名（如 Tornado Cash）…"
            className="h-10 w-full rounded-xl border border-border bg-card/60 pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          分析
        </button>
      </div>

      {/* Quick select */}
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="text-[11px] text-muted-foreground/50 self-center">示例地址：</span>
        {QUICK_ADDRESSES.map((a) => (
          <button
            key={a}
            onClick={() => { setQuery(a); lookup(a); }}
            className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {a}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-[12.5px]">正在查询链上情报数据库…</p>
        </div>
      )}

      {/* Not found */}
      {!loading && notFound && (
        <div className="mt-10 text-center">
          <Shield className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-[13px] text-muted-foreground">该地址暂无情报记录，或未纳入监控名单</p>
        </div>
      )}

      {/* Profile */}
      {!loading && profile && cfg && (
        <div className="mt-5 space-y-4">

          {/* Overview card */}
          <div className={cn("rounded-2xl border p-5", cfg.bg)}>
            <div className="flex flex-wrap items-start gap-5">
              <ScoreRing score={profile.riskScore} level={profile.riskLevel} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold", cfg.bg, cfg.color)}>
                    {cfg.label} · {profile.riskLevel}
                  </span>
                  <span className="rounded bg-secondary/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{profile.chain}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-[12.5px] text-foreground/80 break-all">{profile.address}</span>
                  <CopyBtn text={profile.address} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <span key={tag} className={cn("rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold", cfg.bg, cfg.color)}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-foreground/70">{profile.verdict}</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
                {[
                  { icon: Clock, label: "首次发现", value: profile.firstSeen },
                  { icon: Eye,   label: "最近活动", value: profile.lastActivity },
                  { icon: Database, label: "交易总数", value: profile.totalTxCount.toLocaleString() },
                  { icon: Globe, label: "原生余额", value: profile.nativeBalance },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-border/40 bg-card/60 p-2.5">
                    <Icon className="mb-1 size-3.5 text-muted-foreground/50" />
                    <div className="text-[10px] text-muted-foreground/60">{label}</div>
                    <div className="mt-0.5 font-semibold text-foreground/85">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attack History */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Skull className="size-4 text-red-400/70" />
              <h3 className="text-[12.5px] font-semibold text-foreground/80">关联攻击事件 ({profile.associatedAttacks.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-[12px]">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[10.5px] text-muted-foreground/60">
                    <th className="pb-2 pr-4 font-medium">日期</th>
                    <th className="pb-2 pr-4 font-medium">攻击类型</th>
                    <th className="pb-2 pr-4 font-medium">目标</th>
                    <th className="pb-2 pr-4 font-medium">链</th>
                    <th className="pb-2 font-medium text-right">损失</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {profile.associatedAttacks.map((atk) => (
                    <tr key={atk.id} className="hover:bg-secondary/20">
                      <td className="py-2 pr-4 font-mono text-muted-foreground/70">{atk.date}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-medium text-red-400">
                          {atk.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-foreground/80">{atk.target}</td>
                      <td className="py-2 pr-4 font-mono text-sky-400/80">{atk.chain}</td>
                      <td className="py-2 text-right font-semibold text-red-400">
                        -${atk.lossUsd.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Darkweb mentions */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400/70" />
              <h3 className="text-[12.5px] font-semibold text-foreground/80">Darkweb 提及记录 ({profile.darkwebMentions.length})</h3>
            </div>
            <div className="space-y-2.5">
              {profile.darkwebMentions.map((m, i) => (
                <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Globe className="size-3 text-amber-400/60" />
                    <span className="font-semibold text-amber-400/80">{m.platform}</span>
                    <span className="ml-auto text-muted-foreground/50">{m.date}</span>
                  </div>
                  <p className="mt-1.5 font-mono text-[10.5px] italic text-muted-foreground/70">"{m.snippet}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* 攻击者聚类图谱 */}
          <div className="mt-5">
            <AttackerClusterPanel />
          </div>

          {/* Related addresses */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ExternalLink className="size-4 text-sky-400/70" />
              <h3 className="text-[12.5px] font-semibold text-foreground/80">关联地址网络 ({profile.relatedAddresses.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.relatedAddresses.map((addr) => (
                <button
                  key={addr}
                  onClick={() => { setQuery(addr); lookup(addr); }}
                  className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/30 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {addr}
                  <ExternalLink className="size-2.5" />
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
