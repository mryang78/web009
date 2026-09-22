"use client";
// ─────────────────────────────────────────────────────────────────────────────
// USDT 发送器演示 — 模拟加密资产转账界面（纯演示，不产生真实交易）
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  Send, ChevronDown, AlertTriangle, CheckCircle2, Loader2,
  Copy, CheckCheck, Zap, ArrowRight, History, Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ── Mock data ────────────────────────────────────────────────────────────────
const TOKENS = [
  { symbol: "USDT", name: "Tether USD",        balance: "128,402.50", decimals: 6,  chain: "ETH",  color: "bg-emerald-500", logo: "₮" },
  { symbol: "USDC", name: "USD Coin",           balance: "43,819.20",  decimals: 6,  chain: "ETH",  color: "bg-blue-500",    logo: "Ⓤ" },
  { symbol: "ETH",  name: "Ethereum",           balance: "24.8821",    decimals: 18, chain: "ETH",  color: "bg-violet-500",  logo: "Ξ" },
  { symbol: "BNB",  name: "BNB",                balance: "312.44",     decimals: 18, chain: "BSC",  color: "bg-yellow-500",  logo: "B" },
  { symbol: "WBTC", name: "Wrapped Bitcoin",    balance: "1.0482",     decimals: 8,  chain: "ETH",  color: "bg-orange-500",  logo: "₿" },
];

const RECENT_TXS = [
  { hash: "0x4a3f...9b21", to: "0x71D4...A82F", amount: "5,000", token: "USDT", status: "confirmed", time: "2 分钟前",  fee: "$1.24" },
  { hash: "0x9c12...3e44", to: "0x9A21...7143", amount: "12,800", token: "USDT", status: "confirmed", time: "18 分钟前", fee: "$1.87" },
  { hash: "0xb871...f209", to: "0x4F2C...C9D1", amount: "0.5",    token: "ETH",  status: "confirmed", time: "1 小时前",  fee: "$2.31" },
  { hash: "0xd344...1c88", to: "0x2A71...B1F3", amount: "25,000", token: "USDC", status: "confirmed", time: "3 小时前",  fee: "$1.05" },
];

const NETWORKS = [
  { id: "eth",     name: "Ethereum",   fee: "$1.20–$3.50",  time: "~15 秒" },
  { id: "bsc",     name: "BNB Chain",  fee: "$0.10–$0.30",  time: "~3 秒"  },
  { id: "polygon", name: "Polygon",    fee: "$0.01–$0.05",  time: "~2 秒"  },
  { id: "arb",     name: "Arbitrum",   fee: "$0.08–$0.25",  time: "~1 秒"  },
];

type Step = "form" | "confirm" | "sending" | "done";

export function UsdtSenderClient() {
  const [token, setToken]         = useState(TOKENS[0]);
  const [network, setNetwork]     = useState(NETWORKS[0]);
  const [toAddr, setToAddr]       = useState("");
  const [amount, setAmount]       = useState("");
  const [step, setStep]           = useState<Step>("form");
  const [copied, setCopied]       = useState(false);
  const [showTokenDrop, setShowTokenDrop] = useState(false);
  const [showNetDrop, setShowNetDrop]     = useState(false);
  const [txHash]                  = useState("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));

  function copyAddr() {
    navigator.clipboard.writeText("0x71D4A82Fb3c8E2a9f4c1D6B0e5F3A7C9D2E8B1F");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSend() {
    setStep("confirm");
  }

  function handleConfirm() {
    setStep("sending");
    setTimeout(() => setStep("done"), 2800);
  }

  function handleReset() {
    setStep("form");
    setToAddr("");
    setAmount("");
  }

  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const fee = 1.24;
  const isValid = toAddr.length > 10 && amountNum > 0;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "资产与钱包" }, { label: "USDT 发送器" }]}
        title="加密资产发送器"
        description="向任意链上地址发送加密资产 · 模拟演示环境，不产生真实交易"
      />

      {/* Warning banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
          <strong>演示模式</strong> — 所有转账操作均为模拟，不会产生真实链上交易或资产变动。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── Left: Send form ─────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                <Send className="size-4 text-primary" />
              </div>
              <span className="text-[14px] font-semibold text-foreground">发送资产</span>
              <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ● 演示模式
              </span>
            </div>

            <div className="p-5 space-y-5">

              {step === "form" && (
                <>
                  {/* Token selector */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">选择代币</label>
                    <div className="relative">
                      <button
                        onClick={() => { setShowTokenDrop(v => !v); setShowNetDrop(false); }}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${token.color} text-[13px] font-bold text-white`}>
                          {token.logo}
                        </span>
                        <div className="flex-1 text-left">
                          <div className="text-[13.5px] font-semibold text-foreground">{token.symbol}</div>
                          <div className="text-[11px] text-muted-foreground">{token.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] font-medium text-foreground">{token.balance}</div>
                          <div className="text-[11px] text-muted-foreground">余额</div>
                        </div>
                        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showTokenDrop && "rotate-180")} />
                      </button>
                      {showTokenDrop && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                          {TOKENS.map(t => (
                            <button
                              key={t.symbol}
                              onClick={() => { setToken(t); setShowTokenDrop(false); }}
                              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary", token.symbol === t.symbol && "bg-primary/5")}
                            >
                              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${t.color} text-[12px] font-bold text-white`}>{t.logo}</span>
                              <div className="flex-1">
                                <div className="text-[13px] font-semibold text-foreground">{t.symbol}</div>
                                <div className="text-[11px] text-muted-foreground">{t.name}</div>
                              </div>
                              <span className="text-[12px] text-muted-foreground">{t.balance}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Network selector */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">选择网络</label>
                    <div className="relative">
                      <button
                        onClick={() => { setShowNetDrop(v => !v); setShowTokenDrop(false); }}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <div className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="flex-1 text-left text-[13.5px] font-medium text-foreground">{network.name}</span>
                        <span className="text-[11px] text-muted-foreground">手续费 {network.fee} · {network.time}</span>
                        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showNetDrop && "rotate-180")} />
                      </button>
                      {showNetDrop && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                          {NETWORKS.map(n => (
                            <button
                              key={n.id}
                              onClick={() => { setNetwork(n); setShowNetDrop(false); }}
                              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary", network.id === n.id && "bg-primary/5")}
                            >
                              <div className="size-2 rounded-full bg-emerald-500" />
                              <span className="flex-1 text-[13px] font-medium text-foreground">{n.name}</span>
                              <span className="text-[12px] text-muted-foreground">{n.fee}</span>
                              <span className="text-[11px] text-muted-foreground">{n.time}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">接收地址</label>
                    <input
                      value={toAddr}
                      onChange={e => setToAddr(e.target.value)}
                      placeholder="0x... 输入或粘贴链上地址"
                      className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-[13.5px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/50 focus:bg-card"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[12px] font-medium text-muted-foreground">发送数量</label>
                      <button
                        onClick={() => setAmount(token.balance.replace(/,/g, ""))}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        全部发送
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        type="number"
                        className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 pr-20 text-[13.5px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/50 focus:bg-card"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">
                        {token.symbol}
                      </span>
                    </div>
                    {amountNum > 0 && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        ≈ ${(amountNum * (token.symbol === "ETH" ? 3120 : token.symbol === "WBTC" ? 61200 : 1)).toLocaleString()} · 手续费约 ${fee}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!isValid}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold transition-all",
                      isValid
                        ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 hover:shadow-md"
                        : "cursor-not-allowed bg-secondary text-muted-foreground"
                    )}
                  >
                    <Send className="size-4" />
                    发送 {token.symbol}
                    {isValid && <ArrowRight className="size-4" />}
                  </button>
                </>
              )}

              {/* ── Confirm step ── */}
              {step === "confirm" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">发送代币</span>
                      <span className="font-semibold text-foreground">{amount} {token.symbol}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">接收地址</span>
                      <span className="font-mono text-[12px] text-foreground">{toAddr.slice(0, 8)}...{toAddr.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">网络</span>
                      <span className="font-semibold text-foreground">{network.name}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">预估手续费</span>
                      <span className="font-semibold text-foreground">${fee}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between text-[13.5px] font-semibold">
                      <span className="text-muted-foreground">实际到账</span>
                      <span className="text-foreground">{amount} {token.symbol}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="flex-1 rounded-xl border border-border py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary">
                      取消
                    </button>
                    <button onClick={handleConfirm} className="flex-1 rounded-xl bg-primary py-3 text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90">
                      确认发送
                    </button>
                  </div>
                </div>
              )}

              {/* ── Sending step ── */}
              {step === "sending" && (
                <div className="flex flex-col items-center gap-5 py-8">
                  <div className="relative flex size-16 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
                      <Loader2 className="size-7 animate-spin text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-foreground">交易广播中…</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">正在等待 {network.name} 网络确认</p>
                  </div>
                  <div className="w-full space-y-2">
                    {["构建交易", "签名授权", "广播至节点", "等待确认"].map((s, i) => (
                      <div key={s} className="flex items-center gap-2.5 text-[12px]">
                        <div className={cn("size-2 rounded-full shrink-0", i < 3 ? "bg-primary" : "animate-pulse bg-primary/50")} />
                        <span className={i < 3 ? "text-foreground/80" : "text-muted-foreground"}>{s}</span>
                        {i < 3 && <CheckCircle2 className="ml-auto size-3.5 text-emerald-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Done step ── */}
              {step === "done" && (
                <div className="flex flex-col items-center gap-5 py-6">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-foreground">发送成功！</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{amount} {token.symbol} 已发送至目标地址</p>
                  </div>
                  <div className="w-full rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-[12.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">交易哈希</span>
                      <span className="font-mono text-primary">{txHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">确认数</span>
                      <span className="text-emerald-500 font-semibold">12 确认</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">区块高度</span>
                      <span className="text-foreground">#21,482,091</span>
                    </div>
                  </div>
                  <button onClick={handleReset} className="w-full rounded-xl bg-primary py-3 text-[13.5px] font-semibold text-primary-foreground transition-all hover:opacity-90">
                    再次发送
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: wallet info + history ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Wallet info */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="size-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">发送钱包</span>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11.5px] text-foreground">0x71D4A82F...B1F3A7C9</span>
                <button onClick={copyAddr} className="shrink-0 text-muted-foreground hover:text-foreground">
                  {copied ? <CheckCheck className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {TOKENS.slice(0, 3).map(t => (
                <div key={t.symbol} className="flex items-center justify-between text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <span className={`flex size-5 items-center justify-center rounded-full ${t.color} text-[9px] font-bold text-white`}>{t.logo}</span>
                    <span className="text-foreground">{t.symbol}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">{t.balance}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent history */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="size-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">最近发送记录</span>
            </div>
            <div className="space-y-3">
              {RECENT_TXS.map(tx => (
                <div key={tx.hash} className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-primary">{tx.hash}</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                      <CheckCircle2 className="size-3" />已确认
                    </span>
                  </div>
                  <div className="flex justify-between text-[11.5px]">
                    <span className="text-muted-foreground">→ {tx.to}</span>
                    <span className="font-semibold text-foreground">{tx.amount} {tx.token}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[10.5px] text-muted-foreground">
                    <span>{tx.time}</span>
                    <span>手续费 {tx.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
