import { cn } from "@/lib/utils";

export type ProductStatus =
  | "live"
  | "pending"
  | "completed"
  | "failed"
  | "blocked"
  | "reviewing"
  | "risk"
  | "simulation"
  | "experience"
  | "expired"
  | "scheduled";

export const statusStyle: Record<ProductStatus, { label: string; className: string; dot: string }> = {
  live: { label: "进行中", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  pending: { label: "待处理", className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  completed: { label: "已完成", className: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  failed: { label: "失败", className: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  blocked: { label: "已拦截", className: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  reviewing: { label: "审核中", className: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  risk: { label: "检测到风险", className: "border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  simulation: { label: "分析", className: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-muted-foreground", dot: "bg-slate-400" },
  experience: { label: "分析", className: "border-border bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
  expired: { label: "已结束", className: "border-border bg-secondary/60 text-muted-foreground/70", dot: "bg-muted-foreground/50" },
  scheduled: { label: "待发布", className: "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
};

export function StatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  const s = statusStyle[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        s.className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
