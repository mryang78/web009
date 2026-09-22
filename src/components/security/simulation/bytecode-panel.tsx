"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 字节码安全分析面板 — 操作码检测 / 函数签名识别 / 漏洞模式匹配（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { ChevronDown, AlertTriangle, Code2, Cpu, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";

interface OpcodeMatch {
  opcode: string;
  offset: string;      // hex offset
  description: string;
  severity: Severity;
  context: string;     // surrounding bytes (display)
}

interface FuncSig {
  selector: string;    // 4-byte hex
  name: string;
  visibility: "public" | "external" | "internal";
  payable: boolean;
  suspicious: boolean;
  reason?: string;
}

interface VulnPattern {
  id: string;
  name: string;
  severity: Severity;
  confidence: number;  // 0-100
  description: string;
  opcodeSequence: string;
  offset: string;
}

interface BytecodeAnalysis {
  contractName: string;
  bytecodeSize: number;
  compiler: string;
  isProxy: boolean;
  selfDestructPresent: boolean;
  delegateCallPresent: boolean;
  opcodeMatches: OpcodeMatch[];
  funcSigs: FuncSig[];
  vulnPatterns: VulnPattern[];
}

// ─── Static analysis data (keyed by scenario type) ───────────────────────────
const REENTRANCY_ANALYSIS: BytecodeAnalysis = {
  contractName: "ReentrancyAttacker",
  bytecodeSize: 3_284,
  compiler: "solc 0.8.19",
  isProxy: false,
  selfDestructPresent: false,
  delegateCallPresent: false,
  opcodeMatches: [
    { opcode: "CALL",         offset: "0x00A4", severity: "CRITICAL", description: "外部 CALL 在状态更新之前",  context: "60 00 80 80 90 34 f1 → CALL before SSTORE" },
    { opcode: "SSTORE",       offset: "0x00B2", severity: "HIGH",     description: "SSTORE 在 CALL 之后执行",   context: "55 → balance[msg.sender] = 0 (delayed)" },
    { opcode: "ISZERO JUMPI", offset: "0x009C", severity: "MEDIUM",   description: "返回值未检查的条件跳转",    context: "15 60 BA 57 → unchecked return" },
    { opcode: "GAS",          offset: "0x00A0", severity: "INFO",     description: "将全部 gas 转发给子调用",    context: "5a → forwards all gas" },
  ],
  funcSigs: [
    { selector: "0x3ccfd60b", name: "withdraw()",           visibility: "external", payable: false, suspicious: true,  reason: "存在重入风险：先转账后归零余额" },
    { selector: "0xd0e30db0", name: "deposit()",            visibility: "external", payable: true,  suspicious: false },
    { selector: "0x70a08231", name: "balanceOf(address)",   visibility: "public",   payable: false, suspicious: false },
    { selector: "0x00000000", name: "receive()",            visibility: "external", payable: true,  suspicious: true,  reason: "receive() 回调可触发重入" },
    { selector: "0xffffffff", name: "fallback()",           visibility: "external", payable: true,  suspicious: true,  reason: "fallback() 增加攻击面" },
  ],
  vulnPatterns: [
    { id: "v1", name: "检查-生效-交互 (CEI) 违规", severity: "CRITICAL", confidence: 97, offset: "0x009C-0x00B2",
      opcodeSequence: "CALL → [no SSTORE] → SSTORE",
      description: "外部调用在状态更新之前执行，经典重入漏洞模式。攻击者可在 SSTORE 执行前反复调用 withdraw()。" },
    { id: "v2", name: "未检查外部调用返回值",       severity: "HIGH",     confidence: 84, offset: "0x00A4",
      opcodeSequence: "CALL → POP (无 JUMPI 校验)",
      description: "CALL 指令返回值被直接 POP 丢弃，子调用失败不会 revert 主交易。" },
    { id: "v3", name: "全量 Gas 转发",             severity: "MEDIUM",   confidence: 72, offset: "0x00A0",
      opcodeSequence: "GAS → CALL",
      description: "使用 GAS 操作码将所有剩余 gas 传递给外部合约，增加重入攻击成功概率。建议使用 gas(2300) 限制。" },
  ],
};

const DEFAULT_ANALYSIS: BytecodeAnalysis = {
  contractName: "MaliciousContract",
  bytecodeSize: 2_100,
  compiler: "solc 0.8.17",
  isProxy: false,
  selfDestructPresent: false,
  delegateCallPresent: true,
  opcodeMatches: [
    { opcode: "DELEGATECALL", offset: "0x0078", severity: "HIGH",   description: "DELEGATECALL 可劫持上下文存储", context: "f4 → delegatecall with caller context" },
    { opcode: "SELFDESTRUCT", offset: "0x00F1", severity: "CRITICAL",description: "SELFDESTRUCT 销毁合约并转移资金",context: "ff → contract self-destructs" },
  ],
  funcSigs: [
    { selector: "0x1626ba7e", name: "isValidSignature(bytes32,bytes)", visibility: "external", payable: false, suspicious: false },
    { selector: "0x5c975abb", name: "paused()",                        visibility: "public",   payable: false, suspicious: false },
    { selector: "0x8456cb59", name: "pause()",                         visibility: "external", payable: false, suspicious: true, reason: "无访问控制，任何人可暂停" },
  ],
  vulnPatterns: [
    { id: "v1", name: "无保护 DELEGATECALL", severity: "HIGH", confidence: 80, offset: "0x0078",
      opcodeSequence: "DELEGATECALL → (无调用者校验)",
      description: "DELEGATECALL 在调用者未受约束的情况下执行，可能导致存储槽被任意覆写。" },
    { id: "v2", name: "SELFDESTRUCT 可触达", severity: "CRITICAL", confidence: 91, offset: "0x00F1",
      opcodeSequence: "CALLDATALOAD → JUMPI → SELFDESTRUCT",
      description: "合约可通过特定调用路径触发 SELFDESTRUCT，将全部资金发送至任意地址并销毁合约。" },
  ],
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const SEV_STYLE: Record<Severity, { badge: string; dot: string }> = {
  CRITICAL: { badge: "bg-red-500/10 text-red-400 border-red-500/30",       dot: "bg-red-500" },
  HIGH:     { badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  MEDIUM:   { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-500" },
  INFO:     { badge: "bg-sky-500/10 text-sky-400 border-sky-500/30",       dot: "bg-sky-500" },
};

const TABS = ["操作码检测", "函数签名", "漏洞模式"] as const;
type Tab = typeof TABS[number];

// ─── Main component ───────────────────────────────────────────────────────────
export function BytecodePanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [activeTab, setActiveTab] = useState<Tab>("漏洞模式");
  const [expandedVuln, setExpandedVuln] = useState<string | null>("v1");

  const isReentrancy = snapshot.scenario.id.includes("reentranc") || snapshot.scenario.tags?.includes("reentrancy");
  const analysis: BytecodeAnalysis = isReentrancy ? REENTRANCY_ANALYSIS : DEFAULT_ANALYSIS;

  const critCount = analysis.vulnPatterns.filter(v => v.severity === "CRITICAL").length;
  const highCount = analysis.vulnPatterns.filter(v => v.severity === "HIGH").length;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-primary/80" />
          <span className="text-[13px] font-semibold text-foreground/85">字节码安全分析</span>
          <span className="rounded bg-secondary/60 px-2 py-0.5 font-data text-[10px] text-muted-foreground/60">
            {analysis.contractName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {critCount > 0 && (
            <span className="flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-red-400 font-semibold">
              <AlertTriangle className="size-3" /> CRITICAL ×{critCount}
            </span>
          )}
          {highCount > 0 && (
            <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-400 font-semibold">
              HIGH ×{highCount}
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 border-b border-border/40 bg-secondary/10 px-4 py-2 text-[11px] text-muted-foreground/60">
        {[
          { label: "大小",       val: `${analysis.bytecodeSize.toLocaleString()} bytes` },
          { label: "编译器",     val: analysis.compiler },
          { label: "代理合约",   val: analysis.isProxy ? "是" : "否" },
          { label: "DELEGATECALL",val: analysis.delegateCallPresent ? "存在 ⚠" : "无" },
          { label: "SELFDESTRUCT",val: analysis.selfDestructPresent ? "存在 ⚠" : "无" },
        ].map(({ label, val }) => (
          <span key={label}>
            <span className="mr-1 text-muted-foreground/40">{label}:</span>
            <span className={cn("font-data", val.includes("⚠") ? "text-amber-400" : "text-foreground/70")}>{val}</span>
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        {TABS.map(t => (
          <button key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-colors",
              activeTab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {t === "操作码检测" && <Code2 className="size-3.5" />}
            {t === "函数签名"   && <GitBranch className="size-3.5" />}
            {t === "漏洞模式"   && <AlertTriangle className="size-3.5" />}
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Opcode tab */}
        {activeTab === "操作码检测" && (
          <div className="space-y-2">
            {analysis.opcodeMatches.map((m, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded border px-1.5 py-0.5 font-data text-[10px] font-bold", SEV_STYLE[m.severity].badge)}>
                    {m.severity}
                  </span>
                  <span className="font-data text-[12px] font-semibold text-foreground/85">{m.opcode}</span>
                  <span className="ml-auto font-data text-[10.5px] text-muted-foreground/50">{m.offset}</span>
                </div>
                <p className="mt-1.5 text-[12px] text-foreground/70">{m.description}</p>
                <div className="mt-1.5 rounded bg-secondary/40 px-2.5 py-1.5 font-data text-[10.5px] text-muted-foreground/60">
                  {m.context}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Function sigs tab */}
        {activeTab === "函数签名" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-[12px]">
              <thead>
                <tr className="border-b border-border/40 text-left text-[10.5px] text-muted-foreground/50">
                  <th className="pb-2 pr-4 font-medium">选择器</th>
                  <th className="pb-2 pr-4 font-medium">函数名</th>
                  <th className="pb-2 pr-4 font-medium">可见性</th>
                  <th className="pb-2 pr-4 font-medium">Payable</th>
                  <th className="pb-2 font-medium">风险标注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {analysis.funcSigs.map((f, i) => (
                  <tr key={i} className={cn("hover:bg-secondary/20", f.suspicious && "bg-red-500/5")}>
                    <td className="py-2 pr-4 font-data text-[10.5px] text-muted-foreground/60">{f.selector}</td>
                    <td className="py-2 pr-4 font-data text-[11.5px] text-foreground/80">{f.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground/60">{f.visibility}</td>
                    <td className="py-2 pr-4">
                      {f.payable
                        ? <span className="text-amber-400 font-semibold">✓</span>
                        : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="py-2">
                      {f.suspicious
                        ? <span className="text-[10.5px] text-red-400">{f.reason}</span>
                        : <span className="text-[10.5px] text-emerald-400/70">安全</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vuln patterns tab */}
        {activeTab === "漏洞模式" && (
          <div className="space-y-2">
            {analysis.vulnPatterns.map(v => {
              const isOpen = expandedVuln === v.id;
              return (
                <div key={v.id} className="overflow-hidden rounded-xl border border-border/50 bg-secondary/20">
                  <button
                    onClick={() => setExpandedVuln(isOpen ? null : v.id)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary/30"
                  >
                    <span className={cn("size-2 rounded-full shrink-0", SEV_STYLE[v.severity].dot)} />
                    <span className="text-[12.5px] font-semibold text-foreground/85">{v.name}</span>
                    <span className={cn("ml-1 rounded border px-1.5 py-0.5 text-[9.5px] font-bold", SEV_STYLE[v.severity].badge)}>
                      {v.severity}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground/50">
                      置信度 {v.confidence}%
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/40 bg-secondary/10 p-3 space-y-2">
                      <p className="text-[12px] text-foreground/70 leading-relaxed">{v.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                        <span>操作码序列：</span>
                        <code className="rounded bg-secondary/60 px-2 py-0.5 font-data text-[10.5px] text-amber-400/80">
                          {v.opcodeSequence}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                        <span>偏移地址：</span>
                        <code className="rounded bg-secondary/60 px-2 py-0.5 font-data text-[10.5px] text-foreground/60">
                          {v.offset}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
