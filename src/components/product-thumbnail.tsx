import {
  Wallet,
  ShieldCheck,
  Rocket,
  Gift,
  Droplet,
  Trophy,
  Crown,
  Sparkles,
  Users,
  Newspaper,
  FileText,
  Compass,
  Blocks,
  Search,
  ExternalLink,
} from "lucide-react";
import { accentClass, type AccentTone, type ThumbnailVariant } from "@/lib/products";
import { cn } from "@/lib/utils";

const barHeights = [30, 55, 40, 70, 50, 85, 60];

function TokenCircle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-7 items-center justify-center rounded-full border border-border/70 bg-card/90 text-[9px] font-semibold text-foreground/70 shadow-sm",
        className
      )}
    >
      <Sparkles className="size-3 text-primary" />
    </div>
  );
}

function MiniBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full items-end gap-1", className)}>
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/60 to-primary/15"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function ProductThumbnail({
  variant,
  accent,
  className,
}: {
  variant: ThumbnailVariant;
  accent: AccentTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br p-3",
        accentClass[accent],
        className
      )}
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.15]" />

      {variant === "trading-chart" && (
        <div className="relative flex h-full w-full gap-2">
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-foreground/70">BTC/USDT</span>
              <span className="text-[10px] font-semibold text-success">+2.4%</span>
            </div>
            <MiniBars />
          </div>
          <div className="flex w-9 flex-col justify-center gap-0.5">
            {[70, 55, 40, 30].map((w, i) => (
              <div
                key={`b${i}`}
                className="h-1 rounded-sm bg-success/50"
                style={{ width: `${w}%` }}
              />
            ))}
            {[35, 50, 65].map((w, i) => (
              <div
                key={`s${i}`}
                className="h-1 rounded-sm bg-destructive/45"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {variant === "wallet-grid" && (
        <div className="relative flex h-full w-full flex-col gap-1.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-card/70 px-2 py-1.5">
            <Wallet className="size-3.5 text-primary" />
            <div className="h-1.5 w-16 rounded-full bg-foreground/15" />
            <span className="ml-auto text-[9px] font-semibold text-foreground/60">$ 12,480</span>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {["ETH", "USDT", "SOL"].map((t) => (
              <div key={t} className="flex flex-col justify-center rounded-lg bg-card/60 p-1.5">
                <span className="text-[8px] font-medium text-muted-foreground">{t}</span>
                <div className="mt-1 h-1.5 w-full rounded bg-primary/25" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "token-orbit" && (
        <div className="relative flex size-full items-center justify-center">
          <div className="absolute size-16 rounded-full border border-dashed border-border/70" />
          <TokenCircle className="absolute -top-1 left-1/2 -translate-x-1/2" />
          <TokenCircle className="absolute -bottom-1 left-3" />
          <TokenCircle className="absolute -bottom-1 right-3" />
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Blocks className="size-4" />
          </div>
        </div>
      )}

      {variant === "defi-stats" && (
        <div className="relative flex h-full w-full flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-card/70 px-2 py-1">
              <span className="text-[8px] text-muted-foreground">TVL</span>
              <div className="text-[11px] font-semibold text-foreground/80">$84.2M</div>
            </div>
            <div className="rounded-lg bg-card/70 px-2 py-1">
              <span className="text-[8px] text-muted-foreground">APY</span>
              <div className="text-[11px] font-semibold text-success">12.6%</div>
            </div>
          </div>
          <MiniBars className="flex-1" />
        </div>
      )}

      {variant === "explorer-list" && (
        <div className="relative flex h-full w-full flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md bg-card/60 px-1.5 py-1"
            >
              <div className="flex size-4 items-center justify-center rounded bg-primary/20 text-[7px] font-semibold text-primary">
                #
              </div>
              <div className="h-1.5 flex-1 rounded-full bg-foreground/10" />
              <span className="text-[7px] text-muted-foreground">2s</span>
            </div>
          ))}
        </div>
      )}

      {variant === "market-ticker" && (
        <div className="relative flex h-full w-full flex-col justify-center gap-1.5">
          {["BTC", "ETH", "SOL"].map((t, i) => (
            <div key={t} className="flex items-center justify-between rounded-md bg-card/60 px-2 py-1">
              <span className="text-[10px] font-medium text-foreground/70">{t}</span>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  i === 1 ? "text-destructive/70" : "text-success"
                )}
              >
                {i === 1 ? "-1.2%" : "+2.4%"}
              </span>
            </div>
          ))}
        </div>
      )}

      {variant === "airdrop-burst" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <Gift className="size-8 text-primary/80" />
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute size-1.5 rounded-full bg-primary/50"
              style={{
                transform: `rotate(${i * 60}deg) translate(30px)`,
              }}
            />
          ))}
        </div>
      )}

      {variant === "faucet-drop" && (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5">
          <Droplet className="size-6 text-primary/80" />
          <div className="rounded-full bg-primary/15 px-3 py-1 text-[9px] font-semibold text-primary">
            领取测试币
          </div>
        </div>
      )}

      {variant === "reward-ring" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full border-4 border-primary/25">
            <Trophy className="size-6 text-primary/80" />
          </div>
        </div>
      )}

      {variant === "vip-badge" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-card/70 px-4 py-2.5">
            <Crown className="size-6 text-primary" />
            <div className="h-1.5 w-10 rounded-full bg-foreground/15" />
          </div>
        </div>
      )}

      {variant === "promo-glow" && (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5">
          <div className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold text-primary">
            +20%
          </div>
          <div className="h-1.5 w-20 rounded-full bg-foreground/10" />
        </div>
      )}

      {variant === "referral-network" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <Users className="size-6 text-primary/70" />
          <div className="absolute left-4 top-4 size-2 rounded-full bg-primary/50" />
          <div className="absolute right-4 top-6 size-2 rounded-full bg-primary/40" />
          <div className="absolute bottom-4 left-8 size-2 rounded-full bg-primary/30" />
        </div>
      )}

      {variant === "launch-rocket" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <Rocket className="size-8 -rotate-12 text-primary/80" />
        </div>
      )}

      {variant === "nft-cards" && (
        <div className="relative grid h-full w-full grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-md border border-border/60 bg-card/70"
            >
              <div
                className="flex-1"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, var(--primary) 0%, transparent 130%)"
                      : "linear-gradient(135deg, var(--brand-2) 0%, transparent 130%)",
                  opacity: 0.4,
                }}
              />
              <div className="h-1 w-full bg-foreground/10" />
            </div>
          ))}
        </div>
      )}

      {variant === "news-list" && (
        <div className="relative flex h-full w-full flex-col justify-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Newspaper className="size-3.5 text-primary/70" />
            <div className="h-1.5 w-16 rounded-full bg-foreground/15" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-foreground/10" />
          <div className="h-1.5 w-4/5 rounded-full bg-foreground/10" />
          <div className="h-1.5 w-3/5 rounded-full bg-foreground/10" />
        </div>
      )}

      {variant === "help-docs" && (
        <div className="relative flex h-full w-full flex-col gap-1.5">
          <div className="flex items-center gap-1.5 rounded-md bg-card/70 px-2 py-1">
            <Search className="size-3 text-muted-foreground" />
            <div className="h-1.5 w-14 rounded-full bg-foreground/10" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <FileText className="size-3 text-primary/60" />
              <div
                className="h-1.5 rounded-full bg-foreground/10"
                style={{ width: `${70 - i * 12}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {variant === "risk-score" && (
        <div className="relative flex h-full w-full items-center justify-center gap-3">
          <div className="relative flex size-14 items-center justify-center rounded-full border-4 border-success/40">
            <span className="text-xs font-bold text-success">92</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[9px] text-success">
              <ShieldCheck className="size-3" /> 安全
            </div>
            <div className="h-1.5 w-14 rounded-full bg-foreground/10" />
            <div className="h-1.5 w-10 rounded-full bg-foreground/10" />
          </div>
        </div>
      )}

      {variant === "portal-rings" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute size-16 rounded-full border border-border/60" />
          <div className="absolute size-11 rounded-full border border-border/70" />
          <Compass className="size-5 text-primary/80" />
        </div>
      )}

      {variant === "external-link" && (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-card/80 shadow-sm">
            <ExternalLink className="size-4 text-primary/80" />
          </div>
          <div className="rounded-full border border-dashed border-border/80 bg-card/60 px-2.5 py-0.5 text-[9.5px] font-medium text-muted-foreground">
            外部网站 · 合作入口
          </div>
        </div>
      )}
    </div>
  );
}
