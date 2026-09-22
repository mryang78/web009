import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2, WifiOff, SearchX, ShieldQuestion, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyVariant = "empty" | "loading" | "error" | "no-results" | "analyzing" | "no-activity";

const variantMeta: Record<EmptyVariant, { icon: LucideIcon; title: string; spin?: boolean }> = {
  empty: { icon: Inbox, title: "暂无数据" },
  loading: { icon: Loader2, title: "加载中…", spin: true },
  error: { icon: WifiOff, title: "网络异常，请稍后重试" },
  "no-results": { icon: SearchX, title: "搜索无结果" },
  analyzing: { icon: ShieldQuestion, title: "风险分析中…" },
  "no-activity": { icon: PartyPopper, title: "暂无活动" },
};

export function EmptyState({
  variant = "empty",
  description,
  className,
}: {
  variant?: EmptyVariant;
  description?: string;
  className?: string;
}) {
  const meta = variantMeta[variant];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/[0.06] px-6 py-12 text-center",
        className
      )}
    >
      {/* Geometric tech-frame around the icon — a subtle rotated square +
          dashed ring, rather than a bare icon floating in whitespace. */}
      <div className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-lg border border-border/60" />
        <span className="absolute inset-1 rounded-full border border-dashed border-primary/25" />
        <Icon className={cn("relative size-5 text-muted-foreground/60", meta.spin && "animate-spin")} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{meta.title}</p>
      {description && <p className="max-w-xs text-xs text-muted-foreground/70">{description}</p>}
    </div>
  );
}
