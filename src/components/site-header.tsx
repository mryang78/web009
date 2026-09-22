"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { Menu, X, ArrowRight, Shield, LayoutDashboard, Layers, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "首页",     href: "#top",      icon: Home },
  { label: "产品体验", href: "#products", icon: Layers },
  { label: "安全后台", href: "/admin",    icon: Shield },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="#top" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <Button asChild size="sm" className="group h-9 gap-2 rounded-full px-4 text-[13px] font-semibold shadow-sm">
            <a href="/admin">
              <LayoutDashboard className="size-3.5" />
              进入后台
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary"
            onClick={() => setOpen(v => !v)}
            aria-label="打开菜单"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-md px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <item.icon className="size-4 text-primary/70" />
                {item.label}
              </a>
            ))}
            <Button asChild size="sm" className="mt-2 w-full gap-2">
              <a href="/admin" onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-3.5" />
                进入后台
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
