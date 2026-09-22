"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 攻击者地址聚类图谱 — 团伙关联网络 / 行为指纹聚类 / SVG 力导向图（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Network, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClusterType = "REENTRANCY_GANG" | "RUG_PULL_RING" | "MEV_CARTEL" | "MIXER_RELAY";

interface ClusterNode {
  id: string;
  address: string;
  role: string;
  riskScore: number;
  type: "COORDINATOR" | "EXECUTOR" | "RELAY" | "RECEIVER";
  x: number;   // pre-computed SVG position (0-1 normalized)
  y: number;
}

interface ClusterEdge {
  from: string;
  to: string;
  label: string;
  weight: number;   // line thickness multiplier 1-4
  suspicious: boolean;
}

interface AttackerCluster {
  id: ClusterType;
  name: string;
  tagline: string;
  totalLossUsd: number;
  activeAddresses: number;
  lastSeen: string;
  nodes: ClusterNode[];
  edges: ClusterEdge[];
}

// ─── Cluster data ─────────────────────────────────────────────────────────────
const CLUSTERS: AttackerCluster[] = [
  {
    id: "REENTRANCY_GANG",
    name: "重入攻击团伙",
    tagline: "专业化攻击流水线：部署、攻击、洗白三角分工",
    totalLossUsd: 8_400_000,
    activeAddresses: 6,
    lastSeen: "3 小时前",
    nodes: [
      { id: "c", address: "0xd91f...44a2", role: "指挥控制",  riskScore: 98, type: "COORDINATOR", x: 0.50, y: 0.20 },
      { id: "a1",address: "0xABc1...fe32", role: "攻击合约 A", riskScore: 96, type: "EXECUTOR",    x: 0.20, y: 0.50 },
      { id: "a2",address: "0x1f2e...b731", role: "攻击合约 B", riskScore: 94, type: "EXECUTOR",    x: 0.80, y: 0.50 },
      { id: "r1",address: "0x3344...aa01", role: "中继钱包 A", riskScore: 82, type: "RELAY",       x: 0.35, y: 0.78 },
      { id: "r2",address: "0x7788...bb12", role: "中继钱包 B", riskScore: 80, type: "RELAY",       x: 0.65, y: 0.78 },
      { id: "rx",address: "0x4491...b77e", role: "出金地址",   riskScore: 61, type: "RECEIVER",    x: 0.50, y: 0.95 },
    ],
    edges: [
      { from: "c",  to: "a1", label: "部署",   weight: 3, suspicious: true },
      { from: "c",  to: "a2", label: "部署",   weight: 3, suspicious: true },
      { from: "a1", to: "r1", label: "转账",   weight: 4, suspicious: true },
      { from: "a2", to: "r2", label: "转账",   weight: 4, suspicious: true },
      { from: "r1", to: "rx", label: "归集",   weight: 2, suspicious: true },
      { from: "r2", to: "rx", label: "归集",   weight: 2, suspicious: true },
    ],
  },
  {
    id: "RUG_PULL_RING",
    name: "拉盘跑路团伙",
    tagline: "内部人员跨账户协调拉盘，分批出局",
    totalLossUsd: 2_100_000,
    activeAddresses: 5,
    lastSeen: "1 天前",
    nodes: [
      { id: "dev",  address: "0xF1a3...8c20", role: "项目方",    riskScore: 92, type: "COORDINATOR", x: 0.50, y: 0.15 },
      { id: "lp1",  address: "0x9e11...cc01", role: "流动性提供", riskScore: 85, type: "EXECUTOR",    x: 0.20, y: 0.45 },
      { id: "lp2",  address: "0x2b44...dd02", role: "流动性提供", riskScore: 83, type: "EXECUTOR",    x: 0.80, y: 0.45 },
      { id: "pump", address: "0x5f77...ee03", role: "拉盘账户",   riskScore: 88, type: "EXECUTOR",    x: 0.50, y: 0.55 },
      { id: "exit", address: "0x6699...ff04", role: "出局账户",   riskScore: 70, type: "RECEIVER",    x: 0.50, y: 0.88 },
    ],
    edges: [
      { from: "dev",  to: "lp1",  label: "注入流动性", weight: 3, suspicious: true },
      { from: "dev",  to: "lp2",  label: "注入流动性", weight: 3, suspicious: true },
      { from: "dev",  to: "pump", label: "拉盘指令",   weight: 2, suspicious: true },
      { from: "lp1",  to: "exit", label: "移除流动性", weight: 4, suspicious: true },
      { from: "lp2",  to: "exit", label: "移除流动性", weight: 4, suspicious: true },
    ],
  },
];

// ─── Node type styles ─────────────────────────────────────────────────────────
const NODE_TYPE_STYLE = {
  COORDINATOR: { fill: "oklch(0.55 0.22 25)",   stroke: "oklch(0.75 0.22 25)",   r: 18 },
  EXECUTOR:    { fill: "oklch(0.45 0.18 30)",   stroke: "oklch(0.65 0.18 30)",   r: 14 },
  RELAY:       { fill: "oklch(0.45 0.15 50)",   stroke: "oklch(0.65 0.15 50)",   r: 11 },
  RECEIVER:    { fill: "oklch(0.40 0.12 150)",  stroke: "oklch(0.60 0.12 150)",  r: 12 },
};

const SCORE_COLOR = (s: number) =>
  s >= 90 ? "#ef4444" : s >= 70 ? "#f59e0b" : s >= 50 ? "#eab308" : "#22c55e";

// ─── Cluster graph (SVG) ──────────────────────────────────────────────────────
function ClusterGraph({
  cluster,
  selected,
  onSelect,
}: {
  cluster: AttackerCluster;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const W = 420, H = 280;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid bg */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.3 0 0 / 0.15)" strokeWidth="0.5" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} fill="oklch(0.14 0.02 270)" rx="12" />
      <rect width={W} height={H} fill="url(#grid)" rx="12" />

      {/* Edges */}
      {cluster.edges.map((e, i) => {
        const from = cluster.nodes.find(n => n.id === e.from)!;
        const to   = cluster.nodes.find(n => n.id === e.to)!;
        const x1 = from.x * W, y1 = from.y * H;
        const x2 = to.x * W,   y2 = to.y * H;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={e.suspicious ? "oklch(0.65 0.2 25 / 0.5)" : "oklch(0.5 0 0 / 0.3)"}
              strokeWidth={e.weight * 0.7}
              strokeDasharray={e.suspicious ? undefined : "4 2"}
            />
            <text x={mx} y={my - 4} textAnchor="middle" fontSize={8}
              fill="oklch(0.6 0 0 / 0.6)">{e.label}</text>
          </g>
        );
      })}

      {/* Nodes */}
      {cluster.nodes.map(n => {
        const x = n.x * W, y = n.y * H;
        const s = NODE_TYPE_STYLE[n.type];
        const isSelected = selected === n.id;
        return (
          <g key={n.id} transform={`translate(${x}, ${y})`} style={{ cursor: "pointer" }}
            onClick={() => onSelect(n.id)}>
            {isSelected && (
              <circle r={s.r + 5} fill="none" stroke="oklch(0.8 0.2 270 / 0.4)" strokeWidth="1.5"
                className="animate-ping" style={{ animationDuration: "2s" }} />
            )}
            <circle r={s.r} fill={s.fill} stroke={isSelected ? "oklch(0.8 0.2 270)" : s.stroke}
              strokeWidth={isSelected ? 2 : 1} filter="url(#glow)" />
            {/* Risk score ring */}
            <circle r={s.r - 3} fill="none" stroke={SCORE_COLOR(n.riskScore)}
              strokeWidth="2"
              strokeDasharray={`${(n.riskScore / 100) * (2 * Math.PI * (s.r - 3))} 999`}
              transform="rotate(-90)"
            />
            <text y={s.r + 11} textAnchor="middle" fontSize={8}
              fill="oklch(0.7 0 0 / 0.8)" fontWeight="500">{n.role}</text>
            <text y={s.r + 21} textAnchor="middle" fontSize={7}
              fill="oklch(0.5 0 0 / 0.6)" fontFamily="monospace">{n.address}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AttackerClusterPanel() {
  const [activeCluster, setActiveCluster] = useState<AttackerCluster>(CLUSTERS[0]);
  const [selectedNode,  setSelectedNode]  = useState<string | null>(null);

  const nodeDetail = selectedNode
    ? activeCluster.nodes.find(n => n.id === selectedNode)
    : null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <Network className="size-4 text-primary/80" />
        <span className="text-[13px] font-semibold text-foreground/85">攻击者地址聚类图谱</span>
      </div>

      {/* Cluster selector */}
      <div className="flex gap-2 border-b border-border/40 bg-secondary/10 px-4 py-2.5">
        {CLUSTERS.map(c => (
          <button key={c.id}
            onClick={() => { setActiveCluster(c); setSelectedNode(null); }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all",
              activeCluster.id === c.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_220px]">
        {/* Graph */}
        <div className="p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground/60">
            <span className="font-semibold text-foreground/70">{activeCluster.tagline}</span>
          </div>
          <ClusterGraph
            cluster={activeCluster}
            selected={selectedNode}
            onSelect={setSelectedNode}
          />
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground/50">
            {(Object.entries(NODE_TYPE_STYLE) as [keyof typeof NODE_TYPE_STYLE, typeof NODE_TYPE_STYLE[keyof typeof NODE_TYPE_STYLE]][]).map(([k, s]) => (
              <div key={k} className="flex items-center gap-1">
                <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={s.fill} /></svg>
                <span>{k === "COORDINATOR" ? "指挥" : k === "EXECUTOR" ? "执行" : k === "RELAY" ? "中继" : "接收"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="border-t border-border/40 bg-secondary/10 p-3 sm:border-t-0 sm:border-l">
          {/* Cluster stats */}
          <div className="space-y-2 text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground/60">团伙损失</span>
              <span className="font-semibold text-red-400">
                ${(activeCluster.totalLossUsd / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/60">活跃地址</span>
              <span className="font-semibold text-foreground/80">{activeCluster.activeAddresses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/60">最后活跃</span>
              <span className="text-muted-foreground/70">{activeCluster.lastSeen}</span>
            </div>
          </div>

          <div className="my-3 border-t border-border/40" />

          {/* Node detail */}
          {nodeDetail ? (
            <div>
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                节点详情
              </p>
              <div className="space-y-1.5 text-[11.5px]">
                <div>
                  <p className="text-muted-foreground/50">地址</p>
                  <p className="font-mono text-[10.5px] text-foreground/70">{nodeDetail.address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/60">角色</span>
                  <span className="text-foreground/80">{nodeDetail.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/60">风险分</span>
                  <span className={cn("font-bold", nodeDetail.riskScore >= 90 ? "text-red-400" : "text-amber-400")}>
                    {nodeDetail.riskScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/60">类型</span>
                  <span className="text-foreground/70">
                    {nodeDetail.type === "COORDINATOR" ? "指挥节点" : nodeDetail.type === "EXECUTOR" ? "执行节点" : nodeDetail.type === "RELAY" ? "中继节点" : "接收节点"}
                  </span>
                </div>
              </div>
              {/* Edges from this node */}
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] text-muted-foreground/40">关联边</p>
                {activeCluster.edges
                  .filter(e => e.from === nodeDetail.id || e.to === nodeDetail.id)
                  .map((e, i) => {
                    const other = e.from === nodeDetail.id
                      ? activeCluster.nodes.find(n => n.id === e.to)
                      : activeCluster.nodes.find(n => n.id === e.from);
                    const dir = e.from === nodeDetail.id ? "→" : "←";
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground/60">
                        <span>{dir}</span>
                        <span className="font-mono text-[10px]">{other?.address}</span>
                        <span className="text-amber-400/70">{e.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center text-[11px] text-muted-foreground/40 py-4">
              点击图谱节点查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
