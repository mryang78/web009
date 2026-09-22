"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 钱包风险画像 — 多维度评估：授权风险、交易行为、链上关联、资产暴露（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  Shield, AlertTriangle, Activity, Wallet, Search,
  CheckCircle2, XCircle, Clock, TrendingUp, Eye, Zap,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RiskDimension {
  key: string;
  label: string;
  score: number;      // 0-100, higher = worse
  weight: number;     // for overall calc
  issues: string[];
}

interface ApprovalItem {
  token: string;
  spender: string;
  amount: string;
  isUnlimited: boolean;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
  lastUsed: string;
}

interface TxPattern {
  label: string;
  count: number;
  pct: number;
  color: string;
}

interface WalletProfile {
  address: string;
  chain: string;
  overallScore: number;   // 0-100 composite
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
  dimensions: RiskDimension[];
  approvals: ApprovalItem[];
  txPatterns: TxPattern[];
  firstTx: string;
  totalTxCount: number;
  uniqueContractInteractions: number;
  nativeBalance: string;
  exposedValueUsd: number;
  darkwebHits: number;
}

// ─── Mock profiles ────────────────────────────────────────────────────────────
const PROFILES: Record<string, WalletProfile> = {
  "0x71D3...A82F": {
    address: "0x71D3A82F3e4c1b9D0f2A84C3e1f5D6b2E3A82F1E",
    chain: "ETH",
    overallScore: 72,
    riskLevel: "HIGH",
    dimensions: [
      { key: "approval", label: "授权风险",   score: 88, weight: 0.30, issues: ["3 个无限授权活跃", "授权方未经审计", "1 个授权已超 180 天未使用"] },
      { key: "behavior", label: "交易行为",   score: 55, weight: 0.25, issues: ["近 30 天高频小额转账 ×47", "凌晨 2-4 时交易集中"] },
      { key: "exposure", label: "资产暴露",   score: 82, weight: 0.25, issues: ["$12,480 授权暴露给未审计合约", "持有 3 个低流动性 Token"] },
      { key: "network",  label: "链上关联",   score: 44, weight: 0.20, issues: ["曾与 Tornado Cash relayer 交互 ×2"] },
    ],
    approvals: [
      { token: "USDC",  spender: "0xMalRouter...9f3C", amount: "MAX",       isUnlimited: true,  riskLevel: "CRITICAL", lastUsed: "7 天前" },
      { token: "WETH",  spender: "0xUniswapV3...4a2c", amount: "MAX",       isUnlimited: true,  riskLevel: "SAFE",     lastUsed: "2 天前" },
      { token: "DAI",   spender: "0xUnknown...cc71",   amount: "MAX",       isUnlimited: true,  riskLevel: "HIGH",     lastUsed: "200 天前" },
      { token: "LINK",  spender: "0xChainlink...8b3e",  amount: "500 LINK", isUnlimited: false, riskLevel: "SAFE",     lastUsed: "3 小时前" },
    ],
    txPatterns: [
      { label: "DeFi 交换",   count: 142, pct: 42, color: "bg-sky-500" },
      { label: "NFT 交易",    count: 68,  pct: 20, color: "bg-violet-500" },
      { label: "小额转账",    count: 47,  pct: 14, color: "bg-amber-500" },
      { label: "合约部署",    count: 12,  pct: 4,  color: "bg-emerald-500" },
      { label: "混币器交互",  count: 2,   pct: 1,  color: "bg-red-500" },
      { label: "其他",        count: 65,  pct: 19, color: "bg-muted" },
    ],
    firstTx: "2023-08-14",
    totalTxCount: 336,
    uniqueContractInteractions: 48,
    nativeBalance: "4.82 ETH",
    exposedValueUsd: 12_480,
    darkwebHits: 0,
  },
  "0xd91f...44a2": {
    address: "0xd91f44a2c8e3b0f1289047c3d5521a4e12b8c7d3",
    chain: "ETH",
    overallScore: 96,
    riskLevel: "CRITICAL",
    dimensions: [
      { key: "approval", label: "授权风险",   score: 95, weight: 0.30, issues: ["合约全部为自部署", "全部为攻击合约"] },
      { key: "behavior", label: "交易行为",   score: 98, weight: 0.25, issues: ["重入攻击模式已识别", "多次 out-of-gas revert"] },
      { key: "exposure", label: "资产暴露",   score: 90, weight: 0.25, issues: ["142 ETH 持仓（来源异常）", "持续向混币器转出"] },
      { key: "network",  label: "链上关联",   score: 99, weight: 0.20, issues: ["Tornado Cash 主力使用者", "关联 3 个已知攻击合约"] },
    ],
    approvals: [],
    txPatterns: [
      { label: "合约部署",   count: 28,  pct: 45, color: "bg-red-500" },
      { label: "攻击交易",   count: 18,  pct: 29, color: "bg-red-600" },
      { label: "混币器转账", count: 14,  pct: 23, color: "bg-orange-500" },
      { label: "其他",       count: 2,   pct: 3,  color: "bg-muted" },
    ],
    firstTx: "2024-11-03",
    totalTxCount: 487,
    uniqueContractInteractions: 61,
    nativeBalance: "142.3 ETH",
    exposedValueUsd: 0,
    darkwebHits: 2,
  },
};

const QUICK_LIST = Object.keys(PROFILES);

// ─── Radar chart (SVG polygon) ────────────────────────────────────────────────
function RadarChart({ dimensions }: { dimensions: RiskDimension[] }) {
  const cx = 100, cy = 100, r = 70;
  const n = dimensions.length;
  const angles = dimensions.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);

  function pt(score: number, i: number) {
    const a = angles[i];
    const d = (score / 100) * r;
    return [cx + d * Math.cos(a), cy + d * Math.sin(a)] as [number, number];
  }

  function ptGrid(s: number, i: number) { return pt(s, i); }

  const polygon = dimensions.map((d, i) => pt(d.score, i).join(",")).join(" ");
  const gridLevels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="size-48">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon key={level}
          points={dimensions.map((_, i) => ptGrid(level, i).join(",")).join(" ")}
          fill="none"
          stroke="oklch(0.5 0 0 / 0.15)"
          strokeWidth="0.5"
        />
      ))}
      {/* Spokes */}
      {dimensions.map((_, i) => {
        const [x, y] = pt(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(0.5 0 0 / 0.15)" strokeWidth="0.5" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="oklch(0.65 0.2 25 / 0.25)" stroke="oklch(0.65 0.2 25)" strokeWidth="1.5" />
      {/* Points */}
      {dimensions.map((d, i) => {
        const [x, y] = pt(d.score, i);
        return <circle key={i} cx={x} cy={y} r="3" fill="oklch(0.65 0.2 25)" />;
      })}
      {/* Labels */}
      {dimensions.map((d, i) => {
        const [x, y] = pt(115, i);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          className="text-[9px] fill-muted-foreground/70 font-medium" fontSize={9}>
          {d.label}
        </text>;
      })}
    </svg>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, level }: { score: number; level: WalletProfile["riskLevel"] }) {
  const r = 36, circ = 2 * Math.PI * r;
  const color = level === "CRITICAL" ? "stroke-red-500" : level === "HIGH" ? "stroke-amber-500" : level === "MEDIUM" ? "stroke-yellow-500" : "stroke-emerald-500";
  const textColor = level === "CRITICAL" ? "text-red-400" : level === "HIGH" ? "text-amber-400" : level === "MEDIUM" ? "text-yellow-400" : "text-emerald-400";
  return (
    <div className="relative flex size-24 items-center justify-center">
      <svg className="-rotate-90 size-24" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6" className="stroke-muted/30" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          className={cn("transition-all duration-700", color)}
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", textColor)}>{score}</span>
        <span className="text-[9px] text-muted-foreground/50">风险分</span>
      </div>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────
export function WalletRiskClient() {
  const [query,   setQuery]   = useState(QUICK_LIST[0]);
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [loading, setLoading] = useState(false);

  function lookup(addr: string) {
    setLoading(true);
    setProfile(null);
    setTimeout(() => {
      const found = PROFILES[addr] ?? Object.values(PROFILES).find(
        (p) => p.address.toLowerCase().includes(addr.toLowerCase())
      ) ?? null;
      setProfile(found);
      setLoading(false);
    }, 700);
  }

  useEffect(() => { lookup(QUICK_LIST[0]); }, []);

  const riskColor = (l: WalletProfile["riskLevel"]) =>
    l === "CRITICAL" ? "text-red-400" : l === "HIGH" ? "text-amber-400" : l === "MEDIUM" ? "text-yellow-400" : "text-emerald-400";

  const approvalRiskColor = (r: ApprovalItem["riskLevel"]) =>
    r === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/30"
    : r === "HIGH"   ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : r === "MEDIUM" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
    :                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "安全中心" }, { label: "钱包风险画像" }]} title="钱包风险画像" description="多维度链上风险评估 · 授权暴露 · 交易行为分析" />

      {/* Search */}
      <div className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup(query)}
            placeholder="输入钱包地址进行风险评估…"
            className="h-10 w-full rounded-xl border border-border bg-card/60 pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => lookup(query)}
          className="rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          评估
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="self-center text-[11px] text-muted-foreground/50">快捷选择：</span>
        {QUICK_LIST.map((a) => (
          <button key={a}
            onClick={() => { setQuery(a); lookup(a); }}
            className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {a}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-[12.5px]">正在分析链上风险维度…</p>
        </div>
      )}

      {!loading && !profile && (
        <div className="mt-10 text-center">
          <Wallet className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-[13px] text-muted-foreground">未找到该钱包的风险画像</p>
        </div>
      )}

      {!loading && profile && (
        <div className="mt-5 space-y-4">

          {/* Overview */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={profile.overallScore} level={profile.riskLevel} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-lg font-bold", riskColor(profile.riskLevel))}>
                    {profile.riskLevel === "CRITICAL" ? "极高风险" : profile.riskLevel === "HIGH" ? "高风险" : profile.riskLevel === "MEDIUM" ? "中等风险" : "低风险"}
                  </span>
                  <span className="rounded bg-secondary/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{profile.chain}</span>
                </div>
                <p className="mt-1 font-mono text-[12px] text-foreground/60 break-all">{profile.address}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                  {[
                    { icon: Clock,    label: "首笔交易",     val: profile.firstTx },
                    { icon: Activity, label: "总交易",       val: `${profile.totalTxCount} 笔` },
                    { icon: Eye,      label: "合约交互",     val: `${profile.uniqueContractInteractions} 个` },
                    { icon: Zap,      label: "资产暴露",     val: `$${profile.exposedValueUsd.toLocaleString()}` },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-1.5 text-muted-foreground/70">
                      <Icon className="size-3.5" />
                      <span>{label}</span>
                      <span className="font-semibold text-foreground/80">{val}</span>
                    </div>
                  ))}
                  {profile.darkwebHits > 0 && (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="size-3.5" />
                      <span>Darkweb 命中 ×{profile.darkwebHits}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Radar */}
              <div className="flex flex-col items-center">
                <RadarChart dimensions={profile.dimensions} />
                <p className="mt-1 text-[10px] text-muted-foreground/50">数值越高 = 风险越大</p>
              </div>
            </div>
          </div>

          {/* Risk dimensions */}
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.dimensions.map((d) => (
              <div key={d.key} className="rounded-2xl border border-border/70 bg-card/65 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-foreground/80">{d.label}</span>
                  <span className={cn(
                    "font-bold text-[13px]",
                    d.score >= 80 ? "text-red-400" : d.score >= 60 ? "text-amber-400" : d.score >= 40 ? "text-yellow-400" : "text-emerald-400"
                  )}>
                    {d.score}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      d.score >= 80 ? "bg-red-500" : d.score >= 60 ? "bg-amber-500" : d.score >= 40 ? "bg-yellow-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <ul className="mt-2 space-y-1">
                  {d.issues.map((issue) => (
                    <li key={issue} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-400/60" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Approvals */}
          {profile.approvals.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
              <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/80">
                活跃授权 ({profile.approvals.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-[12px]">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-[10.5px] text-muted-foreground/60">
                      <th className="pb-2 pr-4 font-medium">Token</th>
                      <th className="pb-2 pr-4 font-medium">授权给</th>
                      <th className="pb-2 pr-4 font-medium">额度</th>
                      <th className="pb-2 pr-4 font-medium">最后使用</th>
                      <th className="pb-2 font-medium">风险</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {profile.approvals.map((ap, i) => (
                      <tr key={i} className="hover:bg-secondary/20">
                        <td className="py-2 pr-4 font-semibold text-foreground/80">{ap.token}</td>
                        <td className="py-2 pr-4 font-mono text-[10.5px] text-muted-foreground/70">{ap.spender}</td>
                        <td className="py-2 pr-4">
                          {ap.isUnlimited
                            ? <span className="font-bold text-red-400">MAX ∞</span>
                            : <span className="text-foreground/70">{ap.amount}</span>
                          }
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground/60">{ap.lastUsed}</td>
                        <td className="py-2">
                          <span className={cn("flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold w-fit", approvalRiskColor(ap.riskLevel))}>
                            {ap.riskLevel === "SAFE"
                              ? <><CheckCircle2 className="size-3" /> 安全</>
                              : <><XCircle className="size-3" /> {ap.riskLevel}</>
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tx patterns */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
            <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/80">
              交易行为分布 (共 {profile.totalTxCount} 笔)
            </h3>
            <div className="space-y-2.5">
              {profile.txPatterns.map((p) => (
                <div key={p.label} className="flex items-center gap-3 text-[12px]">
                  <span className="w-24 shrink-0 text-foreground/70">{p.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted/30 h-2">
                    <div className={cn("h-full rounded-full transition-all duration-700", p.color)} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-[10.5px] text-muted-foreground/60">{p.count} ({p.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
