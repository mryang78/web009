"use client";

import { useRef, useState, type WheelEvent, type MouseEvent as ReactMouseEvent } from "react";
import { ShieldAlert, ZoomIn, ZoomOut, RotateCcw, Waypoints } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import type { AssetFlowNode } from "@/lib/admin/wallet-security-data";
import { walletLabDisclaimer } from "@/config/copy";
import { useThreatFeed } from "@/lib/threat-engine/use-threat-feed";
import { cn } from "@/lib/utils";

const levelStyle: Record<AssetFlowNode["level"], string> = {
  critical: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
  high: "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  safe: "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function AssetFlowsClient({
  nodes,
  edges,
}: {
  nodes: AssetFlowNode[];
  edges: { from: string; to: string; label: string }[];
}) {
  const [selected, setSelected] = useState<AssetFlowNode | null>(null);
  const { rows: threatFeed } = useThreatFeed();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.5, z - e.deltaY * 0.001)));
  }

  function onMouseDown(e: ReactMouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onMouseMove(e: ReactMouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  }
  function onMouseUp() {
    dragRef.current = null;
  }

  function nodeById(id: string) {
    return nodes.find((n) => n.id === id)!;
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "资产与钱包" }, { label: "资产流转" }]}
        title="资产流向分析"
        description="可视化分析资产在钱包、合约与地址之间的流转路径"
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        {walletLabDisclaimer.assetFlows}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-secondary/10">
          <div className="absolute right-3 top-3 z-10 flex gap-1.5">
            <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground" title="放大">
              <ZoomIn className="size-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground" title="缩小">
              <ZoomOut className="size-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground" title="重置">
              <RotateCcw className="size-4" />
            </button>
          </div>
          <div
            className="h-[440px] cursor-grab touch-none select-none active:cursor-grabbing"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div
              className="relative size-full origin-center transition-transform duration-75"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
                {edges.map((e, i) => {
                  const a = nodeById(e.from);
                  const b = nodeById(e.to);
                   if (!a || !b) return null;
                  return (
                    <g key={i}>
                      <line
                        x1={`${a.x}%`}
                        y1={`${a.y}%`}
                        x2={`${b.x}%`}
                        y2={`${b.y}%`}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="text-border"
                        markerEnd="url(#arrow)"
                      />
                      <text
                        x={`${(a.x + b.x) / 2}%`}
                        y={`${(a.y + b.y) / 2 - 1.5}%`}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px]"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" className="fill-border" />
                  </marker>
                </defs>
              </svg>
              {nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border-2 bg-card px-3 py-2 text-center shadow-sm transition-transform hover:scale-105",
                    levelStyle[n.level],
                    selected?.id === n.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className="text-[11.5px] font-semibold">{n.label}</span>
                  <span className="font-mono text-[9.5px] opacity-80">{n.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
            <Waypoints className="size-4" />
            地址详情
          </h3>
          {selected ? (
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-muted-foreground">节点</div>
                <div className="text-[13px] font-semibold text-foreground">{selected.label}</div>
                <div className="font-mono text-[11.5px] text-muted-foreground">{selected.sub}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">资产</div>
                <div className="text-[12.5px] text-foreground">{selected.detail.asset}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">风险</div>
                <div className={cn("mt-1 inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold", levelStyle[selected.level])}>{selected.detail.risk}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">关联事件</div>
                <ul className="space-y-1">
                  {selected.detail.events.map((ev, i) => (
                    <li key={i} className="rounded-lg bg-secondary/20 px-2.5 py-1.5 text-[12px] text-foreground">
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">点击图中的节点查看该地址的资产、风险与关联事件详情。</p>
          )}
        </aside>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-foreground">Security Timeline</h3>
        <p className="mb-3 text-[11.5px] text-muted-foreground">
          Threat Engine 真实检测到的事件流水，与 /soc/dashboard 共用同一份数据
        </p>
        {threatFeed.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            暂无安全事件 —— 前往 攻击路径分析 或钱包安全分析运行一次分析以产生真实检测事件。
          </p>
        ) : (
          <ol className="space-y-3">
            {threatFeed.slice(0, 6).map((t, i) => (
              <li key={i} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-20 shrink-0 font-mono text-muted-foreground">{t.time}</span>
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground">{t.attackType}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground/80">{t.wallet}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
