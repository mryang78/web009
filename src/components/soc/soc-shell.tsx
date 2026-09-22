"use client";

import Link from "@/components/app-link";
import { usePathname } from "@/lib/navigation";
import {
  ShieldHalf,
  LayoutDashboard,
  BadgeCheck,
  Workflow,
  BookOpenText,
  BellRing,
  ArrowLeft,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SimulationOnlyTag } from "@/components/soc/badges";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/soc", label: "安全展厅", icon: ShieldHalf, exact: true },
  { href: "/soc/dashboard", label: "态势看板", icon: LayoutDashboard },
  { href: "/soc/approvals", label: "授权分析器", icon: BadgeCheck },
  { href: "/soc/attack-chain", label: "攻击链分析", icon: Workflow },
  { href: "/soc/attack-library", label: "攻击案例库", icon: BookOpenText },
  { href: "/soc/alerts", label: "告警与规则", icon: BellRing },
  { href: "/soc/auto-scan", label: "自动扫描", icon: Radar },
];

export function SocShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="security-grid min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            返回首页
          </Link>
          <div className="mx-1 h-4 w-px bg-accent/60" />
          <Link href="/soc" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <ShieldHalf className="size-4" />
            </span>
            <span className="text-[14px] font-semibold tracking-tight text-foreground">
              全链路安全运营平台
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    active ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2"><ThemeToggle /><SimulationOnlyTag /></div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/50 px-4 py-2 lg:hidden">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  active ? "bg-accent/60 text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-border/70 px-4 py-6 text-center text-[12px] text-muted-foreground sm:px-6 lg:px-8">
        本平台所有钱包、资产、签名、授权与攻击数据均为实时分析数据，仅用于安全研究与产品体验，，不产生真实资产变动。
      </footer>
    </div>
  );
}
