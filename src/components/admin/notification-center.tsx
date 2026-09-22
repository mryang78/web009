"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, AlertTriangle, ShieldAlert, Zap, Eye, CheckCheck, Settings, Radio } from "lucide-react";
import Link from "@/components/app-link";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
type NotifCategory = "ATTACK" | "RULE" | "WALLET" | "SYSTEM";

interface LiveNotif {
  id: string;
  severity: Severity;
  category: NotifCategory;
  title: string;
  body: string;
  chain?: string;
  address?: string;
  href: string;
  ts: number;      // unix ms
  read: boolean;
}

// ─── Seed data ──────────────────────────────────────────────────────────────
const SEED_NOTIFS: LiveNotif[] = [
  {
    id: "n-001",
    severity: "CRITICAL",
    category: "ATTACK",
    title: "重入攻击检测",
    body: "地址 0xd91f...44a2 向 VictimPool 合约发起 3 层重入，已提取 4.5 ETH",
    chain: "ETH",
    address: "0xd91f...44a2",
    href: "/admin/security/simulations",
    ts: Date.now() - 2 * 60_000,
    read: false,
  },
  {
    id: "n-002",
    severity: "HIGH",
    category: "WALLET",
    title: "无限授权待复核",
    body: "钱包 0xA1b2...9f3C 向 0xMaliciousRouter 授权 MAX_UINT256",
    chain: "BSC",
    address: "0xA1b2...9f3C",
    href: "/admin/approvals",
    ts: Date.now() - 8 * 60_000,
    read: false,
  },
  {
    id: "n-003",
    severity: "CRITICAL",
    category: "ATTACK",
    title: "闪电贷攻击预警",
    body: "PancakeSwap Pool 检测到 $2.3M 闪电贷，价格偏差 +340%",
    chain: "BSC",
    href: "/admin/security/simulations",
    ts: Date.now() - 14 * 60_000,
    read: false,
  },
  {
    id: "n-004",
    severity: "HIGH",
    category: "RULE",
    title: "规则 R-4421 触发",
    body: "无限授权检测规则命中，目标合约未经审计",
    href: "/admin/alert-rules",
    ts: Date.now() - 22 * 60_000,
    read: true,
  },
  {
    id: "n-005",
    severity: "MEDIUM",
    category: "ATTACK",
    title: "MEV 三明治攻击",
    body: "MEV Bot 0xBot...f3d1 在 Mempool 中检测到三明治机会，目标 0x71D3...A82F",
    chain: "ETH",
    href: "/admin/security/simulations",
    ts: Date.now() - 35 * 60_000,
    read: true,
  },
  {
    id: "n-006",
    severity: "INFO",
    category: "SYSTEM",
    title: "审计日志已导出",
    body: "管理员 王雨薇 导出了 2026-09-21 全量审计日志（CSV）",
    href: "/admin/audit-log",
    ts: Date.now() - 60 * 60_000,
    read: true,
  },
];

// 随机生成的实时告警模板
const LIVE_TEMPLATES = [
  { severity: "CRITICAL" as Severity, category: "ATTACK" as NotifCategory, title: "Rug Pull 预警", body: "流动性提供者 0x{addr} 在 15 秒内撤出 $1.8M，疑似 Rug Pull", href: "/admin/security/simulations", chain: "BSC" },
  { severity: "HIGH" as Severity, category: "WALLET" as NotifCategory, title: "大额转出监控", body: "钱包 0x{addr} 向混币器地址发起 12.4 ETH 转账", href: "/admin/asset-flows", chain: "ETH" },
  { severity: "HIGH" as Severity, category: "RULE" as NotifCategory, title: "规则 R-7720 触发", body: "价格操纵检测规则：AMM 价格偏差超过阈值 200%", href: "/admin/alert-rules", chain: "ARB" },
  { severity: "MEDIUM" as Severity, category: "ATTACK" as NotifCategory, title: "恶意合约调用", body: "DELEGATECALL 到未验证地址 0x{addr}，存储污染风险", href: "/admin/security/simulations", chain: "ETH" },
];

function randAddr() {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)];
  s += "...";
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const SEV_CONFIG: Record<Severity, { dot: string; badge: string; icon: typeof AlertTriangle }> = {
  CRITICAL: { dot: "bg-red-500 animate-pulse",     badge: "bg-red-500/15 text-red-400",    icon: AlertTriangle },
  HIGH:     { dot: "bg-amber-500 animate-pulse",   badge: "bg-amber-500/15 text-amber-400", icon: ShieldAlert },
  MEDIUM:   { dot: "bg-yellow-500",                badge: "bg-yellow-500/15 text-yellow-400", icon: Zap },
  INFO:     { dot: "bg-sky-500",                   badge: "bg-sky-500/15 text-sky-400",    icon: Eye },
};

const CAT_LABEL: Record<NotifCategory, string> = {
  ATTACK: "攻击",
  RULE:   "规则",
  WALLET: "钱包",
  SYSTEM: "系统",
};

function fmtRelTime(ms: number) {
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.floor(diff / 1000)} 秒前`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3_600_000)} 小时前`;
}

// ─── Main component ──────────────────────────────────────────────────────────
export function NotificationCenter() {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState<LiveNotif[]>(SEED_NOTIFS);
  const [filter, setFilter]     = useState<Severity | "ALL">("ALL");
  const panelRef                = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Live streaming: new alert every 18 seconds
  useEffect(() => {
    const t = setInterval(() => {
      const tpl = LIVE_TEMPLATES[Math.floor(Math.random() * LIVE_TEMPLATES.length)];
      const newNotif: LiveNotif = {
        ...tpl,
        id:   `n-live-${Date.now()}`,
        body: tpl.body.replace("{addr}", randAddr().slice(2)),
        ts:   Date.now(),
        read: false,
      };
      setNotifs((prev) => [newNotif, ...prev].slice(0, 30));
    }, 18_000);
    return () => clearInterval(t);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const criticalCount = notifs.filter((n) => n.severity === "CRITICAL" && !n.read).length;

  const displayed = filter === "ALL" ? notifs : notifs.filter((n) => n.severity === filter);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }
  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="通知中心"
        title="通知中心"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className={cn(
            "absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[8.5px] font-bold text-white",
            criticalCount > 0 ? "bg-red-500" : "bg-amber-500"
          )}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Radio className="size-3.5 text-emerald-400" />
              <span className="text-[13px] font-semibold text-foreground">实时威胁通知</span>
              {unread > 0 && (
                <span className="rounded-full bg-red-500/15 px-1.5 py-px text-[10px] font-bold text-red-400">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="全部标为已读"
                >
                  <CheckCheck className="size-3" />
                  全部已读
                </button>
              )}
              <Link href="/admin/alert-rules" onClick={() => setOpen(false)}>
                <Settings className="size-3.5 text-muted-foreground/60 transition-colors hover:text-foreground" />
              </Link>
            </div>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/50 px-3 py-2 scrollbar-none">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "INFO"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors",
                  filter === s
                    ? s === "ALL"
                      ? "bg-primary/15 text-primary"
                      : `${SEV_CONFIG[s as Severity]?.badge}`
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {s === "ALL" ? "全部" : s}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="max-h-[420px] divide-y divide-border/30 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-muted-foreground">暂无告警</div>
            ) : (
              displayed.map((n) => {
                const cfg = SEV_CONFIG[n.severity];
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-secondary/40",
                      !n.read && "bg-primary/3"
                    )}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", cfg.dot)} />
                    )}
                    {n.read && <span className="mt-1.5 size-1.5 shrink-0" />}

                    {/* Icon */}
                    <span className={cn("mt-0.5 shrink-0 rounded-full p-1", cfg.badge)}>
                      <Icon className="size-3" />
                    </span>

                    {/* Content */}
                    <Link
                      href={n.href}
                      onClick={() => { markRead(n.id); setOpen(false); }}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-semibold text-foreground/90 leading-snug">{n.title}</span>
                        <span className={cn("shrink-0 rounded px-1 py-px text-[9.5px] font-bold", cfg.badge)}>
                          {n.severity}
                        </span>
                        {n.chain && (
                          <span className="shrink-0 rounded bg-secondary/70 px-1 py-px text-[9.5px] font-mono text-muted-foreground">
                            {n.chain}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground/70">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/40">
                        {CAT_LABEL[n.category]} · {fmtRelTime(n.ts)}
                      </p>
                    </Link>

                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(n.id)}
                      className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary"
                    >
                      <X className="size-3 text-muted-foreground/50" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 text-center">
            <Link
              href="/admin/audit-log"
              onClick={() => setOpen(false)}
              className="text-[11px] text-muted-foreground/60 transition-colors hover:text-primary"
            >
              查看完整审计日志 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
