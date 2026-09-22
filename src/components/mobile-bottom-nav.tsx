"use client";

import { Home, LayoutGrid, ListFilter, LayoutDashboard } from "lucide-react";

const items = [
  { label: "首页", href: "#top", icon: Home },
  { label: "产品", href: "#products", icon: LayoutGrid },
  { label: "分类", href: "#category-filter", icon: ListFilter },
  { label: "后台", href: "#matrix", icon: LayoutDashboard },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors active:text-primary"
          >
            <Icon className="size-5" />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
