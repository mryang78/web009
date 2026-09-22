"use client";

import { useEffect, useRef, useState } from "react";
import { Radar, Play, Square, ShieldCheck, Loader2, Vault, Search, Wallet, Coins, FlagTriangleRight } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { RiskBadge, SimulationOnlyTag } from "@/components/soc/badges";
import {
  autoScanWalletPool,
  getMockAddressProfile,
  type ScanWallet,
  type MockAddressProfile,
} from "@/lib/soc/mock";
import { getWalletState } from "@/lib/wallet-engine";
import { cn } from "@/lib/utils";

/** 钱包的风险评分/等级改由 Wallet Engine 的真实（当前）状态读取，不再使用 ScanWallet 自带的静态副本。 */
function liveRiskOf(walletId: string) {
  try {
    const w = getWalletState(walletId);
    return { score: w.riskScore, level: w.riskLevel };
  } catch {
    return { score: 0, level: "SAFE" as const };
  }
}

type ScanState = "idle" | "scanning" | "safe" | "responded";

interface ResponseLogEntry {
  id: string;
  time: string;
  walletId: string;
  walletName: string;
  address: string;
  riskScore: number;
  amount: number;
  vault: string;
}

const RISK_THRESHOLD = 70;
const SAFE_VAULT = "0xLabSafeVault...9E12";

function nowLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

export function AutoScanClient() {
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [states, setStates] = useState<Record<string, ScanState>>({});
  const [log, setLog] = useState<ResponseLogEntry[]>([]);
  const cursorRef = useRef(-1);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      cursorRef.current = (cursorRef.current + 1) % autoScanWalletPool.length;
      const idx = cursorRef.current;
      const wallet = autoScanWalletPool[idx];
      setCursor(idx);
      setStates((prev) => ({ ...prev, [wallet.id]: "scanning" }));

      window.setTimeout(() => {
        const liveScore = liveRiskOf(wallet.id).score;
        const risky = liveScore >= RISK_THRESHOLD;
        setStates((prev) => ({ ...prev, [wallet.id]: risky ? "responded" : "safe" }));
        if (risky) {
          const amount = Math.round(wallet.totalValue * 0.15 * 100) / 100;
          setLog((prev) => [
            {
              id: `${wallet.id}-${Date.now()}`,
              time: nowLabel(),
              walletId: wallet.id,
              walletName: wallet.name,
              address: wallet.address,
              riskScore: liveScore,
              amount,
              vault: SAFE_VAULT,
            },
            ...prev,
          ].slice(0, 30));
        }
      }, 450);
    }, 550);
    return () => clearInterval(timer);
  }, [running]);

  function toggle() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setCursor(-1);
    cursorRef.current = -1;
    setStates({});
    setLog([]);
  }

  const respondedCount = Object.values(states).filter((s) => s === "responded").length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "全链路安全运营平台", href: "/soc" }, { label: "自动扫描与响应" }]}
        title="全局资产扫描与自动响应"
        description={`持续扫描平台内置的 ${autoScanWalletPool.length} 个 Mock 隔离钱包，风险评分超过阈值时自动触发保护性响应分析（非真实资产、非真实钱包）`}
        actions={<SimulationOnlyTag />}
      />

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[12.5px] text-amber-700 dark:text-amber-300">
        本模块及下方「任意地址查询」功能仅使用本地生成的分析数据：钱包池由确定性伪随机函数生成，地址查询结果由输入文本的哈希值推导，均不读取、不连接任何真实钱包、真实链上数据或第三方 API；触发的「自动响应」为风险分析动作，不产生任何真实资产变动。
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/65 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radar className={cn("size-4 text-sky-400", running && "animate-pulse")} />
              <h3 className="text-[13.5px] font-semibold text-foreground">隔离钱包扫描队列（{autoScanWalletPool.length}）</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggle}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors",
                  running ? "bg-accent/60 text-foreground hover:bg-white/15" : "bg-primary text-primary-foreground"
                )}
              >
                {running ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
                {running ? "停止扫描" : "开始自动扫描"}
              </button>
              <button
                onClick={reset}
                className="rounded-xl border border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                重置
              </button>
            </div>
          </div>

          <div className="mt-4 grid max-h-[560px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {autoScanWalletPool.map((w, i) => (
              <WalletScanCard key={w.id} wallet={w} state={states[w.id] ?? "idle"} active={i === cursor && running} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <h3 className="text-[13.5px] font-semibold text-foreground">自动响应记录</h3>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            风险评分 ≥ {RISK_THRESHOLD} 时自动触发（当前已触发 {respondedCount} 次）
          </p>

          <div className="mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
            {log.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                暂无响应记录，点击「开始自动扫描」查看效果
              </div>
            )}
            {log.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">{entry.time}</span>
                  <span className="font-semibold text-emerald-400">风险评分 {entry.riskScore}</span>
                </div>
                <div className="mt-1.5 text-[13px] font-medium text-foreground">{entry.walletName}</div>
                <div className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">{entry.address}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-emerald-400">
                  <Vault className="size-3.5" />
                  已分析转移 ${entry.amount.toLocaleString()} 至安全金库 {entry.vault}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/70">分析动作，未产生真实资产变动</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <AddressLookupPanel />
      </div>
    </div>
  );
}

function WalletScanCard({ wallet, state, active }: { wallet: ScanWallet; state: ScanState; active: boolean }) {
  const live = liveRiskOf(wallet.id);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        active ? "border-sky-500/40 bg-sky-500/[0.06]" : "border-border/70 bg-card/45"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          state === "responded" ? "bg-red-500/15 text-red-400" : state === "safe" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/70 text-muted-foreground"
        )}
      >
        {state === "scanning" ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{wallet.name}</span>
          <RiskBadge level={live.level} className="scale-90" />
        </div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          {wallet.address} · {wallet.network}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-[12.5px] tabular-nums text-foreground">{live.score}</div>
        <div className="text-[10px] text-muted-foreground">风险分</div>
      </div>
    </div>
  );
}

function AddressLookupPanel() {
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<MockAddressProfile | null>(null);

  function lookup() {
    if (!input.trim()) return;
    setProfile(getMockAddressProfile(input));
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-5">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-violet-400" />
        <h3 className="text-[13.5px] font-semibold text-foreground">任意地址风险画像查询（分析）</h3>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        输入任意文本（不必是真实地址），生成一份基于哈希函数的虚构风险画像 —— 相同输入始终得到相同结果，但不代表任何真实链上状态。
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="例如 0x71D3...A82F，或任意文本"
          className="h-10 flex-1 rounded-xl border border-border/70 bg-card/65 px-3.5 font-mono text-[13px] text-foreground placeholder:font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
        <button
          onClick={lookup}
          disabled={!input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Search className="size-3.5" />
          生成分析风险画像
        </button>
      </div>

      {profile && (
        <div className="mt-5 rounded-xl border border-border/70 bg-secondary/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="font-mono text-[13px] text-foreground">{profile.address}</span>
            </div>
            <RiskBadge level={profile.riskLevel} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="风险评分" value={String(profile.riskScore)} />
            <Stat label="分析余额" value={`$${profile.mockBalance.toLocaleString()}`} icon={Coins} />
            <Stat label="分析代币数" value={String(profile.mockTokenCount)} />
            <Stat label="所在网络" value={profile.network} />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
              <FlagTriangleRight className="size-3.5" />
              风险特征（实时分析）
            </div>
            <ul className="space-y-1">
              {profile.flags.map((f, i) => (
                <li key={i} className="text-[12.5px] text-foreground/85">
                  · {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[11.5px] text-amber-700 dark:text-amber-300">
            以上结果由输入文本的哈希值本地生成，仅作产品体验与安全教育用途，并未查询任何真实钱包、链上数据或第三方服务。
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: StatIcon }: { label: string; value: string; icon?: typeof Coins }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/45 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
        {StatIcon && <StatIcon className="size-3" />}
        {label}
      </div>
      <div className="mt-1 font-mono text-[13.5px] tabular-nums text-foreground">{value}</div>
    </div>
  );
}
