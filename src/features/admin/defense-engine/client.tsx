"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 自动防御规则引擎 — 可视化 if-then 规则编辑器 / 触发历史 / 实时统计（仅模拟）
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  ShieldCheck, Zap, ToggleLeft, ToggleRight,
  PlusCircle, Clock, CheckCircle2, AlertTriangle, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type RuleStatus = "ACTIVE" | "PAUSED" | "TRIGGERED";
type ActionType = "BLOCK_TX" | "FREEZE_ADDR" | "ALERT" | "QUARANTINE" | "REVOKE_APPROVAL";
type ConditionField = "SENDER" | "VALUE_ETH" | "TORNADO_INTERACTION" | "TX_FREQ" | "TOKEN_APPROVAL" | "CONTRACT_AGE" | "CROSS_CHAIN";

interface Condition {
  field: ConditionField;
  op: string;
  value: string;
}

interface TriggerEvent {
  id: string;
  ts: string;
  ruleId: string;
  ruleName: string;
  target: string;
  action: ActionType;
  blocked: boolean;
}

interface DefenseRule {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  priority: number;   // 1=highest
  conditions: Condition[];
  action: ActionType;
  triggerCount: number;
  lastTriggered?: string;
  template: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_RULES: DefenseRule[] = [
  {
    id: "r1",
    name: "混币器地址 7 天封锁",
    description: "与 Tornado Cash 交互后 7 天内的地址发起的任何转账均拦截",
    status: "ACTIVE",
    priority: 1,
    conditions: [
      { field: "TORNADO_INTERACTION", op: "WITHIN_DAYS", value: "7" },
    ],
    action: "BLOCK_TX",
    triggerCount: 47,
    lastTriggered: "3 分钟前",
    template: true,
  },
  {
    id: "r2",
    name: "新地址大额转账拦截",
    description: "链上存在不足 30 天的地址发送 ≥10 ETH，触发告警并冻结",
    status: "ACTIVE",
    priority: 2,
    conditions: [
      { field: "CONTRACT_AGE", op: "LESS_THAN_DAYS", value: "30" },
      { field: "VALUE_ETH",    op: "GTE",           value: "10" },
    ],
    action: "FREEZE_ADDR",
    triggerCount: 12,
    lastTriggered: "28 分钟前",
    template: true,
  },
  {
    id: "r3",
    name: "高频小额扫荡检测",
    description: "同一地址 1 分钟内发起 ≥20 笔小额转账，判定为扫地址攻击",
    status: "ACTIVE",
    priority: 3,
    conditions: [
      { field: "TX_FREQ",   op: "PER_MINUTE_GTE", value: "20" },
      { field: "VALUE_ETH", op: "LTE",            value: "0.01" },
    ],
    action: "BLOCK_TX",
    triggerCount: 8,
    lastTriggered: "1 小时前",
    template: true,
  },
  {
    id: "r4",
    name: "无限授权紧急撤销",
    description: "检测到新合约请求 MAX 授权时，立即撤销并告警",
    status: "ACTIVE",
    priority: 4,
    conditions: [
      { field: "TOKEN_APPROVAL", op: "IS_UNLIMITED", value: "true" },
      { field: "CONTRACT_AGE",   op: "LESS_THAN_DAYS", value: "7" },
    ],
    action: "REVOKE_APPROVAL",
    triggerCount: 23,
    lastTriggered: "11 分钟前",
    template: true,
  },
  {
    id: "r5",
    name: "跨链大额资金隔离",
    description: "跨链桥接入金额 ≥$50K USD 的交易先进入隔离池待人工审核",
    status: "PAUSED",
    priority: 5,
    conditions: [
      { field: "CROSS_CHAIN", op: "IS_BRIDGE_IN",    value: "true" },
      { field: "VALUE_ETH",   op: "GTE_USD",         value: "50000" },
    ],
    action: "QUARANTINE",
    triggerCount: 4,
    lastTriggered: "2 天前",
    template: false,
  },
];

const TRIGGER_LOG: TriggerEvent[] = [
  { id: "t1", ts: "03:42:11", ruleId: "r1", ruleName: "混币器地址 7 天封锁", target: "0xd91f...44a2", action: "BLOCK_TX",        blocked: true },
  { id: "t2", ts: "03:38:54", ruleId: "r4", ruleName: "无限授权紧急撤销",   target: "0xA1b2...9f3C", action: "REVOKE_APPROVAL", blocked: true },
  { id: "t3", ts: "03:21:07", ruleId: "r2", ruleName: "新地址大额转账拦截", target: "0x8812...cc10", action: "FREEZE_ADDR",      blocked: true },
  { id: "t4", ts: "03:14:29", ruleId: "r3", ruleName: "高频小额扫荡检测",   target: "0x4491...b77e", action: "BLOCK_TX",        blocked: true },
  { id: "t5", ts: "02:58:33", ruleId: "r1", ruleName: "混币器地址 7 天封锁", target: "0xF1a3...8c20", action: "BLOCK_TX",        blocked: false },
];

const ACTION_LABEL: Record<ActionType, string> = {
  BLOCK_TX: "拦截交易", FREEZE_ADDR: "冻结地址", ALERT: "发送告警",
  QUARANTINE: "隔离资金", REVOKE_APPROVAL: "撤销授权",
};
const ACTION_COLOR: Record<ActionType, string> = {
  BLOCK_TX:        "bg-red-500/10 text-red-400 border-red-500/30",
  FREEZE_ADDR:     "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ALERT:           "bg-sky-500/10 text-sky-400 border-sky-500/30",
  QUARANTINE:      "bg-violet-500/10 text-violet-400 border-violet-500/30",
  REVOKE_APPROVAL: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};
const FIELD_LABEL: Record<ConditionField, string> = {
  SENDER: "发送方地址", VALUE_ETH: "ETH 金额", TORNADO_INTERACTION: "混币器交互",
  TX_FREQ: "交易频率", TOKEN_APPROVAL: "代币授权", CONTRACT_AGE: "合约/地址年龄", CROSS_CHAIN: "跨链交互",
};

// ─── Rule card ────────────────────────────────────────────────────────────────
function RuleCard({
  rule,
  selected,
  onSelect,
  onToggle,
}: {
  rule: DefenseRule;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all cursor-pointer hover:border-primary/30",
        selected ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 font-mono text-[11px] text-muted-foreground/40">P{rule.priority}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-foreground/85 truncate">{rule.name}</span>
            {rule.template && (
              <span className="shrink-0 rounded-full bg-secondary/60 px-1.5 py-0.5 text-[9px] text-muted-foreground/50">
                内置
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60 leading-snug">{rule.description}</p>
        </div>
        {/* Toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground"
        >
          {rule.status === "ACTIVE"
            ? <ToggleRight className="size-5 text-primary" />
            : <ToggleLeft className="size-5" />
          }
        </button>
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px]">
        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", ACTION_COLOR[rule.action])}>
          {ACTION_LABEL[rule.action]}
        </span>
        <span className="text-muted-foreground/50">触发 ×{rule.triggerCount}</span>
        {rule.lastTriggered && (
          <span className="ml-auto flex items-center gap-1 text-muted-foreground/40">
            <Clock className="size-3" />{rule.lastTriggered}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────
export function DefenseEngineClient() {
  const [rules,     setRules]     = useState<DefenseRule[]>(INITIAL_RULES);
  const [selected,  setSelected]  = useState<DefenseRule>(INITIAL_RULES[0]);
  const [trigLog,   setTrigLog]   = useState<TriggerEvent[]>(TRIGGER_LOG);
  const [tab,       setTab]       = useState<"rules" | "log">("rules");
  const [liveTick,  setLiveTick]  = useState(0);

  // Simulate live trigger events
  useEffect(() => {
    const id = setInterval(() => {
      const templates = [
        { ruleId: "r1", ruleName: "混币器地址 7 天封锁", action: "BLOCK_TX" as ActionType },
        { ruleId: "r4", ruleName: "无限授权紧急撤销",    action: "REVOKE_APPROVAL" as ActionType },
        { ruleId: "r3", ruleName: "高频小额扫荡检测",   action: "BLOCK_TX" as ActionType },
      ];
      const t = templates[Math.floor(Math.random() * templates.length)];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const addr = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
      const newEvent: TriggerEvent = {
        id: `live-${Date.now()}`,
        ts,
        ruleId: t.ruleId,
        ruleName: t.ruleName,
        target: addr,
        action: t.action,
        blocked: Math.random() > 0.15,
      };
      setTrigLog(prev => [newEvent, ...prev.slice(0, 29)]);
      // increment trigger count
      setRules(prev => prev.map(r => r.id === t.ruleId ? { ...r, triggerCount: r.triggerCount + 1, lastTriggered: "방금" } : r));
      setLiveTick(n => n + 1);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  function toggleRule(id: string) {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : r
    ));
  }

  const activeCount   = rules.filter(r => r.status === "ACTIVE").length;
  const totalTriggers = rules.reduce((s, r) => s + r.triggerCount, 0);
  const blockedCount  = trigLog.filter(t => t.blocked).length;

  return (
    <div>
      <PageHeader title="自动防御规则引擎" description="实时防御规则 · 条件触发拦截 · 告警联动" />

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "活跃规则",   val: activeCount,    color: "text-emerald-400" },
          { label: "累计触发",   val: totalTriggers,  color: "text-sky-400" },
          { label: "成功拦截",   val: blockedCount,   color: "text-primary" },
          { label: "暂停规则",   val: rules.filter(r => r.status === "PAUSED").length, color: "text-muted-foreground/60" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-3.5">
            <p className="text-[11px] text-muted-foreground/60">{label}</p>
            <p className={cn("mt-1 text-2xl font-bold", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1">
        {(["rules", "log"] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl border px-4 py-1.5 text-[12px] font-medium transition-all",
              tab === t
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {t === "rules" ? `规则列表 (${rules.length})` : `触发日志 (${trigLog.length})`}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 rounded-xl border border-dashed border-border/50 px-3 py-1.5 text-[11.5px] text-muted-foreground/50 hover:border-primary/30 hover:text-primary">
          <PlusCircle className="size-3.5" /> 新建规则
        </button>
      </div>

      {tab === "rules" && (
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Rule list */}
          <div className="space-y-2.5">
            {rules.map(r => (
              <RuleCard
                key={r.id}
                rule={r}
                selected={selected.id === r.id}
                onSelect={() => setSelected(r)}
                onToggle={() => toggleRule(r.id)}
              />
            ))}
          </div>

          {/* Rule detail: condition viewer */}
          <div className="rounded-2xl border border-border/70 bg-card/65 p-4 h-fit">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-bold text-foreground/85">{selected.name}</p>
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", ACTION_COLOR[selected.action])}>
                {ACTION_LABEL[selected.action]}
              </span>
            </div>

            <p className="mt-2 text-[11.5px] text-muted-foreground/60 leading-relaxed">{selected.description}</p>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">触发条件</p>
              <div className="space-y-2">
                {selected.conditions.map((c, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <div className="my-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/40">
                        <div className="h-px flex-1 bg-border/40" />
                        AND
                        <div className="h-px flex-1 bg-border/40" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5">
                      <div className="flex-1 text-[11.5px]">
                        <span className="text-sky-400/80 font-mono">{FIELD_LABEL[c.field]}</span>
                        <span className="mx-1.5 text-muted-foreground/40">{c.op.replace(/_/g,' ')}</span>
                        <span className="font-semibold text-foreground/80">{c.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">执行动作</p>
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                <Zap className="size-4 text-primary/80" />
                <span className="text-[12px] font-semibold text-foreground/85">{ACTION_LABEL[selected.action]}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground/60">
              <div className="rounded-lg bg-secondary/30 p-2.5">
                <p className="text-[10px] uppercase tracking-wider mb-1">触发次数</p>
                <p className="text-lg font-bold text-foreground/80">{selected.triggerCount}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2.5">
                <p className="text-[10px] uppercase tracking-wider mb-1">最后触发</p>
                <p className="text-[12px] font-semibold text-foreground/80">{selected.lastTriggered ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "log" && (
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/65 overflow-hidden">
          {/* Live indicator */}
          <div className="flex items-center gap-2 border-b border-border/40 bg-secondary/20 px-4 py-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-semibold">实时监控中</span>
            <span className="ml-auto text-[10.5px] text-muted-foreground/50">共 {trigLog.length} 条记录</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[480px] overflow-y-auto">
            {trigLog.map((ev, i) => (
              <div key={ev.id} className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-[11.5px] transition-colors",
                i === 0 && "bg-primary/5",
                !ev.blocked && "opacity-60"
              )}>
                <span className="font-mono text-[10px] text-muted-foreground/40 shrink-0">{ev.ts}</span>
                <span className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold shrink-0", ACTION_COLOR[ev.action])}>
                  {ACTION_LABEL[ev.action]}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground/60 shrink-0">{ev.target}</span>
                <span className="truncate text-muted-foreground/50">{ev.ruleName}</span>
                <span className={cn("ml-auto flex items-center gap-0.5 shrink-0 text-[10px] font-semibold",
                  ev.blocked ? "text-emerald-400" : "text-muted-foreground/40")}>
                  {ev.blocked
                    ? <><CheckCircle2 className="size-3" /> 已拦截</>
                    : <><AlertTriangle className="size-3" /> 漏过</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
