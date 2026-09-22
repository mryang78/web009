import { cn } from "@/lib/utils";

// English data-model keys (e.g. OpsStatus) are translated for display here so
// every call site can keep comparing against the stable English key while
// the UI always renders Chinese.
export const labelOverride: Record<string, string> = {
  Active: "运行中",
  Degraded: "性能下降",
  Maintenance: "维护中",
  Offline: "离线",
};

export function statusLabel(status: string): string {
  return labelOverride[status] ?? status;
}

// Translucent dark base + a hairline glowing border in the status tone,
// instead of a flat saturated color block — reads as an instrument-panel
// indicator rather than a badge.
const styles: Record<string, string> = {
  // ops status
  Active: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400 shadow-[0_0_12px_-4px_theme(colors.emerald.400/50%)]",
  Degraded: "border-amber-400/25 bg-amber-400/[0.07] text-amber-400 shadow-[0_0_12px_-4px_theme(colors.amber.400/50%)]",
  Maintenance: "border-sky-400/25 bg-sky-400/[0.07] text-sky-400 shadow-[0_0_12px_-4px_theme(colors.sky.400/50%)]",
  Offline: "border-red-400/25 bg-red-400/[0.07] text-red-400 shadow-[0_0_12px_-4px_theme(colors.red.400/50%)]",
  // zh generic
  已上线: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400 shadow-[0_0_12px_-4px_theme(colors.emerald.400/50%)]",
  进行中: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400 shadow-[0_0_12px_-4px_theme(colors.emerald.400/50%)]",
  正常: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400 shadow-[0_0_12px_-4px_theme(colors.emerald.400/50%)]",
  在线: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400 shadow-[0_0_12px_-4px_theme(colors.emerald.400/50%)]",
  待审核: "border-amber-400/25 bg-amber-400/[0.07] text-amber-400 shadow-[0_0_12px_-4px_theme(colors.amber.400/50%)]",
  审核中: "border-amber-400/25 bg-amber-400/[0.07] text-amber-400 shadow-[0_0_12px_-4px_theme(colors.amber.400/50%)]",
  监控中: "border-amber-400/25 bg-amber-400/[0.07] text-amber-400 shadow-[0_0_12px_-4px_theme(colors.amber.400/50%)]",
  定时发布: "border-sky-400/25 bg-sky-400/[0.07] text-sky-400 shadow-[0_0_12px_-4px_theme(colors.sky.400/50%)]",
  已排期: "border-sky-400/25 bg-sky-400/[0.07] text-sky-400 shadow-[0_0_12px_-4px_theme(colors.sky.400/50%)]",
  已下线: "border-border/60 bg-secondary/40 text-muted-foreground",
  已结束: "border-border/60 bg-secondary/40 text-muted-foreground",
  已下架: "border-border/60 bg-secondary/40 text-muted-foreground",
  离线: "border-border/60 bg-secondary/40 text-muted-foreground",
  VIP: "border-violet-400/25 bg-violet-400/[0.07] text-violet-400 shadow-[0_0_12px_-4px_theme(colors.violet.400/50%)]",
  活跃: "border-blue-400/25 bg-blue-400/[0.07] text-blue-400 shadow-[0_0_12px_-4px_theme(colors.blue.400/50%)]",
  风险: "border-orange-400/25 bg-orange-400/[0.07] text-orange-400 shadow-[0_0_12px_-4px_theme(colors.orange.400/50%)]",
  封禁: "border-red-400/25 bg-red-400/[0.07] text-red-400 shadow-[0_0_12px_-4px_theme(colors.red.400/50%)]",
};

// Statuses that should show a pulsing "live" indicator
const ACTIVE_STATUSES = new Set([
  "Active", "已上线", "进行中", "正常", "在线", "活跃",
]);

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const isActive = ACTIVE_STATUSES.has(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap backdrop-blur-sm",
        styles[status] ?? "border-border/60 bg-secondary/40 text-muted-foreground",
        className
      )}
    >
      {isActive ? (
        /* Animated breathing dot for live/operational states */
        <span className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />
      )}
      {labelOverride[status] ?? status}
    </span>
  );
}
