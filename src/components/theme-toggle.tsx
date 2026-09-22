"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "切换为浅色模式" : "切换为深色模式"}
      title={isDark ? "切换为浅色模式" : "切换为深色模式"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      <Sun className={cn("size-4 transition-all", isDark ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
      <Moon
        className={cn(
          "absolute size-4 transition-all",
          isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      />
    </button>
  );
}
