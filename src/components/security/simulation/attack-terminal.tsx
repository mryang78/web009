"use client";
// ────────────────────────────────────────────────────────────────────────────
// 攻击执行终端 — 区块链实时日志流
// ────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { Terminal, Wifi, Copy, CheckCheck, Radio } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

interface LogLine {
  id: number;
  ts: string;
  block: number;
  level: "INFO" | "WARN" | "CRIT" | "OK" | "TX";
  chain: string;
  msg: string;
  hash?: string;
}

// ── 固定数字种子，保证每次 id 唯一 ──
let _uid = 1;
function uid() { return _uid++; }

// ── 随机 tx hash ──
function fakeHash() {
  const hex = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 40; i++) h += hex[Math.floor(Math.random() * 16)];
  return h;
}

// ── 从快照派生初始日志 ──
function snapshotToLogs(snap: ScenarioPlayerSnapshot): LogLine[] {
  const { simulation, wallet, approval, assetMovement } = snap;
  const chain = snap.scenario.chain ?? "ETH";
  const startBlock = 19_847_100 + Math.floor(Math.random() * 200);
  const lines: LogLine[] = [];

  lines.push({
    id: uid(), ts: fmtTime(0), block: startBlock,
    level: "INFO", chain,
    msg: `Simulation Engine 初始化 · 场景: ${snap.scenario.nameZh ?? snap.scenario.name}`,
  });
  lines.push({
    id: uid(), ts: fmtTime(1), block: startBlock + 1,
    level: "INFO", chain,
    msg: `目标钱包加载完成 · ${wallet.address}`,
  });

  simulation.events.forEach((e, i) => {
    const block = startBlock + 2 + i;
    let level: LogLine["level"] = "INFO";
    let msg = e.title;
    let hash: string | undefined;

    if (e.type === "APPROVAL_REQUESTED") {
      level = "WARN";
      msg = `检测到授权请求 · spender: ${approval?.spenderAddress ?? "0xSPENDER"} · amount: ${approval?.requestedAmount ?? "∞"}`;
      hash = fakeHash();
    } else if (e.type === "THREAT_DETECTED") {
      level = "CRIT";
      msg = `⚠ 威胁确认: ${e.title}`;
    } else if (e.type === "ASSET_MOVEMENT_SIMULATED") {
      level = "WARN";
      msg = `资产转移 · ${assetMovement?.amount.toLocaleString() ?? "?"} ${assetMovement?.symbol ?? "ETH"} → ${assetMovement?.destinationAddress ?? "0xDEST"}`;
      hash = fakeHash();
    } else if (e.type === "PROTECTION_TRIGGERED") {
      level = "OK";
      msg = `✓ 安全引擎拦截 · ${e.title}`;
    } else if (e.type === "SIMULATION_COMPLETED") {
      level = "OK";
      msg = `分析结束 · status: ${simulation.status}`;
    }

    lines.push({ id: uid(), ts: fmtTime(i + 2), block, level, chain, msg, hash });
  });

  return lines;
}

// ── 动态追加的"区块滚动"行 ──
const LIVE_TEMPLATES = [
  (b: number, c: string) => ({ level: "TX" as const, chain: c, msg: `新区块确认 · #${b}`, hash: fakeHash() }),
  (_b: number, c: string) => ({ level: "INFO" as const, chain: c, msg: "Mempool 监控中 · 0 条可疑 pending TX" }),
  (_b: number, c: string) => ({ level: "WARN" as const, chain: c, msg: `MEV Bot 活跃 · GasPrice +12 Gwei · 抢跑风险评估中`, hash: fakeHash() }),
  (b: number, c: string) => ({ level: "TX" as const, chain: c, msg: `区块 #${b} 打包 · 148 txs · Gas Used: 87.4%`, hash: fakeHash() }),
  (_b: number, c: string) => ({ level: "INFO" as const, chain: c, msg: "链上风险规则扫描完成 · 0 命中" }),
  (_b: number, c: string) => ({ level: "WARN" as const, chain: c, msg: "检测到大额授权事件 · 继续监控", hash: fakeHash() }),
];

function fmtTime(offsetSec: number) {
  const d = new Date(Date.now() - offsetSec * 3000);
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}

const LEVEL_STYLE: Record<LogLine["level"], string> = {
  INFO: "text-slate-400",
  WARN: "text-amber-400",
  CRIT: "text-red-400 font-bold",
  OK:   "text-emerald-400",
  TX:   "text-sky-400",
};
const LEVEL_TAG: Record<LogLine["level"], string> = {
  INFO: "text-slate-500",
  WARN: "text-amber-500",
  CRIT: "text-red-500",
  OK:   "text-emerald-500",
  TX:   "text-sky-500",
};

export function AttackTerminal({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [lines, setLines] = useState<LogLine[]>(() => snapshotToLogs(snapshot));
  const [copied, setCopied]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const blockRef  = useRef(19_847_300 + Math.floor(Math.random() * 50));
  const chain = snapshot.scenario.chain ?? "ETH";

  // ── WebSocket 节点连接状态 ──
  const [wsLatency, setWsLatency] = useState(38);
  const [wsBlock,   setWsBlock]   = useState(blockRef.current);
  const [wsStatus,  setWsStatus]  = useState<"connected" | "syncing" | "reconnecting">("connected");
  useEffect(() => {
    const t = setInterval(() => {
      const lat = Math.round(28 + Math.random() * 40);
      setWsLatency(lat);
      setWsBlock(b => b + Math.floor(Math.random() * 2 + 1));
      setWsStatus(lat > 90 ? "syncing" : "connected");
    }, 2200);
    return () => clearInterval(t);
  }, []);

  // 仅在 playing 状态时追加动态日志
  useEffect(() => {
    if (!snapshot.playing) return;
    const t = setInterval(() => {
      const tmpl = LIVE_TEMPLATES[Math.floor(Math.random() * LIVE_TEMPLATES.length)];
      const extra = tmpl(blockRef.current++, chain);
      setLines((prev) => [
        ...prev.slice(-200), // 最多保留 200 行
        { id: uid(), ts: fmtTime(0), block: blockRef.current, ...extra },
      ]);
    }, 1800);
    return () => clearInterval(t);
  }, [snapshot.playing, chain]);

  // 当快照事件增加时，追加新行
  const prevEventsLen = useRef(snapshot.simulation.events.length);
  useEffect(() => {
    const newLen = snapshot.simulation.events.length;
    if (newLen <= prevEventsLen.current) return;
    const newEvents = snapshot.simulation.events.slice(prevEventsLen.current);
    prevEventsLen.current = newLen;
    const newLines = snapshotToLogs({ ...snapshot, simulation: { ...snapshot.simulation, events: newEvents } });
    setLines((prev) => [...prev.slice(-200), ...newLines]);
  }, [snapshot.simulation.events.length]); // eslint-disable-line

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  function copyLogs() {
    const text = lines.map(l => `[${l.ts}] [${l.level}] [${l.chain}] ${l.msg}${l.hash ? ` · ${l.hash}` : ""}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0a0e14] shadow-xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* macOS traffic lights */}
          <span className="size-2.5 rounded-full bg-red-500/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-500/80" />
          <div className="ml-2 flex items-center gap-1.5 text-[11.5px] text-slate-400">
            <Terminal className="size-3.5" />
            <span className="font-data">attack-executor · {chain} mainnet-fork</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {snapshot.playing && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <Wifi className="size-3 animate-pulse" />
              LIVE
            </span>
          )}
          <button
            onClick={copyLogs}
            className="flex items-center gap-1 text-[10.5px] text-slate-500 transition-colors hover:text-slate-300"
          >
            {copied ? <CheckCheck className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </div>

      {/* WebSocket 节点连接状态条 */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-[#070b12] px-4 py-1.5">
        <Radio className="size-3 shrink-0 text-emerald-400/70" />
        <span className="font-data text-[9.5px] text-slate-500">
          wss://mainnet.infura.io/ws/v3/
          <span className="text-slate-600">••••4a21</span>
        </span>
        <span className={cn(
          "flex items-center gap-1 font-data text-[9.5px]",
          wsStatus === "connected" ? "text-emerald-400" : "text-amber-400"
        )}>
          <span className={cn("size-1.5 rounded-full", wsStatus === "connected" ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
          {wsStatus === "connected" ? "已连接" : "同步中"}
        </span>
        <span className="font-data text-[9.5px] text-slate-600">{wsLatency}ms</span>
        <span className="font-data text-[9.5px] text-slate-600">区块 #{wsBlock.toLocaleString()}</span>
        <span className="ml-auto font-data text-[9.5px] text-slate-700">
          {chain} mainnet-fork · Hardhat v2.22
        </span>
      </div>

      {/* 日志区 */}
      <div className="scrollbar-thin h-[320px] overflow-y-auto px-4 py-3 font-data text-[11.5px] leading-relaxed">
        {lines.map((l) => (
          <div
            key={l.id}
            className={cn(
              "flex gap-2 rounded px-1 -mx-1",
              LEVEL_STYLE[l.level],
              l.level === "CRIT" && "bg-red-500/[0.06]",
              l.level === "WARN" && "bg-amber-500/[0.04]"
            )}
          >
            <span className="shrink-0 text-slate-600">{l.ts}</span>
            <span className="shrink-0 text-slate-700">#{l.block}</span>
            <span className={cn("w-8 shrink-0 font-bold", LEVEL_TAG[l.level])}>{l.level}</span>
            <span className="shrink-0 text-slate-600">[{l.chain}]</span>
            <span className="break-all">{l.msg}</span>
            {l.hash && (
              <span className="ml-1 shrink-0 truncate text-slate-600 hover:text-slate-400" title={l.hash}>
                · {l.hash.slice(0, 10)}…
              </span>
            )}
          </div>
        ))}
        {/* 光标 */}
        {snapshot.playing && (
          <div className="mt-1 flex items-center gap-1 text-slate-500">
            <span className="inline-block h-3 w-1.5 animate-pulse bg-emerald-500" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
