"use client";

import { useState } from "react";
import { Search, ScanSearch, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchLookup, searchExamples, type LookupResult } from "@/lib/security-data";
import { threatLevelStyle } from "@/lib/security-data";
import { cn } from "@/lib/utils";

function normalize(v: string) {
  return v.trim().toLowerCase().replace(/^0x/, "").replace(/\.\.\./g, "").replace(/[^a-z0-9]/g, "");
}

export function SecurityHero() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | "not-found" | null>(null);
  const [analyzed, setAnalyzed] = useState("");

  function runAnalysis() {
    const q = query.trim();
    if (!q) return;
    const key = normalize(q);
    const match = Object.entries(searchLookup).find(([k]) => normalize(k).includes(key) || key.includes(normalize(k).slice(0, 8)));
    setAnalyzed(q);
    setResult(match ? match[1] : "not-found");
  }

  return (
    <section className="security-scanline relative overflow-hidden border-b border-border/60 pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="pointer-events-none absolute inset-0 security-grid opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,oklch(0.75_0.13_260_/_14%),transparent_75%)]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-red-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
            </span>
            实时威胁监控
          </span>
          <span className="rounded-full border border-white/12 bg-muted/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-foreground/80">
            分析引擎
          </span>
        </div>

        <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Web3 安全情报
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          实时分析可疑地址、合约、交易和资产流向
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
              type="text"
              placeholder="搜索：钱包地址 / 合约地址 / 交易哈希"
              className="h-12 w-full rounded-xl border border-white/12 bg-card/75 pr-4 pl-10 text-sm text-foreground placeholder:text-foreground0 outline-none transition-colors focus:border-sky-500/50 focus:bg-muted focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <Button
            onClick={runAnalysis}
            size="lg"
            className="h-12 gap-2 rounded-xl bg-sky-500 px-6 text-[15px] font-semibold text-primary-foreground hover:bg-sky-400"
          >
            <ScanSearch className="size-4" />
            分析
          </Button>
        </div>
        <p className="mt-2 text-xs text-foreground0">
          支持搜索，例如 {searchExamples[0]}
        </p>

        {result && (
          <div
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm",
              result === "not-found"
                ? "border-white/12 bg-card/75 text-foreground/80"
                : cn(threatLevelStyle[result.level].bg, "border-border/70 text-foreground/90")
            )}
          >
            {result === "not-found" ? (
              <ShieldQuestion className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
            ) : result.level === "low" ? (
              <ShieldCheck className={cn("mt-0.5 size-4.5 shrink-0", threatLevelStyle[result.level].text)} />
            ) : (
              <ShieldAlert className={cn("mt-0.5 size-4.5 shrink-0", threatLevelStyle[result.level].text)} />
            )}
            <div>
              {result === "not-found" ? (
                <p>
                  未在本地威胁情报库中匹配到「{analyzed}」的记录。可尝试：{searchExamples[0]}
                </p>
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    {result.type} · {analyzed}
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        threatLevelStyle[result.level].bg,
                        threatLevelStyle[result.level].text
                      )}
                    >
                      {threatLevelStyle[result.level].label}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground">{result.label}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
