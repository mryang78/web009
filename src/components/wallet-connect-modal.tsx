"use client";
// ---------------------------------------------------------------------------
// 钱包连接模态框 — 专业多步骤流程
// MetaMask / WalletConnect / Coinbase Wallet / Trust Wallet
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import { useWalletAuth, type WalletType } from "@/lib/wallet-auth-context";
import {
  X, Loader2, Zap, ShieldCheck, CheckCircle2,
  Copy, ArrowLeft, QrCode, ChevronDown, ChevronUp,
} from "lucide-react";

interface WalletDef {
  id: WalletType;
  name: string;
  desc: string;
  icon: React.ReactNode;
  popular?: boolean;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
}

// ── Wallet SVG icons ──────────────────────────────────────────────────────────
function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <rect width="40" height="40" rx="10" fill="#F6851B" opacity="0.12"/>
      <g transform="translate(6, 5)">
        <polygon points="14,1 8,11 14,14 14,1" fill="#E2761B" stroke="#E2761B" strokeWidth="0.1"/>
        <polygon points="14,1 20,11 14,14 14,1" fill="#E4761B" stroke="#E4761B" strokeWidth="0.1"/>
        <polygon points="12,18 14,14 8,11 12,18" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.1"/>
        <polygon points="16,18 14,14 20,11 16,18" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.1"/>
        <polygon points="8,11 12,18 10,19 8,11" fill="#233447" stroke="#233447" strokeWidth="0.1"/>
        <polygon points="20,11 18,19 16,18 20,11" fill="#233447" stroke="#233447" strokeWidth="0.1"/>
        <polygon points="10,19 12,18 11,21 10,19" fill="#CD6116" stroke="#CD6116" strokeWidth="0.1"/>
        <polygon points="18,19 16,18 17,21 18,19" fill="#CD6116" stroke="#CD6116" strokeWidth="0.1"/>
        <polygon points="11,21 12,18 16,18 17,21 14,23 11,21" fill="#E4751F" stroke="#E4751F" strokeWidth="0.1"/>
        <polygon points="8,11 10,19 14,17 8,11" fill="#F6851B" stroke="#F6851B" strokeWidth="0.1"/>
        <polygon points="20,11 14,17 18,19 20,11" fill="#F6851B" stroke="#F6851B" strokeWidth="0.1"/>
        <polygon points="14,17 11,21 14,23 14,17" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.1"/>
        <polygon points="14,17 17,21 14,23 14,17" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.1"/>
        <polygon points="11,21 14,17 10,19 11,21" fill="#161616" stroke="#161616" strokeWidth="0.1"/>
        <polygon points="17,21 14,17 18,19 17,21" fill="#161616" stroke="#161616" strokeWidth="0.1"/>
      </g>
    </svg>
  );
}

function WalletConnectIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <rect width="40" height="40" rx="10" fill="#3B99FC" opacity="0.12"/>
      <circle cx="20" cy="20" r="11" fill="#3B99FC"/>
      <path d="M13.5 17.5C16.8 14.2 21.2 14.2 24.5 17.5L24.9 17.9C25.1 18.1 25.1 18.4 24.9 18.6L23.6 19.9C23.5 20 23.3 20 23.2 19.9L22.6 19.3C20.3 17 17.7 17 15.4 19.3L14.7 20C14.6 20.1 14.4 20.1 14.3 20L13 18.7C12.8 18.5 12.8 18.2 13 18L13.5 17.5Z" fill="white"/>
      <path d="M26.8 19.8L27.9 20.9C28.1 21.1 28.1 21.4 27.9 21.6L22.4 27.1C22.2 27.3 21.9 27.3 21.7 27.1L17.9 23.3C17.85 23.25 17.75 23.25 17.7 23.3L13.9 27.1C13.7 27.3 13.4 27.3 13.2 27.1L7.7 21.6C7.5 21.4 7.5 21.1 7.7 20.9L8.8 19.8C9 19.6 9.3 19.6 9.5 19.8L13.3 23.6C13.35 23.65 13.45 23.65 13.5 23.6L17.3 19.8C17.5 19.6 17.8 19.6 18 19.8L21.8 23.6C21.85 23.65 21.95 23.65 22 23.6L25.8 19.8C26.1 19.6 26.6 19.6 26.8 19.8Z" fill="white"/>
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <rect width="40" height="40" rx="10" fill="#1652F0" opacity="0.12"/>
      <circle cx="20" cy="20" r="11" fill="#1652F0"/>
      <rect x="15" y="15" width="10" height="10" rx="2.5" fill="white"/>
    </svg>
  );
}

function TrustWalletIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <rect width="40" height="40" rx="10" fill="#3375BB" opacity="0.12"/>
      <path d="M20 8L10 12V20C10 25.5 14.4 30.6 20 32C25.6 30.6 30 25.5 30 20V12L20 8Z" fill="url(#tw_grad)"/>
      <path d="M16 20L18.5 22.5L24 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="tw_grad" x1="10" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0500FF"/>
          <stop offset="1" stopColor="#00C6FB"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Decorative QR code (static, pattern looks convincing) ─────────────────────
function FakeQR({ size = 152 }: { size?: number }) {
  const n = 17;
  const cell = size / n;
  const isBlack = (r: number, c: number): boolean => {
    // Finder patterns (top-left, top-right, bottom-left corners)
    const finderBlock = (dr: number, dc: number) =>
      dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
    if (r < 7 && c < 7)           return finderBlock(r, c);
    if (r < 7 && c >= n - 7)      return finderBlock(r, c - (n - 7));
    if (r >= n - 7 && c < 7)      return finderBlock(r - (n - 7), c);
    // Separator (quiet zone around finders)
    if (r === 7 && c < 8)         return false;
    if (r === 7 && c >= n - 8)    return false;
    if (c === 7 && r < 8)         return false;
    // Timing patterns
    if (r === 6 && c > 7 && c < n - 7) return c % 2 === 0;
    if (c === 6 && r > 7 && r < n - 7) return r % 2 === 0;
    // Data modules (pseudo-random, visually dense)
    return (r * 7 + c * 13 + r * c + (r + c) * 3) % 3 !== 0;
  };

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (isBlack(r, c)) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell + 0.6}
            y={r * cell + 0.6}
            width={cell - 1.2}
            height={cell - 1.2}
            rx={0.8}
            fill="currentColor"
          />
        );
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-foreground"
    >
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
}

// ── Simulated connected addresses (one per wallet, deterministic) ─────────────
const FAKE_ADDRESSES: Record<WalletType, string> = {
  metamask:      "0x3A8b4F2c…d91E",
  walletconnect: "0x7C2e1A5B…8f3D",
  coinbase:      "0x1D9f3c7E…4b2A",
  trust:         "0x5E8b2d4F…7c1E",
};

// ── Connection step labels ────────────────────────────────────────────────────
const CONNECT_STEPS = [
  { label: "检测插件 / 钱包",  done: true,  active: false },
  { label: "建立安全通道",      done: false, active: true  },
  { label: "请求签名授权",      done: false, active: false },
  { label: "验证链上身份",      done: false, active: false },
];

const WALLETS: WalletDef[] = [
  {
    id:          "metamask",
    name:        "MetaMask",
    desc:        "最广泛使用的以太坊浏览器插件钱包",
    icon:        <MetaMaskIcon />,
    popular:     true,
    bgColor:     "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800/40",
    hoverBg:     "hover:bg-orange-100/80 dark:hover:bg-orange-900/30",
  },
  {
    id:          "walletconnect",
    name:        "WalletConnect",
    desc:        "扫码连接任意移动端或桌面钱包",
    icon:        <WalletConnectIcon />,
    bgColor:     "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800/40",
    hoverBg:     "hover:bg-blue-100/80 dark:hover:bg-blue-900/30",
  },
  {
    id:          "coinbase",
    name:        "Coinbase Wallet",
    desc:        "Coinbase 旗下去中心化自托管钱包",
    icon:        <CoinbaseIcon />,
    bgColor:     "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800/40",
    hoverBg:     "hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30",
  },
  {
    id:          "trust",
    name:        "Trust Wallet",
    desc:        "全球 7000 万+ 用户信赖的移动端钱包",
    icon:        <TrustWalletIcon />,
    bgColor:     "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800/40",
    hoverBg:     "hover:bg-cyan-100/80 dark:hover:bg-cyan-900/30",
  },
];

// ── Main modal component ──────────────────────────────────────────────────────
export function WalletConnectModal() {
  const { modalOpen, closeModal, connect, isConnecting, connectingWallet } = useWalletAuth();

  const [qrMode, setQrMode]                   = useState(false);
  const [showWalletInfo, setShowWalletInfo]   = useState(false);
  const [connected, setConnected]             = useState(false);
  const [connectedWalletId, setConnectedWalletId] = useState<WalletType | null>(null);
  const [copied, setCopied]                   = useState(false);

  // Track when isConnecting transitions false → trigger success state
  const prevConnecting = useRef(false);
  const lastWallet     = useRef<WalletType | null>(null);
  if (isConnecting && connectingWallet) lastWallet.current = connectingWallet;

  useEffect(() => {
    if (prevConnecting.current && !isConnecting && lastWallet.current) {
      setConnected(true);
      setConnectedWalletId(lastWallet.current);
    }
    prevConnecting.current = isConnecting;
  }, [isConnecting]);

  // Reset all local state when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setQrMode(false);
      setShowWalletInfo(false);
      setConnected(false);
      setConnectedWalletId(null);
      setCopied(false);
      lastWallet.current = null;
    }
  }, [modalOpen]);

  if (!modalOpen) return null;

  const address    = connectedWalletId ? FAKE_ADDRESSES[connectedWalletId] : "";
  const walletName = connectedWalletId ? WALLETS.find((w) => w.id === connectedWalletId)?.name : "";

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={!isConnecting ? closeModal : undefined}
      />

      {/* Modal card */}
      <div className="glass-panel-strong relative w-full max-w-[400px] overflow-hidden rounded-2xl shadow-2xl">
        {/* Top accent gradient bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-primary to-cyan-400" />

        {/* ── SUCCESS STATE ── */}
        {connected ? (
          <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
            {/* Icon */}
            <div className="relative flex size-[60px] items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/25">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
              <CheckCircle2 className="relative size-7 text-emerald-500" />
            </div>

            <div>
              <h2 className="text-[17px] font-bold text-foreground">钱包已连接</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {walletName} · 身份验证成功
              </p>
            </div>

            {/* Address */}
            <div className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                已连接地址
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-data text-[13px] font-medium text-foreground">{address}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="复制地址"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              {copied && (
                <p className="mt-1 text-[10px] font-medium text-emerald-500">✓ 已复制到剪贴板</p>
              )}
            </div>

            {/* Balance */}
            <div className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                预估总资产
              </p>
              <p className="mt-1 text-[22px] font-bold tabular-nums text-foreground">$12,847.32</p>
              <p className="text-[11px] text-muted-foreground">≈ 4.11 ETH · 当前行情估算</p>
            </div>

            {/* CTA */}
            <button
              onClick={closeModal}
              className="w-full rounded-xl bg-primary py-3 text-[13.5px] font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-md"
            >
              进入平台
            </button>

            <p className="text-[11px] text-muted-foreground/60">
              资产数据仅为展示，不代表真实链上余额
            </p>
          </div>

        ) : qrMode ? (
          /* ── QR CODE MODE (WalletConnect) ── */
          <div>
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
              <button
                onClick={() => setQrMode(false)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="flex-1">
                <h2 className="text-[15px] font-bold text-foreground">扫码连接</h2>
                <p className="text-[11px] text-muted-foreground">使用移动钱包扫描二维码</p>
              </div>
              <button
                onClick={closeModal}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="关闭"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 px-6 py-6">
              {/* QR code */}
              <div className="rounded-2xl border border-border/60 bg-white p-3 shadow-sm">
                <FakeQR size={152} />
              </div>

              {/* Steps */}
              <ol className="w-full space-y-1.5 text-[12px]">
                {[
                  "打开支持 WalletConnect 的移动端钱包",
                  "点击钱包内的「扫一扫」或「连接 DApp」",
                  "扫描上方二维码并在钱包内确认",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>

              <button
                onClick={() => { connect("walletconnect"); setQrMode(false); }}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
              >
                已扫码 · 确认连接
              </button>

              <p className="text-center text-[11px] text-muted-foreground/60">
                二维码每 5 分钟自动刷新
              </p>
            </div>
          </div>

        ) : (
          /* ── NORMAL WALLET SELECTION ── */
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pb-3 pt-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Zap className="size-4 text-primary" fill="currentColor" />
                  </div>
                  <h2 className="text-[17px] font-bold tracking-tight text-foreground">连接钱包</h2>
                </div>
                <p className="ml-[42px] text-[12px] text-muted-foreground">
                  选择您的 Web3 钱包安全登录
                </p>
              </div>
              {!isConnecting && (
                <button
                  onClick={closeModal}
                  className="mt-0.5 flex size-7 items-center justify-center rounded-lg text-muted-foreground/70 transition-all hover:bg-secondary hover:text-foreground"
                  aria-label="关闭"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Wallet list */}
            <div className="space-y-2 px-4 pb-3">
              {WALLETS.map((w) => {
                const loading  = isConnecting && connectingWallet === w.id;
                const disabled = isConnecting && connectingWallet !== w.id;
                const isWC     = w.id === "walletconnect";

                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      if (isConnecting) return;
                      if (isWC) { setQrMode(true); return; }
                      connect(w.id);
                    }}
                    disabled={disabled}
                    className={[
                      "relative flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
                      loading
                        ? `${w.bgColor} ${w.borderColor} shadow-md scale-[0.99]`
                        : disabled
                        ? "cursor-not-allowed border-border bg-secondary/30 opacity-40"
                        : `${w.bgColor} ${w.borderColor} ${w.hoverBg} hover:shadow-sm hover:-translate-y-px active:translate-y-0 active:shadow-none`,
                    ].join(" ")}
                  >
                    {/* Icon */}
                    <span className="flex size-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border/50">
                      {w.icon}
                    </span>

                    {/* Text */}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-foreground">{w.name}</span>
                        {w.popular && (
                          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                            热门
                          </span>
                        )}
                        {isWC && (
                          <span className="flex items-center gap-0.5 rounded-full bg-blue-500/12 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-600 dark:text-blue-400">
                            <QrCode className="size-2.5" />
                            扫码
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                        {w.desc}
                      </span>
                    </span>

                    {/* Right indicator */}
                    {loading ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <svg className="size-4 shrink-0 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* What is a wallet? */}
            <div className="px-4 pb-3">
              <button
                onClick={() => setShowWalletInfo((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-secondary/20 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
              >
                <span>什么是钱包？新用户指引</span>
                {showWalletInfo
                  ? <ChevronUp className="size-3.5 shrink-0" />
                  : <ChevronDown className="size-3.5 shrink-0" />
                }
              </button>
              {showWalletInfo && (
                <div className="mt-2 space-y-2 rounded-xl border border-border/50 bg-secondary/10 px-4 py-3 text-[12px] text-muted-foreground">
                  <p>钱包是您在 Web3 世界的数字身份 — 它存储您的加密资产并证明所有权。</p>
                  <p>与传统账号不同，无需注册即可拥有；私钥由您自己掌控，平台无法访问您的资产。</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-secondary/40 px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-foreground">🔑 私钥 / 助记词</p>
                      <p className="mt-0.5 text-[10.5px]">钱包唯一凭证，务必离线保管，切勿分享</p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-foreground">✍️ 签名授权</p>
                      <p className="mt-0.5 text-[10.5px]">登录时仅签名验证，不转移任何资产</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="px-5 pb-3 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                连接即代表您同意本平台的{" "}
                <span className="cursor-pointer underline underline-offset-2 hover:text-muted-foreground">服务协议</span>
                {" "}与{" "}
                <span className="cursor-pointer underline underline-offset-2 hover:text-muted-foreground">隐私政策</span>
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 border-t border-border/60 bg-muted/30 px-5 py-3">
              <ShieldCheck className="size-3 text-muted-foreground/60" />
              <p className="text-[11px] text-muted-foreground/70">
                端对端加密 · 签名验证 · 平台不持有私钥
              </p>
            </div>
          </>
        )}

        {/* ── CONNECTING OVERLAY ── */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/96 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5 text-center">
              {/* Radar micro-scan ring — a rotating conic sweep behind a
                  breathing dashed ring, reads as an active scan rather than
                  a generic spinner. */}
              <div className="relative flex size-[72px] items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/15 [animation-duration:2.4s]" />
                <div className="radar-ring absolute inset-0 rounded-full" style={{ maskImage: "radial-gradient(circle, transparent 58%, black 60%)", WebkitMaskImage: "radial-gradient(circle, transparent 58%, black 60%)" }} />
                <div className="absolute inset-0 rounded-full border border-dashed border-primary/25" />
                <div className="relative flex size-[52px] items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/25">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              </div>

              <div>
                <p className="text-[15px] font-semibold text-foreground">正在建立安全连接…</p>
                <p className="mt-1 text-[12px] text-muted-foreground">请在钱包中确认签名请求</p>
              </div>

              {/* Step indicators */}
              <div className="w-full max-w-[220px] space-y-2.5">
                {CONNECT_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2.5 text-[12px]">
                    <div className={[
                      "size-2 rounded-full shrink-0 transition-all",
                      step.done
                        ? "bg-primary"
                        : step.active
                        ? "animate-pulse bg-primary/60"
                        : "bg-border",
                    ].join(" ")}
                    style={step.active ? { animationDelay: `${i * 150}ms` } : undefined}
                    />
                    <span className={step.done || step.active ? "text-foreground/80" : "text-muted-foreground/50"}>
                      {step.label}
                    </span>
                    {step.done && (
                      <CheckCircle2 className="ml-auto size-3 shrink-0 text-primary" />
                    )}
                  </div>
                ))}
              </div>

              <p className="max-w-[200px] text-[11px] text-muted-foreground/60">
                此操作仅需签名验证，不会发起任何资产转移
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
