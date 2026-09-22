"use client";

import { useEffect, useState } from "react";
import { threatActivitySeed, threatActivityPool, threatLevelStyle, type ThreatEvent, type ThreatLevel } from "@/lib/security-data";
import { cn } from "@/lib/utils";

const LEVEL_CYCLE: ThreatLevel[] = ["critical", "high", "medium", "low"];

function nextTime(prev: string) {
  const [h, m, s] = prev.split(":").map(Number);
  const total = h * 3600 + m * 60 + s + Math.floor(Math.random() * 40) + 10;
  const hh = Math.floor(total / 3600) % 24;
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return [hh, mm, ss].map((v) => String(v).padStart(2, "0")).join(":");
}

export function ThreatActivityFeed() {
  const [events, setEvents] = useState<ThreatEvent[]>(threatActivitySeed);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setEvents((prev) => {
        const title = threatActivityPool[i % threatActivityPool.length];
        const level = LEVEL_CYCLE[i % LEVEL_CYCLE.length];
        i += 1;
        const time = nextTime(prev[0].time);
        const next: ThreatEvent = { time, title, level };
        return [next, ...prev].slice(0, 9);
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">实时安全事件流</h2>
        <span className="text-xs text-foreground0">Threat Activity</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          实时
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card/65">
        <ul className="divide-y divide-white/[0.06]">
          {events.map((e, idx) => {
            const s = threatLevelStyle[e.level];
            return (
              <li key={`${e.time}-${e.title}-${idx}`} className="flex items-center gap-3.5 px-4 py-3 sm:px-5">
                <span className="w-[68px] shrink-0 font-mono text-[12.5px] tabular-nums text-foreground0">
                  {e.time}
                </span>
                <span className={cn("size-2 shrink-0 rounded-full", s.dot, idx === 0 && "animate-pulse")} />
                <span className="flex-1 truncate text-[13.5px] text-foreground/90">{e.title}</span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", s.bg, s.text)}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
