import { CheckCircle2, Megaphone, Sparkles } from "lucide-react";

/**
 * A thin "operations trace" strip — announcement + system status + version —
 * that real SaaS products almost always show somewhere. Purely decorative
 * mock content, but it signals "this product is operated", not a static mockup.
 */
export function SystemStatusBar({
  announcement,
  version = "v2.4.1",
  updatedAgo = "2 分钟前",
}: {
  announcement?: string;
  version?: string;
  updatedAgo?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 bg-secondary/10 px-4 py-2 text-[12px] text-muted-foreground sm:px-6 lg:px-8">
      {announcement && (
        <span className="flex items-center gap-1.5">
          <Megaphone className="size-3.5 text-primary" />
          {announcement}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-emerald-500" />
        全部系统运行正常
        <span className="text-muted-foreground/60">· 最后更新 {updatedAgo}</span>
      </span>
      <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/70">
        <Sparkles className="size-3 text-primary/70" />
        {version}
      </span>
    </div>
  );
}
