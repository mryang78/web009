"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/app-link";
import { usePathname } from "@/lib/navigation";
import {
  ArrowLeft,
  Menu,
  X,
  Search,
  Bell,
  ListChecks,
  ChevronDown,
  Clock,
  Flame,
  LogOut,
  Wallet,
  Unplug,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LabBadge } from "@/components/product-kit/lab-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageReveal } from "@/components/product-kit/page-reveal";
import { AdminPageSkeleton } from "@/components/product-kit/skeleton";
import { adminNav } from "@/lib/admin/nav";
import { ChainStatusBar } from "@/components/admin/chain-status-bar";
import { NotificationCenter } from "@/components/admin/notification-center";
import { KpiTicker } from "@/components/admin/kpi-ticker";
import {
  pendingItems,
  currentAdmin,
  globalSearchRecent,
  globalSearchHot,
  globalSearchResults,
  adminNotifications,
} from "@/lib/admin/mock";
import { cn } from "@/lib/utils";
import { useWalletAuth } from "@/lib/wallet-auth-context";

const WALLET_ICONS: Record<string, string> = {
  metamask:      "🦊",
  walletconnect: "🔗",
  coinbase:      "🔵",
  trust:         "🛡️",
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const g of adminNav) {
      if (g.items?.some((i) => isActive(pathname, i.href))) initial.add(g.label);
    }
    return initial;
  });

  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ─────────────────────────────── */}
      <div className="flex h-[57px] shrink-0 items-center border-b border-border/50 px-5">
        <Link href="/" className="shrink-0" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      {/* ── Nav ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {adminNav.map((group, gi) => {
          const Icon = group.icon;

          /* ── top-level leaf (工作台 / 返回首页) ── */
          if (!group.items) {
            if (!group.href) return null;
            const active = isActive(pathname, group.href);
            return (
              <Link
                key={group.label}
                href={group.href}
                onClick={onNavigate}
                className={cn(
                  "group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground ring-glow-primary"
                    : "text-foreground/65 hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "size-[15px] shrink-0 transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-foreground"
                )} />
                {group.label}
              </Link>
            );
          }

          const groupActive = group.items.some((i) => isActive(pathname, i.href));
          const open = openGroups.has(group.label);

          return (
            <div key={group.label} className={cn("mb-0.5", gi > 0 && "mt-1")}>
              {/* Group toggle */}
              <button
                onClick={() =>
                  setOpenGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(group.label)) next.delete(group.label);
                    else next.add(group.label);
                    return next;
                  })
                }
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                  groupActive
                    ? "text-foreground"
                    : "text-foreground/65 hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "size-[15px] shrink-0 transition-colors",
                  groupActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                )} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={cn(
                  "size-3 text-muted-foreground/35 transition-transform duration-200",
                  open && "rotate-180"
                )} />
              </button>

              {/* Children */}
              {open && (
                <ul className="relative mt-0.5 ml-[22px] space-y-0.5 border-l border-border/40 pl-3 pb-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-md px-2.5 py-[6px] text-[12.5px] transition-all duration-150",
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground/75 hover:bg-secondary/70 hover:text-foreground"
                          )}
                        >
                          {active && (
                            <span className="absolute -left-[13px] h-[18px] w-0.5 rounded-full bg-primary" />
                          )}
                          {ItemIcon && (
                            <ItemIcon className={cn(
                              "size-3.5 shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                            )} />
                          )}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Profile footer ───────────────────── */}
      <div className="shrink-0 border-t border-border/50 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 px-3 py-2.5 transition-colors hover:bg-secondary">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[12.5px] font-bold text-primary ring-2 ring-primary/15">
            {currentAdmin.initials}
            <span className="absolute -right-0.5 -bottom-0.5 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold leading-none text-foreground">{currentAdmin.name}</p>
            <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{currentAdmin.role}</p>
          </div>
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground">
            <Settings className="size-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { session, openModal, disconnect } = useWalletAuth();

  // ── Cmd+K / Ctrl+K 全局快捷键 ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setNotifOpen(false);
        setPendingOpen(false);
        setProfileOpen(false);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalPending = pendingItems.reduce((s, p) => s + p.value, 0);

  const filteredResults = query.trim()
    ? globalSearchResults.filter(
        (r) => r.label.toLowerCase().includes(query.trim().toLowerCase()) || r.category.includes(query.trim())
      )
    : globalSearchResults;

  function closeAllPopovers() {
    setNotifOpen(false);
    setPendingOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
    setWalletMenuOpen(false);
  }

  return (
    <div className="site-shell min-h-dvh">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="glass-panel sticky top-0 hidden h-dvh w-64 shrink-0 overflow-hidden border-r lg:block">
          <SidebarContent pathname={pathname} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="glass-panel sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-3 sm:px-5">
            <button
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              title="打开菜单"
            >
              <Menu className="size-4" />
            </button>

            <Link
              href="/"
              className="hidden shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" />
              返回首页
            </Link>

            <div className="relative mx-1 min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  setSearchOpen(true);
                  setNotifOpen(false);
                  setPendingOpen(false);
                  setProfileOpen(false);
                }}
                placeholder="搜索用户、资产、授权、钱包..."
                title="全局搜索 (Cmd+K)"
                className="h-9 w-full rounded-lg border border-border bg-secondary/30 pl-8 pr-16 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
              {!searchOpen && (
                <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border/70 bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
                  ⌘K
                </kbd>
              )}
              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                  <div className="absolute left-0 z-50 mt-2 w-[22rem] max-w-[90vw] rounded-xl glass-panel-strong p-3 shadow-2xl">
                    {!query.trim() ? (
                      <>
                        <div className="mb-2">
                          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                            <Clock className="size-3" />
                            最近搜索
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {globalSearchRecent.map((r) => (
                              <button
                                key={r}
                                onClick={() => setQuery(r)}
                                className="rounded-full bg-secondary/60 px-2.5 py-1 text-[11.5px] text-foreground/80 transition-colors hover:bg-secondary"
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                            <Flame className="size-3" />
                            热门搜索
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {globalSearchHot.map((r) => (
                              <button
                                key={r}
                                onClick={() => setQuery(r)}
                                className="rounded-full bg-secondary/60 px-2.5 py-1 text-[11.5px] text-foreground/80 transition-colors hover:bg-secondary"
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="max-h-80 space-y-0.5 overflow-y-auto">
                        {filteredResults.length === 0 ? (
                          <p className="px-1 py-3 text-center text-[12.5px] text-muted-foreground">
                            暂无搜索结果，换个关键词试试看
                          </p>
                        ) : (
                          filteredResults.map((r) => (
                            <Link
                              key={`${r.category}-${r.label}`}
                              href={r.href}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors hover:bg-secondary"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">{r.label}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">{r.sub}</span>
                              </span>
                              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                                {r.category}
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              {/* ── 钱包连接状态 ── */}
              <div className="relative">
                {session ? (
                  <button
                    onClick={() => {
                      const next = !walletMenuOpen;
                      closeAllPopovers();
                      setWalletMenuOpen(next);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-green-600 transition-colors hover:bg-green-500/15 dark:text-green-400"
                    title="已连接钱包"
                  >
                    <span className="text-sm">{WALLET_ICONS[session.walletType]}</span>
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span className="hidden sm:inline">{session.address}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { closeAllPopovers(); openModal(); }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
                    title="连接钱包"
                  >
                    <Wallet className="size-3.5 shrink-0" />
                    <span className="hidden sm:inline">连接钱包</span>
                  </button>
                )}
                {walletMenuOpen && session && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setWalletMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl glass-panel-strong shadow-2xl">
                      {/* Wallet info */}
                      <div className="border-b border-border bg-gradient-to-r from-green-500/5 to-transparent px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{WALLET_ICONS[session.walletType]}</span>
                          <div>
                            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                              <CheckCircle2 className="size-3 text-green-500" />
                              已连接
                            </div>
                            <div className="mt-0.5 font-data text-[11px] text-muted-foreground">{session.address}</div>
                          </div>
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-secondary/50 px-3 py-2">
                            <div className="text-[10px] text-muted-foreground">余额</div>
                            <div className="mt-0.5 text-[12px] font-semibold text-foreground">{session.balance}</div>
                          </div>
                          <div className="rounded-lg bg-secondary/50 px-3 py-2">
                            <div className="text-[10px] text-muted-foreground">网络</div>
                            <div className="mt-0.5 text-[11px] font-semibold text-foreground">Ethereum</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { disconnect(); setWalletMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                        >
                          <Unplug className="size-3.5" />
                          断开钱包连接
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => {
                    const next = !pendingOpen;
                    closeAllPopovers();
                    setPendingOpen(next);
                  }}
                  className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="待处理事项"
                  title="待处理事项"
                >
                  <ListChecks className="size-4" />
                  <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8.5px] font-bold text-white">
                    {totalPending}
                  </span>
                </button>
                {pendingOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl glass-panel-strong p-2 shadow-2xl">
                    <div className="px-2 py-1.5 text-[12px] font-semibold text-foreground">待处理事项</div>
                    {pendingItems.map((p) => (
                      <Link
                        key={p.label}
                        href={p.href}
                        onClick={() => setPendingOpen(false)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] text-foreground/90 transition-colors hover:bg-secondary"
                      >
                        {p.label}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold",
                            p.tone === "red" && "bg-red-500/10 text-red-600 dark:text-red-400",
                            p.tone === "amber" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            p.tone === "blue" && "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          )}
                        >
                          {p.value}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NotificationCenter />

              <div className="ml-1 hidden sm:block">
                <LabBadge />
              </div>

              <div className="relative ml-1.5 border-l border-border pl-2.5">
                <button
                  onClick={() => {
                    const next = !profileOpen;
                    closeAllPopovers();
                    setProfileOpen(next);
                  }}
                  className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-1 transition-colors hover:bg-secondary"
                  title="账户菜单"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[12.5px] font-bold text-primary">
                    {currentAdmin.initials}
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <div className="text-[12.5px] font-semibold text-foreground">{currentAdmin.name}</div>
                    <div className="text-[10.5px] text-muted-foreground">{currentAdmin.role}</div>
                  </div>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground/60 sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl glass-panel-strong p-1.5 shadow-2xl">
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      <LogOut className="size-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <ChainStatusBar />
          <KpiTicker />

          <main className="px-4 py-5 sm:px-6 lg:px-7">
            <PageReveal revealKey={pathname} skeleton={<AdminPageSkeleton />}>
              {children}
            </PageReveal>
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-card shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button
                className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                onClick={() => setMobileOpen(false)}
                aria-label="关闭菜单"
                title="关闭菜单"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
