"use client";
// ── 首页 USDT 高端资产发送区块 ─────────────────────────────────────────────────
import { useState, useRef } from "react";
import {
  Send, ChevronDown, CheckCircle2, Loader2,
  Zap, Shield, Clock, TrendingUp, ScanLine,
  ArrowRight, Copy, ExternalLink, Wifi, RefreshCw,
  Info, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── 链配置 ────────────────────────────────────────────────────────────────────
const CHAINS = [
  { id: "eth",  name: "Ethereum",  short: "ETH", dot: "bg-violet-500", fee: "~$1.20–2.40" },
  { id: "bsc",  name: "BNB Chain", short: "BSC", dot: "bg-yellow-500", fee: "~$0.05–0.15" },
  { id: "tron", name: "TRON",      short: "TRX", dot: "bg-red-500",    fee: "~$0.00–0.80" },
  { id: "arb",  name: "Arbitrum",  short: "ARB", dot: "bg-cyan-500",   fee: "~$0.10–0.50" },
];

// ── 代币配置 ─────────────────────────────────────────────────────────────────
const TOKENS = [
  { symbol: "USDT", name: "Tether USD",  color: "bg-emerald-500", logo: "₮", rate: 1,    bal: "128,402.50" },
  { symbol: "USDC", name: "USD Coin",    color: "bg-blue-500",    logo: "Ⓤ", rate: 1,    bal: "43,819.20"  },
  { symbol: "ETH",  name: "Ethereum",    color: "bg-violet-500",  logo: "Ξ", rate: 3124, bal: "24.8821"    },
  { symbol: "BNB",  name: "BNB",         color: "bg-yellow-500",  logo: "B", rate: 598,  bal: "312.44"     },
];

// ── 近期交易记录 ──────────────────────────────────────────────────────────────
const TX_FEED = [
  { to: "0x71D4…A82F", amt: "5,000",  tok: "USDT", chain: "ETH", t: "刚刚",   isNew: true  },
  { to: "TRX9k…8cW2",  amt: "12,500", tok: "USDT", chain: "TRX", t: "2 分钟前", isNew: false },
  { to: "0xB3a1…F90C", amt: "1.42",   tok: "ETH",  chain: "ARB", t: "5 分钟前", isNew: false },
  { to: "0x44Dc…2E71", amt: "8,800",  tok: "USDC", chain: "BSC", t: "11 分钟前", isNew: false },
];

// ── 指标卡 ────────────────────────────────────────────────────────────────────
const STAT_DEFS = [
  { icon: TrendingUp, label: "今日交易量",   value: "$4.7M",  gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",   pulse: true },
  { icon: Zap,        label: "平均到账",     value: "< 3 秒",  gradient: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { icon: Shield,     label: "安全验证率",   value: "100%",    gradient: "bg-gradient-to-br from-violet-500 to-purple-600" },
  { icon: Clock,      label: "系统可用率",   value: "99.99%",  gradient: "bg-gradient-to-br from-amber-500 to-orange-600" },
];

function StatCard({ icon: Icon, label, value, gradient, pulse }: {
  icon: React.ElementType; label: string; value: string; gradient: string; pulse?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <div className={cn("pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-2xl opacity-15", gradient)} />
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-xl text-white shadow-sm", gradient)}>
        <Icon className="size-4" />
      </div>
      <div className="flex items-end gap-1">
        <span className="text-[22px] font-bold leading-none text-foreground">{value}</span>
        {pulse && (
          <span className="relative mb-0.5 flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">实时更新</div>
    </div>
  );
}

// ── 地址验证状态 ──────────────────────────────────────────────────────────────
type AddrState = "empty" | "validating" | "valid" | "invalid";
type Step      = "idle" | "confirm" | "sending" | "done";

export function HomeUsdtSection() {
  const [token, setToken]         = useState(TOKENS[0]);
  const [chain, setChain]         = useState(CHAINS[0]);
  const [showDrop, setDrop]       = useState(false);
  const [toAddr, setAddr]         = useState("");
  const [addrState, setAddrState] = useState<AddrState>("empty");
  const [amount, setAmount]       = useState("");
  const [step, setStep]           = useState<Step>("idle");
  const [copied, setCopied]       = useState(false);
  const addrTimer                 = useRef<ReturnType<typeof setTimeout>>();

  // 地址格式校验（客户端）
  function handleAddrChange(v: string) {
    setAddr(v);
    if (!v) { setAddrState("empty"); return; }
    setAddrState("validating");
    clearTimeout(addrTimer.current);
    addrTimer.current = setTimeout(() => {
      const ok = /^0x[0-9a-fA-F]{40}$/.test(v) || /^T[A-Za-z0-9]{33}$/.test(v) || v.length > 30;
      setAddrState(ok ? "valid" : "invalid");
    }, 600);
  }

  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const isValid   = addrState === "valid" && amountNum > 0;
  const usdVal    = (amountNum * token.rate).toLocaleString("en", { maximumFractionDigits: 2 });

  // 随机但格式正确的 tx hash（仅在 done 阶段生成一次）
  const [txHash] = useState(() =>
    "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
  );
  const shortHash = txHash.slice(0, 10) + "…" + txHash.slice(-6);

  function send() { setStep("confirm"); }
  function confirm() {
    setStep("sending");
    setTimeout(() => setStep("done"), 2800);
  }
  function reset() { setStep("idle"); setAddr(""); setAmount(""); setAddrState("empty"); }
  function copyHash() {
    navigator.clipboard.writeText(txHash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const SENDING_STEPS = ["构建交易数据", "多重签名授权", "广播至节点网络", "等待链上确认"];

  return (
    <section className="relative overflow-hidden py-24">
      {/* ── 背景渐变 ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-radial from-primary/12 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/4 rounded-full bg-gradient-radial from-cyan-500/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-emerald-500/6 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.025)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11.5px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            实时资产转账
          </span>
          <h2 className="mt-5 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-[2.5rem] font-bold tracking-tight text-transparent leading-tight sm:text-5xl">
            即时发送加密资产
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            支持 USDT · USDC · ETH · BNB，多链跨网，秒级到账
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10 xl:gap-14">
          {/* ────────────────── LEFT ────────────────── */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              {STAT_DEFS.map(s => (
                <StatCard key={s.label} icon={s.icon} label={s.label} gradient={s.gradient} pulse={s.pulse} />
              ))}
            </div>

            {/* Tx feed — empty state */}
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/4 to-transparent px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[12.5px] font-bold text-foreground">实时交易流</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  LIVE
                </span>
              </div>
              <div className="divide-y divide-border/50">
                {TX_FEED.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <ArrowUpRight className="size-3.5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-semibold text-foreground">{tx.amt} {tx.tok}</span>
                        {tx.isNew && (
                          <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] font-bold text-primary">NEW</span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground font-mono">{tx.to}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10.5px] font-bold text-muted-foreground">{tx.chain}</div>
                      <div className="text-[10px] text-muted-foreground/60">{tx.t}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 px-4 py-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>今日已处理 <span className="font-bold text-foreground">3,847</span> 笔</span>
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    查看全部 <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Network status */}
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
              <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Wifi className="size-3" /> 网络状态
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHAINS.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2">
                    <span className={cn("size-2 shrink-0 rounded-full", c.dot)} />
                    <span className="text-[11.5px] font-medium text-foreground">{c.short}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">在线</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ────────────────── RIGHT: Send Form ────────────────── */}
          <div className="lg:col-span-3">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-cyan-500/5 to-emerald-500/8 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl shadow-primary/8">
                {/* Top gradient bar */}
                <div className="h-0.5 w-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-500" />

                {/* Card header */}
                <div className="border-b border-border/60 bg-gradient-to-r from-primary/6 via-cyan-500/3 to-transparent px-6 py-5">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/25">
                      <Send className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-foreground">发送资产</p>
                      <p className="text-[11.5px] text-muted-foreground">多链支持 · 低手续费 · 实时到账</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                      </span>
                      系统正常
                    </div>
                  </div>

                  {/* Chain selector */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {CHAINS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setChain(c)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all",
                          chain.id === c.id
                            ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 text-muted-foreground hover:border-border hover:bg-secondary/60"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", c.dot)} />
                        {c.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form body */}
                <div className="space-y-5 p-6">
                  {step === "idle" && (
                    <>
                      {/* Token picker */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-muted-foreground">选择代币</label>
                        <div className="relative">
                          <button
                            onClick={() => setDrop(v => !v)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-secondary/30 px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-secondary/50"
                          >
                            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white shadow-md", token.color)}>
                              {token.logo}
                            </span>
                            <div className="flex-1">
                              <div className="text-[14.5px] font-bold text-foreground">{token.symbol}</div>
                              <div className="text-[11px] text-muted-foreground">{token.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[13px] font-medium tabular-nums text-foreground">{token.bal}</div>
                              <div className="text-[10px] text-muted-foreground">可用余额</div>
                            </div>
                            <ChevronDown className={cn("size-4 text-muted-foreground/60 transition-transform", showDrop && "rotate-180")} />
                          </button>

                          {showDrop && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setDrop(false)} />
                              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
                                {TOKENS.map(t => (
                                  <button
                                    key={t.symbol}
                                    onClick={() => { setToken(t); setDrop(false); }}
                                    className={cn(
                                      "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/60",
                                      token.symbol === t.symbol && "bg-primary/5"
                                    )}
                                  >
                                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow", t.color)}>
                                      {t.logo}
                                    </span>
                                    <div className="flex-1">
                                      <div className="text-[13.5px] font-bold text-foreground">{t.symbol}</div>
                                      <div className="text-[11px] text-muted-foreground">{t.name}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[12px] font-semibold text-foreground tabular-nums">{t.bal}</div>
                                      <div className="text-[10px] text-muted-foreground">余额</div>
                                    </div>
                                    {token.symbol === t.symbol && <CheckCircle2 className="size-3.5 text-primary" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Address input */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-muted-foreground">接收地址</label>
                        <div className="relative">
                          <input
                            value={toAddr}
                            onChange={e => handleAddrChange(e.target.value)}
                            placeholder="0x... 粘贴或输入链上地址"
                            className={cn(
                              "w-full rounded-2xl border bg-secondary/30 px-4 py-3.5 pr-12 text-[13.5px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all",
                              addrState === "valid"      && "border-emerald-500/60 bg-emerald-500/5 focus:border-emerald-500",
                              addrState === "invalid"    && "border-red-500/50 bg-red-500/5",
                              addrState === "validating" && "border-primary/40",
                              addrState === "empty"      && "border-border/80 focus:border-primary/50 focus:bg-card"
                            )}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {addrState === "validating" && <RefreshCw className="size-4 animate-spin text-primary/60" />}
                            {addrState === "valid"      && <CheckCircle2 className="size-4 text-emerald-500" />}
                            {addrState === "invalid"    && <span className="text-[11px] font-bold text-red-500">无效</span>}
                            {addrState === "empty"      && (
                              <button className="flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1 text-[10.5px] font-medium text-muted-foreground hover:bg-secondary">
                                <ScanLine className="size-3" /> 扫码
                              </button>
                            )}
                          </div>
                        </div>
                        {addrState === "invalid" && (
                          <p className="mt-1 text-[11px] text-red-500">请输入有效的链上地址（以 0x 或 T 开头）</p>
                        )}
                      </div>

                      {/* Amount input */}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-[12px] font-semibold text-muted-foreground">发送数量</label>
                          <span className="text-[11px] text-muted-foreground/60">余额: {token.bal} {token.symbol}</span>
                        </div>
                        <div className="relative">
                          <input
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            type="number"
                            min="0"
                            className="w-full rounded-2xl border border-border/80 bg-secondary/30 px-4 py-3.5 pr-24 text-[18px] font-bold text-foreground placeholder:text-muted-foreground/30 outline-none transition-all focus:border-primary/50 focus:bg-card"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <span className="rounded-xl bg-secondary/80 px-2.5 py-1 text-[12.5px] font-bold text-foreground/70">
                              {token.symbol}
                            </span>
                          </div>
                        </div>
                        {amountNum > 0 && (
                          <div className="mt-2 flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                            <span className="text-[11.5px] text-muted-foreground">
                              ≈ <span className="font-semibold text-foreground">${usdVal}</span> USD
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              预估手续费 <span className="font-semibold text-foreground">{chain.fee}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fee info */}
                      <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
                        <div className="mb-2.5 flex items-center gap-1.5">
                          <Info className="size-3 text-muted-foreground/60" />
                          <span className="text-[11px] font-semibold text-muted-foreground">费用参考 · {chain.name}</span>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { label: "预估手续费", value: chain.fee },
                            { label: "预计到账",   value: "< 30 秒" },
                            { label: "网络",       value: chain.name },
                          ].map(row => (
                            <div key={row.label} className="flex justify-between text-[11.5px]">
                              <span className="text-muted-foreground">{row.label}</span>
                              <span className="font-medium text-foreground">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Send button */}
                      <button
                        onClick={send}
                        disabled={!isValid}
                        className={cn(
                          "relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-4 text-[15px] font-bold transition-all duration-200",
                          isValid
                            ? "bg-gradient-to-r from-primary via-cyan-500 to-primary bg-[length:200%_100%] text-white shadow-lg shadow-primary/30 hover:bg-right hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99]"
                            : "cursor-not-allowed bg-secondary text-muted-foreground"
                        )}
                      >
                        {isValid && (
                          <div className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 hover:translate-x-full" />
                        )}
                        <Send className="relative size-4" />
                        <span className="relative">立即发送 {token.symbol}</span>
                        {isValid && <ArrowRight className="relative size-4" />}
                      </button>
                    </>
                  )}

                  {/* ── confirm ── */}
                  {step === "confirm" && (
                    <div className="space-y-5">
                      <div className="overflow-hidden rounded-2xl border border-border/80 bg-secondary/20">
                        <div className="bg-gradient-to-r from-primary/8 to-cyan-500/5 px-5 py-3 text-[12px] font-bold text-foreground">
                          确认转账信息
                        </div>
                        <div className="divide-y divide-border/50 px-5">
                          {[
                            { label:"发送代币", val: `${amount} ${token.symbol}`, bold: true },
                            { label:"等值美元", val: `≈ $${usdVal}` },
                            { label:"接收地址", val: `${toAddr.slice(0,10)}…${toAddr.slice(-8)}`, mono: true },
                            { label:"网络",     val: chain.name },
                            { label:"预估手续费", val: chain.fee },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between py-3 text-[13px]">
                              <span className="text-muted-foreground">{row.label}</span>
                              <span className={cn(
                                row.bold ? "font-bold text-foreground text-[14px]" : "text-foreground",
                                row.mono && "font-mono text-[12px]"
                              )}>{row.val}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between border-t border-border/80 py-3.5">
                            <span className="text-[13px] font-bold text-foreground">实际到账</span>
                            <span className="text-[16px] font-bold text-foreground">
                              {amount} <span className="text-primary">{token.symbol}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={reset} className="flex-1 rounded-2xl border border-border py-3.5 text-[13px] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                          取消
                        </button>
                        <button onClick={confirm} className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-cyan-500 py-3.5 text-[13px] font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-90 hover:shadow-lg hover:shadow-primary/25">
                          确认发送
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── sending ── */}
                  {step === "sending" && (
                    <div className="flex flex-col items-center gap-6 py-8">
                      <div className="relative size-20">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
                        <div className="absolute inset-2 animate-ping rounded-full bg-primary/10 [animation-delay:-.4s]" />
                        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 ring-2 ring-primary/20">
                          <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[17px] font-bold text-foreground">广播至链上网络…</p>
                        <p className="mt-1.5 text-[12.5px] text-muted-foreground">{chain.name} · 等待节点确认</p>
                      </div>
                      <div className="w-full space-y-3">
                        {SENDING_STEPS.map((s, i) => (
                          <div key={s} className="flex items-center gap-3">
                            <div className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              i < 3 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                            )}>
                              {i < 3 ? <CheckCircle2 className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
                            </div>
                            <span className={cn("flex-1 text-[13px]", i < 3 ? "font-medium text-foreground" : "text-muted-foreground")}>
                              {s}
                            </span>
                            {i < 3 && <span className="text-[11px] font-semibold text-emerald-500">完成</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── done ── */}
                  {step === "done" && (
                    <div className="flex flex-col items-center gap-5 py-6">
                      <div className="relative flex size-20 items-center justify-center">
                        <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20" />
                        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/15 ring-2 ring-emerald-500/30">
                          <CheckCircle2 className="size-10 text-emerald-500" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[20px] font-bold text-foreground">发送成功 🎉</p>
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          <span className="font-bold text-foreground">{amount} {token.symbol}</span> 已发送至目标地址
                        </p>
                      </div>
                      <div className="w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="border-b border-emerald-500/15 px-4 py-3">
                          <div className="flex items-center justify-between text-[12.5px]">
                            <span className="text-muted-foreground">交易哈希</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11.5px] text-primary">{shortHash}</span>
                              <button onClick={copyHash} className="text-muted-foreground transition hover:text-foreground">
                                {copied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                              </button>
                              <button className="text-muted-foreground transition hover:text-foreground">
                                <ExternalLink className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-emerald-500/15 py-3">
                          {[
                            { label:"确认数", val:"12",        green: true },
                            { label:"网络",   val:chain.short, green: false },
                            { label:"耗时",   val:"14 秒",      green: false },
                          ].map(item => (
                            <div key={item.label} className="flex flex-col items-center gap-0.5 px-3">
                              <span className={cn("text-[13px] font-bold", item.green ? "text-emerald-500" : "text-foreground")}>{item.val}</span>
                              <span className="text-[10px] text-muted-foreground">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={reset} className="w-full rounded-2xl bg-gradient-to-r from-primary to-cyan-500 py-4 text-[14.5px] font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-92 hover:shadow-xl hover:shadow-primary/25">
                        再次发送
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
