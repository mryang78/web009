"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, AlertTriangle, Info, Zap } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
type CallType = "CALL" | "DELEGATECALL" | "STATICCALL" | "CREATE" | "CREATE2" | "SELFDESTRUCT";
type CallStatus = "SUCCESS" | "REVERT" | "OUT_OF_GAS";

interface CallNode {
  id: string;
  type: CallType;
  from: string;
  to: string;
  func: string;            // 函数签名
  value?: string;          // ETH value (if any)
  gasUsed: number;
  status: CallStatus;
  danger?: "CRITICAL" | "HIGH" | "MEDIUM"; // 高危标注
  dangerReason?: string;
  children?: CallNode[];
}

// ─── Static call tree (模拟典型 Reentrancy 攻击调用栈) ───────────────────
const CALL_TREE: CallNode = {
  id: "root",
  type: "CALL",
  from: "0xAttacker...d91f",
  to:   "0xVictimPool...4a2c",
  func: "withdraw(uint256 amount)",
  value: "0.0 ETH",
  gasUsed: 148_320,
  status: "SUCCESS",
  children: [
    {
      id: "c1",
      type: "CALL",
      from: "0xVictimPool...4a2c",
      to:   "0xAttacker...d91f",
      func: "receive() [fallback]",
      value: "1.5 ETH",
      gasUsed: 82_441,
      status: "SUCCESS",
      danger: "CRITICAL",
      dangerReason: "Reentrancy — receive() 在 state 更新前被触发，攻击者重入 withdraw()",
      children: [
        {
          id: "c1-1",
          type: "CALL",
          from: "0xAttacker...d91f",
          to:   "0xVictimPool...4a2c",
          func: "withdraw(uint256 amount)",
          value: "0.0 ETH",
          gasUsed: 61_209,
          status: "SUCCESS",
          danger: "CRITICAL",
          dangerReason: "第二次重入 withdraw() — balances[msg.sender] 尚未归零",
          children: [
            {
              id: "c1-1-1",
              type: "CALL",
              from: "0xVictimPool...4a2c",
              to:   "0xAttacker...d91f",
              func: "receive() [fallback]",
              value: "1.5 ETH",
              gasUsed: 38_102,
              status: "SUCCESS",
              danger: "CRITICAL",
              dangerReason: "第三次重入 — gas 耗尽后攻击链自然终止",
              children: [
                {
                  id: "c1-1-1-1",
                  type: "CALL",
                  from: "0xAttacker...d91f",
                  to:   "0xVictimPool...4a2c",
                  func: "withdraw(uint256 amount)",
                  value: "0.0 ETH",
                  gasUsed: 2_100,
                  status: "OUT_OF_GAS",
                  danger: "MEDIUM",
                  dangerReason: "Gas 耗尽，重入链终止（Out of Gas）",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "c2",
      type: "CALL",
      from: "0xVictimPool...4a2c",
      to:   "0xLiquidityToken...8b3e",
      func: "balanceOf(address)",
      gasUsed: 3_204,
      status: "SUCCESS",
    },
    {
      id: "c3",
      type: "DELEGATECALL",
      from: "0xVictimPool...4a2c",
      to:   "0xProxyImpl...cc71",
      func: "_updateReserves(uint112,uint112)",
      gasUsed: 8_810,
      status: "SUCCESS",
      danger: "HIGH",
      dangerReason: "DELEGATECALL 到可升级 Proxy — 若 implementation 被替换可造成存储污染",
    },
    {
      id: "c4",
      type: "STATICCALL",
      from: "0xVictimPool...4a2c",
      to:   "0xPriceOracle...1f4d",
      func: "getPrice(address)",
      gasUsed: 4_422,
      status: "SUCCESS",
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const CALL_TYPE_COLORS: Record<CallType, string> = {
  CALL:         "text-sky-400  border-sky-400/40  bg-sky-400/8",
  DELEGATECALL: "text-violet-400 border-violet-400/40 bg-violet-400/8",
  STATICCALL:   "text-slate-400 border-slate-400/40 bg-slate-400/8",
  CREATE:       "text-emerald-400 border-emerald-400/40 bg-emerald-400/8",
  CREATE2:      "text-teal-400 border-teal-400/40 bg-teal-400/8",
  SELFDESTRUCT: "text-red-500 border-red-500/40 bg-red-500/10",
};

const STATUS_COLORS: Record<CallStatus, string> = {
  SUCCESS:     "text-emerald-400",
  REVERT:      "text-red-400",
  OUT_OF_GAS:  "text-amber-400",
};

const DANGER_CONFIG = {
  CRITICAL: { color: "border-l-red-500 bg-red-500/[0.07] shadow-[inset_0_0_20px_-12px_theme(colors.red.500/60%)]", badge: "bg-red-500/15 text-red-400", icon: AlertTriangle },
  HIGH:     { color: "border-l-amber-500 bg-amber-500/5", badge: "bg-amber-500/15 text-amber-400", icon: AlertTriangle },
  MEDIUM:   { color: "border-l-yellow-500 bg-yellow-500/5", badge: "bg-yellow-500/15 text-yellow-400", icon: Info },
};

// ─── Single Call Row ─────────────────────────────────────────────────────
function CallRow({ node, depth }: { node: CallNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const dangerCfg = node.danger ? DANGER_CONFIG[node.danger] : null;
  const DangerIcon = dangerCfg?.icon;

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-start gap-1.5 rounded-md py-1 pr-2 text-[11.5px] transition-colors hover:bg-white/3",
          dangerCfg && `border-l-2 pl-2 ${dangerCfg.color}`,
          !dangerCfg && "pl-2"
        )}
        style={{ marginLeft: `${depth * 18}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className={cn("mt-0.5 shrink-0", !hasChildren && "invisible")}
        >
          {expanded
            ? <ChevronDown className="size-3 text-muted-foreground/60" />
            : <ChevronRight className="size-3 text-muted-foreground/60" />}
        </button>

        {/* Call type badge */}
        <span className={cn(
          "mt-0.5 shrink-0 rounded border px-1.5 py-px font-data text-[9px] font-bold",
          CALL_TYPE_COLORS[node.type]
        )}>
          {node.type}
        </span>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="font-data text-[10.5px] text-muted-foreground/60 truncate max-w-[90px]">{node.from}</span>
            <span className="text-muted-foreground/30">→</span>
            <span className="font-data text-[10.5px] text-sky-300/80 truncate max-w-[90px]">{node.to}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-semibold text-foreground/85 truncate">{node.func}</span>
            {node.value && node.value !== "0.0 ETH" && (
              <span className="flex items-center gap-0.5 text-amber-300/80">
                <Zap className="size-2.5" />{node.value}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2.5">
            <span className={cn("font-data text-[10px]", STATUS_COLORS[node.status])}>
              {node.status}
            </span>
            <span className="text-[10px] text-muted-foreground/40">
              gas {node.gasUsed.toLocaleString()}
            </span>
            {node.danger && dangerCfg && DangerIcon && (
              <span className={cn("flex items-center gap-1 rounded px-1.5 py-px text-[9.5px] font-semibold", dangerCfg.badge)}>
                <DangerIcon className="size-2.5" />{node.danger}
              </span>
            )}
          </div>

          {/* Danger reason */}
          {node.dangerReason && (
            <p className="mt-1 text-[10.5px] text-muted-foreground/70 italic">{node.dangerReason}</p>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && node.children?.map((child) => (
        <CallRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── Summary stats ───────────────────────────────────────────────────────
function countNodes(node: CallNode): { total: number; critical: number; high: number; delegatecalls: number } {
  let total = 1, critical = 0, high = 0, delegatecalls = 0;
  if (node.danger === "CRITICAL") critical++;
  if (node.danger === "HIGH") high++;
  if (node.type === "DELEGATECALL") delegatecalls++;
  for (const child of node.children ?? []) {
    const sub = countNodes(child);
    total += sub.total;
    critical += sub.critical;
    high += sub.high;
    delegatecalls += sub.delegatecalls;
  }
  return { total, critical, high, delegatecalls };
}

// ─── Main panel ─────────────────────────────────────────────────────────
export function CallTracePanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const stats = countNodes(CALL_TREE);
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[12.5px] font-semibold text-foreground/80">EVM Call Stack Trace</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            交易内部调用路径 · {stats.total} 个调用帧 · 重入深度 ×3
          </p>
        </div>
        <button
          onClick={() => setExpandAll((v) => !v)}
          className="rounded-lg border border-border/60 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {expandAll ? "折叠全部" : "展开全部"}
        </button>
      </div>

      {/* Stat pills */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-muted/60 px-3 py-1 text-[10.5px] font-medium text-muted-foreground">
          总调用 <span className="text-foreground">{stats.total}</span>
        </span>
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10.5px] font-semibold text-red-400">
          CRITICAL <span className="ml-0.5 text-red-300">{stats.critical}</span>
        </span>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10.5px] font-semibold text-amber-400">
          HIGH <span className="ml-0.5 text-amber-300">{stats.high}</span>
        </span>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10.5px] font-semibold text-violet-400">
          DELEGATECALL <span className="ml-0.5 text-violet-300">{stats.delegatecalls}</span>
        </span>
      </div>

      {/* TX hash row */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/40 bg-black/20 px-3 py-2">
        <span className="text-[10px] text-muted-foreground/50">TX</span>
        <span className="font-data text-[10.5px] text-sky-300/70">
          0x{snapshot.scenario.id.replace(/-/g, "").slice(0, 8)}...a4f2b8c1e9d3
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/40">
          Block #{(19_847_210 + snapshot.simulation.currentStepIndex * 3).toLocaleString()}
        </span>
      </div>

      {/* Call tree */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-border/40 bg-black/25 p-3">
        <div className="min-w-[560px] space-y-0.5" key={expandAll ? "expand" : "collapse"}>
          <CallRow node={CALL_TREE} depth={0} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/40 pt-3">
        {(["CALL", "DELEGATECALL", "STATICCALL"] as CallType[]).map((t) => (
          <span key={t} className={cn("flex items-center gap-1 text-[10px]", CALL_TYPE_COLORS[t].split(" ")[0])}>
            <span className={cn("size-1.5 rounded-full", CALL_TYPE_COLORS[t].split(" ")[2].replace("/8", "/50"))} />
            {t}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/40">
          点击 ▶ / ▼ 折叠子调用帧
        </span>
      </div>
    </div>
  );
}
