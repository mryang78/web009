"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 链上资金流向追踪 — 攻击资金路径可视化：节点流图 + 逐跳交易表（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  ArrowRight, AlertTriangle, CheckCircle2, Clock,
  ExternalLink, Search, ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type NodeType = "ATTACKER" | "VICTIM" | "DEX" | "BRIDGE" | "MIXER" | "CLEAN" | "EXCHANGE";
type HopStatus = "CONFIRMED" | "PENDING" | "FROZEN";

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  type: NodeType;
  address: string;
  amountUsd: number;
}

interface FlowHop {
  from: string;
  to: string;
  amountUsd: number;
  txHash: string;
  block: number;
  timestamp: string;
  status: HopStatus;
  protocol: string;
}

interface FlowCase {
  id: string;
  title: string;
  totalLossUsd: number;
  recoveredUsd: number;
  nodes: FlowNode[];
  hops: FlowHop[];
  attackTs: string;
}

// ─── Static mock data ─────────────────────────────────────────────────────────
const CASES: FlowCase[] = [
  {
    id: "case-001",
    title: "重入攻击 — YieldVault 盗取案",
    totalLossUsd: 2_840_000,
    recoveredUsd: 0,
    attackTs: "2026-09-18 03:22 UTC",
    nodes: [
      { id: "n0", label: "攻击者钱包",    sublabel: "资金来源",    type: "ATTACKER", address: "0xd91f...44a2", amountUsd: 2_840_000 },
      { id: "n1", label: "攻击合约",      sublabel: "重入合约",    type: "ATTACKER", address: "0xABc1...fe32", amountUsd: 2_840_000 },
      { id: "n2", label: "YieldVault",   sublabel: "受害协议",    type: "VICTIM",   address: "0x7f3D...29ab", amountUsd: 2_840_000 },
      { id: "n3", label: "Uniswap V3",   sublabel: "代币兑换",    type: "DEX",      address: "0xE592...B87F", amountUsd: 2_780_000 },
      { id: "n4", label: "Stargate Bridge", sublabel: "跨至 BSC", type: "BRIDGE",  address: "0x8731...cc10", amountUsd: 2_650_000 },
      { id: "n5", label: "Tornado Cash", sublabel: "混币",        type: "MIXER",    address: "0x722c...d33f", amountUsd: 2_560_000 },
      { id: "n6", label: "洗白地址 A",    sublabel: "出金",        type: "CLEAN",    address: "0x4491...b77e", amountUsd: 1_280_000 },
      { id: "n7", label: "洗白地址 B",    sublabel: "出金",        type: "CLEAN",    address: "0x9f3C...0021", amountUsd: 1_280_000 },
    ],
    hops: [
      { from: "n0", to: "n1",  amountUsd: 2_840_000, txHash: "0x1a2b...c3d4", block: 21_408_003, timestamp: "03:22:14", status: "CONFIRMED", protocol: "EOA 转账" },
      { from: "n1", to: "n2",  amountUsd: 2_840_000, txHash: "0x2c3d...e4f5", block: 21_408_004, timestamp: "03:22:26", status: "CONFIRMED", protocol: "重入攻击" },
      { from: "n2", to: "n3",  amountUsd: 2_780_000, txHash: "0x3d4e...f5a6", block: 21_408_007, timestamp: "03:22:58", status: "CONFIRMED", protocol: "Uniswap V3" },
      { from: "n3", to: "n4",  amountUsd: 2_650_000, txHash: "0x4e5f...a6b7", block: 21_408_021, timestamp: "03:24:50", status: "CONFIRMED", protocol: "Stargate" },
      { from: "n4", to: "n5",  amountUsd: 2_560_000, txHash: "0x5f6a...b7c8", block: 10_924_441, timestamp: "03:31:17", status: "CONFIRMED", protocol: "Tornado Cash" },
      { from: "n5", to: "n6",  amountUsd: 1_280_000, txHash: "0x6a7b...c8d9", block: 10_924_509, timestamp: "03:58:02", status: "CONFIRMED", protocol: "EOA 转账" },
      { from: "n5", to: "n7",  amountUsd: 1_280_000, txHash: "0x7b8c...d9e0", block: 10_924_510, timestamp: "03:58:14", status: "CONFIRMED", protocol: "EOA 转账" },
    ],
  },
  {
    id: "case-002",
    title: "闪电贷操纵 — PriceFeed 攻击案",
    totalLossUsd: 780_000,
    recoveredUsd: 156_000,
    attackTs: "2026-09-15 11:07 UTC",
    nodes: [
      { id: "n0", label: "攻击者",      sublabel: "发起方",    type: "ATTACKER", address: "0xA1b2...9f3C", amountUsd: 780_000 },
      { id: "n1", label: "AAVE V3",    sublabel: "闪电贷来源", type: "DEX",      address: "0x87870...05B3", amountUsd: 780_000 },
      { id: "n2", label: "目标协议",   sublabel: "价格操纵",   type: "VICTIM",   address: "0x3e44...aa91", amountUsd: 780_000 },
      { id: "n3", label: "Curve",      sublabel: "套利出金",   type: "DEX",      address: "0xbEbc...8BE4", amountUsd: 710_000 },
      { id: "n4", label: "中心化交易所",sublabel: "OKX 出金",  type: "EXCHANGE", address: "0x236F...3f00", amountUsd: 554_000 },
      { id: "n5", label: "冻结资产",   sublabel: "链上冻结",   type: "VICTIM",   address: "0x3e44...aa91", amountUsd: 156_000 },
    ],
    hops: [
      { from: "n0", to: "n1",  amountUsd: 780_000, txHash: "0xaa1b...cc2d", block: 21_380_112, timestamp: "11:07:03", status: "CONFIRMED", protocol: "AAVE 闪电贷" },
      { from: "n1", to: "n2",  amountUsd: 780_000, txHash: "0xbb2c...dd3e", block: 21_380_112, timestamp: "11:07:03", status: "CONFIRMED", protocol: "价格操纵" },
      { from: "n2", to: "n3",  amountUsd: 710_000, txHash: "0xcc3d...ee4f", block: 21_380_113, timestamp: "11:07:15", status: "CONFIRMED", protocol: "Curve" },
      { from: "n3", to: "n4",  amountUsd: 554_000, txHash: "0xdd4e...ff5a", block: 21_380_201, timestamp: "11:14:28", status: "CONFIRMED", protocol: "CEX 入金" },
      { from: "n2", to: "n5",  amountUsd: 156_000, txHash: "0xee5f...aa6b", block: 21_380_198, timestamp: "11:14:02", status: "FROZEN",    protocol: "链上冻结" },
    ],
  },
];

// ─── Node colors ──────────────────────────────────────────────────────────────
const NODE_STYLES: Record<NodeType, { bg: string; border: string; text: string; dot: string }> = {
  ATTACKER: { bg: "bg-red-500/10",     border: "border-red-500/40",     text: "text-red-400",     dot: "bg-red-500" },
  VICTIM:   { bg: "bg-amber-500/10",   border: "border-amber-500/40",   text: "text-amber-400",   dot: "bg-amber-500" },
  DEX:      { bg: "bg-sky-500/10",     border: "border-sky-500/40",     text: "text-sky-400",     dot: "bg-sky-500" },
  BRIDGE:   { bg: "bg-violet-500/10",  border: "border-violet-500/40",  text: "text-violet-400",  dot: "bg-violet-500" },
  MIXER:    { bg: "bg-orange-500/10",  border: "border-orange-500/40",  text: "text-orange-400",  dot: "bg-orange-500" },
  CLEAN:    { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", dot: "bg-emerald-500" },
  EXCHANGE: { bg: "bg-cyan-500/10",    border: "border-cyan-500/40",    text: "text-cyan-400",    dot: "bg-cyan-500" },
};

const TYPE_LABEL: Record<NodeType, string> = {
  ATTACKER: "攻击方", VICTIM: "受害方", DEX: "DEX",
  BRIDGE: "跨链桥", MIXER: "混币器", CLEAN: "洗白地址", EXCHANGE: "CEX",
};

const STATUS_BADGE: Record<HopStatus, { cls: string; label: string }> = {
  CONFIRMED: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "已确认" },
  PENDING:   { cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",       label: "待确认" },
  FROZEN:    { cls: "bg-sky-500/10 text-sky-400 border-sky-500/30",             label: "已冻结" },
};

// ─── Flow diagram: layered SVG ────────────────────────────────────────────────
function FlowDiagram({ flowCase }: { flowCase: FlowCase }) {
  const { nodes, hops } = flowCase;

  // Build a simple left-to-right layered layout
  // Layer assignment: BFS from attacker
  const layers: Map<string, number> = new Map();
  const adj: Map<string, string[]> = new Map();
  hops.forEach(h => {
    if (!adj.has(h.from)) adj.set(h.from, []);
    adj.get(h.from)!.push(h.to);
  });
  // BFS
  const queue: string[] = [];
  nodes.forEach(n => { if (n.type === "ATTACKER" && !hops.find(h => h.to === n.id)) { layers.set(n.id, 0); queue.push(n.id); } });
  if (queue.length === 0) { layers.set(nodes[0].id, 0); queue.push(nodes[0].id); }
  while (queue.length) {
    const cur = queue.shift()!;
    const curLayer = layers.get(cur) ?? 0;
    (adj.get(cur) ?? []).forEach(next => {
      if (!layers.has(next)) { layers.set(next, curLayer + 1); queue.push(next); }
    });
  }
  nodes.forEach(n => { if (!layers.has(n.id)) layers.set(n.id, 0); });

  // Group by layer
  const byLayer: Map<number, string[]> = new Map();
  layers.forEach((layer, id) => {
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(id);
  });
  const maxLayer = Math.max(...Array.from(layers.values()));

  // Compute positions
  const W = 820, H = 320;
  const COLS = maxLayer + 1;
  const colW = W / COLS;
  const pos: Map<string, [number, number]> = new Map();
  byLayer.forEach((ids, layer) => {
    const rowH = H / (ids.length + 1);
    ids.forEach((id, i) => {
      pos.set(id, [colW * layer + colW / 2, rowH * (i + 1)]);
    });
  });

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" style={{ height: H }}>
        {/* Hop arrows */}
        {hops.map((hop, i) => {
          const [x1, y1] = pos.get(hop.from) ?? [0, 0];
          const [x2, y2] = pos.get(hop.to) ?? [0, 0];
          const mx = (x1 + x2) / 2;
          const isFrozen = hop.status === "FROZEN";
          const color = isFrozen ? "oklch(0.65 0.18 220)" : "oklch(0.65 0.2 25 / 0.6)";
          const strokeDash = isFrozen ? "5 3" : undefined;
          return (
            <g key={i}>
              <defs>
                <marker id={`arrow-${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill={color} />
                </marker>
              </defs>
              <path
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={strokeDash}
                markerEnd={`url(#arrow-${i})`}
              />
              {/* Amount label */}
              <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle"
                className="text-[9px]" fontSize={9} fill="oklch(0.7 0 0 / 0.7)">
                ${(hop.amountUsd / 1_000).toFixed(0)}K
              </text>
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map(n => {
          const [cx, cy] = pos.get(n.id) ?? [0, 0];
          const style = NODE_STYLES[n.type];
          const isClean = n.type === "CLEAN" || n.type === "EXCHANGE";
          return (
            <g key={n.id} transform={`translate(${cx}, ${cy})`}>
              <rect x={-52} y={-22} width={104} height={44} rx={8}
                fill={`oklch(0.18 0.02 270)`}
                stroke={isClean ? "oklch(0.55 0.18 150 / 0.5)" : "oklch(0.55 0.18 25 / 0.4)"}
                strokeWidth="1"
              />
              {/* type dot */}
              <circle cx={-38} cy={0} r={4} className={style.dot} fill="currentColor" />
              <text x={-28} y={-6} fontSize={9} fill="oklch(0.75 0 0 / 0.9)" fontWeight="600">{n.label}</text>
              <text x={-28} y={7}  fontSize={8} fill="oklch(0.55 0 0 / 0.7)">{n.sublabel}</text>
              <text x={-28} y={18} fontSize={7.5} fontFamily="monospace" fill="oklch(0.5 0 0 / 0.6)">{n.address}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────
export function FundFlowClient() {
  const [selected, setSelected] = useState<FlowCase>(CASES[0]);
  const [expandedHop, setExpandedHop] = useState<number | null>(null);

  const recoveryPct = selected.totalLossUsd > 0
    ? Math.round((selected.recoveredUsd / selected.totalLossUsd) * 100)
    : 0;

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "安全中心" }, { label: "资金流向追踪" }]} title="链上资金流向追踪" description="攻击资金路径可视化 · 混币追踪 · 跨链跳转分析" />

      {/* Case selector */}
      <div className="mt-5 flex flex-wrap gap-2">
        {CASES.map(c => (
          <button key={c.id}
            onClick={() => setSelected(c)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-left text-[12.5px] transition-all",
              selected.id === c.id
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <div className="font-semibold">{c.title}</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground/60">
              损失 ${(c.totalLossUsd / 1_000_000).toFixed(2)}M · {c.attackTs}
            </div>
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "总损失",    val: `$${(selected.totalLossUsd/1_000_000).toFixed(2)}M`, color: "text-red-400" },
          { label: "追回资产",  val: `$${(selected.recoveredUsd/1_000).toFixed(0)}K`,     color: "text-emerald-400" },
          { label: "追回率",    val: `${recoveryPct}%`,                                   color: recoveryPct > 0 ? "text-sky-400" : "text-muted-foreground/60" },
          { label: "跳转次数",  val: `${selected.hops.length} 跳`,                        color: "text-amber-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-3.5">
            <p className="text-[11px] text-muted-foreground/60">{label}</p>
            <p className={cn("mt-1 text-xl font-bold", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Flow diagram */}
      <div className="mt-4 rounded-2xl border border-border/70 bg-card/65 p-4">
        <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/80">资金流向图</h3>
        <FlowDiagram flowCase={selected} />
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {(Object.entries(NODE_STYLES) as [NodeType, typeof NODE_STYLES[NodeType]][]).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <span className={cn("inline-block size-2 rounded-full", s.dot)} />
              {TYPE_LABEL[type]}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <span className="inline-block h-px w-5 border-t-2 border-dashed border-sky-400/60" />
            已冻结
          </div>
        </div>
      </div>

      {/* Hop table */}
      <div className="mt-4 rounded-2xl border border-border/70 bg-card/65 p-4">
        <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/80">逐跳交易记录</h3>
        <div className="space-y-2">
          {selected.hops.map((hop, i) => {
            const fromNode = selected.nodes.find(n => n.id === hop.from);
            const toNode   = selected.nodes.find(n => n.id === hop.to);
            const badge    = STATUS_BADGE[hop.status];
            const isOpen   = expandedHop === i;
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-secondary/20">
                <button
                  onClick={() => setExpandedHop(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 p-3 text-left text-[12px] hover:bg-secondary/30"
                >
                  <span className="shrink-0 rounded-full bg-secondary/60 px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground/60">
                    #{i + 1}
                  </span>
                  <span className="text-foreground/80 font-medium">{fromNode?.label ?? hop.from}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/40" />
                  <span className="text-foreground/80 font-medium">{toNode?.label ?? hop.to}</span>
                  <span className="ml-2 font-mono text-[11px] text-foreground/60">
                    ${hop.amountUsd.toLocaleString()}
                  </span>
                  <span className={cn("ml-auto flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold", badge.cls)}>
                    {hop.status === "FROZEN" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                    {badge.label}
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="border-t border-border/40 bg-secondary/10 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px]">
                    {[
                      ["协议",   hop.protocol],
                      ["时间",   hop.timestamp],
                      ["区块",   `#${hop.block.toLocaleString()}`],
                      ["TX Hash", hop.txHash],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-muted-foreground/50 w-16 shrink-0">{k}</span>
                        <span className={cn("font-mono text-foreground/70", k === "TX Hash" && "text-[10.5px]")}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
