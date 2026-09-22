"use client";
// ────────────────────────────────────────────────────────────────────────────
// 动态资金流向图 — SVG 节点 + 流动动画
// ────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

interface FlowNode {
  id: string;
  label: string;
  sub: string;
  role: "victim" | "contract" | "mixer" | "bridge" | "exchange" | "blocked";
  amount?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
  active: boolean;
  blocked?: boolean;
}

function buildGraph(snap: ScenarioPlayerSnapshot): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const { wallet, approval, assetMovement, simulation } = snap;
  const isBlocked = simulation.status === "BLOCKED";
  const amount = assetMovement
    ? `${assetMovement.amount.toLocaleString()} ${assetMovement.symbol}`
    : approval?.requestedAmount ?? "?";
  const eventsCount = simulation.events.length;
  const started = eventsCount > 0;
  const approvalDone = simulation.events.some(e => e.type === "APPROVAL_ANALYZED");
  const movementDone = simulation.events.some(e => e.type === "ASSET_MOVEMENT_SIMULATED");

  const nodes: FlowNode[] = [
    {
      id: "victim",
      label: "受害钱包",
      sub: wallet.address.slice(0, 6) + "…" + wallet.address.slice(-4),
      role: "victim",
      amount: `${wallet.ethBalance} ETH`,
    },
    {
      id: "contract",
      label: "恶意合约",
      sub: approval?.spenderAddress?.slice(0, 6) + "…" ?? "0xSPEND…",
      role: "contract",
    },
    isBlocked
      ? { id: "blocked", label: "安全引擎拦截", sub: "交易已撤销", role: "blocked" as const }
      : {
          id: "mixer",
          label: "混币器",
          sub: "Tornado.cash",
          role: "mixer" as const,
          amount,
        },
    ...(!isBlocked ? [
      { id: "bridge", label: "跨链桥", sub: "Stargate / Hop", role: "bridge" as const },
      { id: "exchange", label: "交易所热钱包", sub: "Binance Deposit", role: "exchange" as const },
    ] : []),
  ];

  const edges: FlowEdge[] = [
    { from: "victim", to: "contract", label: "授权 (Approval)", active: approvalDone || started, blocked: false },
    isBlocked
      ? { from: "contract", to: "blocked", label: "提取尝试", active: movementDone || approvalDone, blocked: true }
      : { from: "contract", to: "mixer", label: amount, active: movementDone, blocked: false },
    ...(!isBlocked ? [
      { from: "mixer", to: "bridge", label: "混淆转移", active: movementDone },
      { from: "bridge", to: "exchange", label: "跨链套现", active: movementDone },
    ] : []),
  ];

  return { nodes, edges };
}

const ROLE_STYLE: Record<FlowNode["role"], { bg: string; border: string; text: string; icon: string }> = {
  victim:   { bg: "fill-sky-900/60",     border: "stroke-sky-400",     text: "#7dd3fc", icon: "👛" },
  contract: { bg: "fill-red-900/60",     border: "stroke-red-400",     text: "#f87171", icon: "⚠️" },
  mixer:    { bg: "fill-purple-900/60",  border: "stroke-purple-400",  text: "#c084fc", icon: "🌀" },
  bridge:   { bg: "fill-amber-900/60",   border: "stroke-amber-400",   text: "#fbbf24", icon: "🌉" },
  exchange: { bg: "fill-emerald-900/60", border: "stroke-emerald-400", text: "#34d399", icon: "🏦" },
  blocked:  { bg: "fill-green-900/60",   border: "stroke-green-400",   text: "#4ade80", icon: "🛡️" },
};

// ── SVG 布局常量 ──
const NODE_W  = 120;
const NODE_H  = 64;
const H_GAP   = 100;
const SVG_PY  = 40;

export function FundFlowSankey({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [tick, setTick] = useState(0);

  // 每 200ms 更新 tick → 驱动流动动画偏移
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 200);
    return () => clearInterval(t);
  }, []);

  const { nodes, edges } = buildGraph(snapshot);

  const totalW = nodes.length * NODE_W + (nodes.length - 1) * H_GAP;
  const svgW   = totalW + 40;
  const svgH   = NODE_H + SVG_PY * 2 + 40;

  // ── 每个节点的中心坐标 ──
  const cx = (i: number) => 20 + i * (NODE_W + H_GAP) + NODE_W / 2;
  const cy = () => SVG_PY + NODE_H / 2;

  const nodeIndex = Object.fromEntries(nodes.map((n, i) => [n.id, i]));

  return (
    <div className="glass-panel overflow-hidden rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-foreground/80">资金流向图</h3>
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
          {snapshot.simulation.status === "BLOCKED" ? "✓ 已拦截" : snapshot.simulation.events.length > 0 ? "流动中" : "等待执行"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="min-w-full"
          style={{ background: "transparent" }}
        >
          <defs>
            {/* 流动虚线动画 */}
            <style>{`
              .flow-dash { stroke-dasharray: 8 6; animation: flow-anim 1.2s linear infinite; }
              .flow-dash-blocked { stroke-dasharray: 6 4; animation: flow-anim-rev 0.8s linear infinite; }
              @keyframes flow-anim { to { stroke-dashoffset: -28; } }
              @keyframes flow-anim-rev { to { stroke-dashoffset: 28; } }
            `}</style>
            {/* 发光滤镜 */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* 节点脉冲动画 */}
            <style>{`
              .node-pulse { animation: node-pulse 2s ease-in-out infinite; }
              @keyframes node-pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
            `}</style>
          </defs>

          {/* 渲染边 */}
          {edges.map((edge, i) => {
            const fi = nodeIndex[edge.from];
            const ti = nodeIndex[edge.to];
            if (fi === undefined || ti === undefined) return null;

            const x1 = cx(fi) + NODE_W / 2 - 2;
            const x2 = cx(ti) - NODE_W / 2 + 2;
            const y  = cy() + (i % 2 === 0 ? 0 : 8); // slight offset for readability
            const midX = (x1 + x2) / 2;
            const path = `M ${x1} ${cy()} C ${midX} ${cy()} ${midX} ${y} ${x2} ${cy()}`;

            const edgeColor = edge.blocked ? "#4ade80" : edge.active ? "#818cf8" : "#334155";
            const strokeW   = edge.active ? 2.5 : 1.5;

            return (
              <g key={i}>
                {/* 底层静态线 */}
                <path d={path} fill="none" stroke={edgeColor} strokeWidth={strokeW} opacity={0.35} />
                {/* 流动动画层 */}
                {edge.active && (
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={strokeW}
                    opacity={0.9}
                    className={edge.blocked ? "flow-dash-blocked" : "flow-dash"}
                    filter="url(#glow)"
                  />
                )}
                {/* 边标签 */}
                <text
                  x={midX}
                  y={cy() - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill={edge.active ? edgeColor : "#475569"}
                  fontFamily="monospace"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* 渲染节点 */}
          {nodes.map((node, i) => {
            const s   = ROLE_STYLE[node.role];
            const x   = 20 + i * (NODE_W + H_GAP);
            const y   = SVG_PY;
            const isActive = edges.some(e => (e.from === node.id || e.to === node.id) && e.active);

            return (
              <g key={node.id} className={isActive ? "node-pulse" : ""}>
                {/* 发光外圈 */}
                {isActive && (
                  <rect
                    x={x - 4} y={y - 4}
                    width={NODE_W + 8} height={NODE_H + 8}
                    rx={14} ry={14}
                    fill="none"
                    stroke={s.border.replace("stroke-", "").replace(/-.+/, "")}
                    strokeWidth={1}
                    opacity={0.2 + (tick % 5) * 0.04}
                    filter="url(#glow)"
                  />
                )}
                {/* 节点背景 */}
                <rect
                  x={x} y={y}
                  width={NODE_W} height={NODE_H}
                  rx={10} ry={10}
                  className={s.bg}
                  stroke={s.border.includes("stroke-") ? undefined : s.border}
                  strokeWidth={isActive ? 1.5 : 1}
                  fill="rgba(10,14,20,0.7)"
                />
                {/* 左边角色色条 */}
                <rect x={x} y={y} width={4} height={NODE_H} rx={2} fill={s.text} opacity={0.8} />

                {/* 图标 */}
                <text x={x + 16} y={y + 24} fontSize="14" dominantBaseline="middle">{node.role === "blocked" ? "🛡️" : ROLE_STYLE[node.role].icon}</text>

                {/* 主标签 */}
                <text
                  x={x + 32} y={y + 20}
                  fontSize="10.5"
                  fontWeight="600"
                  fill={s.text}
                  fontFamily="sans-serif"
                >
                  {node.label}
                </text>
                {/* 地址/副标题 */}
                <text
                  x={x + 32} y={y + 34}
                  fontSize="9"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {node.sub}
                </text>
                {/* 金额 */}
                {node.amount && (
                  <text
                    x={x + 32} y={y + 50}
                    fontSize="9"
                    fill={s.text}
                    opacity={0.7}
                    fontFamily="monospace"
                  >
                    {node.amount}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {(["victim","contract","mixer","bridge","exchange","blocked"] as FlowNode["role"][]).map(role => {
          const s = ROLE_STYLE[role];
          const labels: Record<FlowNode["role"], string> = {
            victim: "受害钱包", contract: "恶意合约", mixer: "混币器",
            bridge: "跨链桥", exchange: "交易所", blocked: "已拦截"
          };
          return (
            <div key={role} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block size-2 rounded-sm" style={{ background: s.text, opacity: 0.8 }} />
              {labels[role]}
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
          <span className="inline-block h-px w-5 border-t-2 border-dashed border-indigo-400 opacity-60" />
          流动中
        </div>
      </div>
    </div>
  );
}
