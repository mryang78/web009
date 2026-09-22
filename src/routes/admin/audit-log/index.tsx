"use client";
import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Shield, Download, Filter, RefreshCw, ExternalLink, Clock, User, Terminal, AlertTriangle, CheckCircle2, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audit-log/")({
  head: () => ({ meta: [{ title: "操作审计日志 · Web3 Studio" }] }),
  component: AuditLogPage,
});

type EventType = "LOGIN" | "RULE_CHANGE" | "ALERT_ACK" | "EXPORT" | "BLOCK" | "SCAN" | "CONFIG" | "API_CALL";
type Result = "SUCCESS" | "FAILURE" | "WARNING";

interface AuditEvent {
  id: string;
  ts: string;
  actor: string;
  actorIp: string;
  type: EventType;
  action: string;
  target: string;
  result: Result;
  chain?: string;
  details?: string;
}

const TYPE_META: Record<EventType, { label: string; color: string; bg: string }> = {
  LOGIN:       { label: "登录",     color: "text-sky-400",     bg: "bg-sky-500/10" },
  RULE_CHANGE: { label: "规则变更", color: "text-violet-400",  bg: "bg-violet-500/10" },
  ALERT_ACK:   { label: "告警处理", color: "text-amber-400",   bg: "bg-amber-500/10" },
  EXPORT:      { label: "数据导出", color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  BLOCK:       { label: "封锁操作", color: "text-red-400",     bg: "bg-red-500/10" },
  SCAN:        { label: "安全扫描", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  CONFIG:      { label: "系统配置", color: "text-orange-400",  bg: "bg-orange-500/10" },
  API_CALL:    { label: "API调用",  color: "text-slate-400",   bg: "bg-slate-500/10" },
};

const RESULT_META: Record<Result, { icon: typeof CheckCircle2; color: string }> = {
  SUCCESS: { icon: CheckCircle2, color: "text-emerald-400" },
  FAILURE: { icon: XCircle,     color: "text-red-400" },
  WARNING: { icon: AlertTriangle, color: "text-amber-400" },
};

function makeId() { return "EVT-" + Math.random().toString(36).slice(2, 8).toUpperCase(); }
function rndHash() { return "0x" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("") + "…"; }

const ACTORS = ["admin@web3studio.io", "analyst_01", "soc_lead", "api-service", "scheduler"];
const ACTOR_IPS = ["192.168.1.42", "10.0.0.15", "172.16.4.88", "185.220.101.34", "10.0.0.1"];

const SEED_EVENTS: AuditEvent[] = [
  { id: "EVT-4A21F8", ts: "2026-09-21 14:02:11", actor: "admin@web3studio.io",  actorIp: "192.168.1.42",    type: "RULE_CHANGE", action: "启用告警规则",       target: "R-7702 闪电贷价格操纵",      result: "SUCCESS", chain: "ARB",  details: "将规则 R-7702 状态从 [禁用] 切换为 [启用]，阈值: price_change_1block > 30%" },
  { id: "EVT-3B88C2", ts: "2026-09-21 13:54:07", actor: "analyst_01",           actorIp: "10.0.0.15",      type: "ALERT_ACK",   action: "标记告警已处理",     target: "ALERT#8821 异地 IP 登录",    result: "SUCCESS", chain: "-",    details: "用户确认为本人操作，IP 185.220.xx.xx 已加入白名单" },
  { id: "EVT-9C44D1", ts: "2026-09-21 13:41:33", actor: "api-service",          actorIp: "10.0.0.1",       type: "API_CALL",    action: "批量风险评分请求",   target: "POST /api/v2/risk/batch",    result: "SUCCESS", chain: "ETH",  details: "处理 148 个地址，平均耗时 340ms，返回 12 个高风险地址" },
  { id: "EVT-2D55B0", ts: "2026-09-21 13:22:48", actor: "soc_lead",             actorIp: "192.168.1.42",   type: "BLOCK",       action: "封锁钱包地址",       target: "0xA2F1…8B4C",               result: "SUCCESS", chain: "ETH",  details: "已将地址 0xA2F1…8B4C 加入全链封锁名单，原因: 无限授权攻击" },
  { id: "EVT-7E11A3", ts: "2026-09-21 13:15:22", actor: "scheduler",            actorIp: "10.0.0.1",       type: "SCAN",        action: "全链合约扫描",       target: "ETH 最新 1000 个合约",       result: "SUCCESS", chain: "ETH",  details: "发现 18 个高危合约，4 个含 selfdestruct，14 个含无限授权模式" },
  { id: "EVT-5F22B4", ts: "2026-09-21 12:58:10", actor: "admin@web3studio.io",  actorIp: "192.168.1.42",   type: "EXPORT",      action: "导出告警记录",       target: "alerts_2026-09-21.csv",      result: "SUCCESS", chain: "-",    details: "导出最近 24 小时内 47 条 HIGH/CRITICAL 告警记录" },
  { id: "EVT-1G33C5", ts: "2026-09-21 12:31:44", actor: "analyst_01",           actorIp: "10.0.0.15",      type: "RULE_CHANGE", action: "修改规则阈值",       target: "R-2210 大额提取超限",        result: "SUCCESS", chain: "ALL",  details: "阈值从 $30,000 提升至 $50,000，生效时间: 即时" },
  { id: "EVT-6H44D6", ts: "2026-09-21 12:10:55", actor: "api-service",          actorIp: "10.0.0.1",       type: "API_CALL",    action: "MEV 检测请求",       target: "POST /api/v2/mempool/mev",   result: "WARNING", chain: "ETH",  details: "检测到 3 笔潜在三明治攻击，置信度 82-91%，已生成告警 ALERT#9012" },
  { id: "EVT-8I55E7", ts: "2026-09-21 11:47:09", actor: "admin@web3studio.io",  actorIp: "185.220.101.34", type: "LOGIN",       action: "管理员登录",         target: "Web3 Studio 控制台",         result: "WARNING", chain: "-",    details: "来自非常用 IP 185.220.101.34（Tor 出口节点），已通过 2FA 验证" },
  { id: "EVT-3J66F8", ts: "2026-09-21 11:22:31", actor: "soc_lead",             actorIp: "192.168.1.42",   type: "CONFIG",      action: "更新通知配置",       target: "Webhook POST /alerts",       result: "SUCCESS", chain: "-",    details: "新增 PagerDuty 集成，P1 级别告警 30 秒内自动呼叫值班人员" },
  { id: "EVT-9K77G9", ts: "2026-09-21 10:58:14", actor: "scheduler",            actorIp: "10.0.0.1",       type: "SCAN",        action: "链下 IP 信誉扫描",   target: "活跃用户 IP 列表 (2,841)",   result: "SUCCESS", chain: "-",    details: "识别 7 个 Tor 出口 IP，4 个已知 VPN 节点，已标记为中等风险" },
  { id: "EVT-4L88H0", ts: "2026-09-21 10:35:47", actor: "api-service",          actorIp: "10.0.0.1",       type: "API_CALL",    action: "跨链桥监控查询",     target: "GET /api/v2/bridge/events",  result: "SUCCESS", chain: "ALL",  details: "查询 ETH→ARB 跨链事件 88 笔，检测到 1 笔超阈值转账 ($127,000)" },
  { id: "EVT-5M99I1", ts: "2026-09-21 10:12:03", actor: "analyst_01",           actorIp: "10.0.0.15",      type: "BLOCK",       action: "封锁合约地址",       target: rndHash(),                    result: "SUCCESS", chain: "BSC",  details: "合约被检测到包含蜜罐陷阱代码，已禁止所有平台用户与其交互" },
  { id: "EVT-6N00J2", ts: "2026-09-21 09:44:21", actor: "soc_lead",             actorIp: "192.168.1.42",   type: "RULE_CHANGE", action: "禁用告警规则",       target: "R-8801 跨链桥大额转出",      result: "SUCCESS", chain: "ALL",  details: "临时禁用测试规则，防止压测期间产生误报，预计 2 小时后恢复" },
  { id: "EVT-7O11K3", ts: "2026-09-21 09:18:55", actor: "admin@web3studio.io",  actorIp: "192.168.1.42",   type: "LOGIN",       action: "管理员登录",         target: "Web3 Studio 控制台",         result: "SUCCESS", chain: "-",    details: "来自常用 IP 192.168.1.42，通过密码 + TOTP 验证" },
];

const NEW_EVENT_TEMPLATES: Omit<AuditEvent, "id" | "ts">[] = [
  { actor: "scheduler",   actorIp: "10.0.0.1",     type: "SCAN",        action: "Mempool 扫描",       target: "ETH 待确认 TX (3,841)",      result: "SUCCESS", chain: "ETH",  details: "扫描 3,841 笔待确认交易，发现 12 笔疑似 MEV 套利，7 笔 Sybil 相关" },
  { actor: "api-service", actorIp: "10.0.0.1",     type: "API_CALL",    action: "风险评分请求",       target: "POST /api/v2/risk/score",    result: "SUCCESS", chain: "ETH",  details: "单地址风险评分查询，返回评分 94 (CRITICAL)，触发实时告警" },
  { actor: "analyst_01",  actorIp: "10.0.0.15",    type: "ALERT_ACK",   action: "标记告警调查中",     target: "ALERT#" + Math.floor(Math.random()*9999), result: "SUCCESS", details: "已分配至 SOC 二线分析师，预计 30 分钟内完成研判" },
  { actor: "scheduler",   actorIp: "10.0.0.1",     type: "SCAN",        action: "合约字节码扫描",     target: "BSC 最新 500 个合约",         result: "WARNING", chain: "BSC",  details: "发现 3 个合约含可疑 selfdestruct，已加入待审核队列" },
];

const ALL_TYPES: Array<EventType | "ALL"> = ["ALL", "LOGIN", "RULE_CHANGE", "ALERT_ACK", "EXPORT", "BLOCK", "SCAN", "CONFIG", "API_CALL"];

function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>(SEED_EVENTS);
  const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");
  const [resultFilter, setResultFilter] = useState<Result | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulate live event streaming
  useEffect(() => {
    const t = setInterval(() => {
      const tmpl = NEW_EVENT_TEMPLATES[Math.floor(Math.random() * NEW_EVENT_TEMPLATES.length)];
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${now.toLocaleTimeString("zh-CN", { hour12: false })}`;
      setEvents(prev => [{ ...tmpl, id: makeId(), ts }, ...prev.slice(0, 199)]);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const filtered = events.filter(e =>
    (typeFilter === "ALL" || e.type === typeFilter) &&
    (resultFilter === "ALL" || e.result === resultFilter)
  );

  function exportCSV() {
    const header = ["事件ID", "时间", "操作员", "IP", "类型", "操作", "目标", "结果", "链"];
    const rows = filtered.map(e => [e.id, e.ts, e.actor, e.actorIp, TYPE_META[e.type].label, e.action, e.target, e.result, e.chain ?? "-"]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }

  const stats = {
    total: events.length,
    success: events.filter(e => e.result === "SUCCESS").length,
    warning: events.filter(e => e.result === "WARNING").length,
    failure: events.filter(e => e.result === "FAILURE").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "工作台", href: "/admin" }, { label: "操作审计日志" }]}
        title="操作审计日志"
        description={`共 ${events.length} 条记录 · 实时追踪所有管理操作与系统事件`}
      />

      {/* 统计概览 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card/65 p-4">
          <p className="text-[10.5px] text-muted-foreground">总事件数</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">过去 24 小时</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/65 p-4">
          <p className="text-[10.5px] text-muted-foreground">成功</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-400">{stats.success}</p>
          <p className="text-[10px] text-muted-foreground">{Math.round(stats.success/stats.total*100)}% 操作成功</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/65 p-4">
          <p className="text-[10.5px] text-muted-foreground">警告</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-amber-400">{stats.warning}</p>
          <p className="text-[10px] text-muted-foreground">需要关注</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/65 p-4">
          <p className="text-[10.5px] text-muted-foreground">失败</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-red-400">{stats.failure}</p>
          <p className="text-[10px] text-muted-foreground">需要调查</p>
        </div>
      </div>

      {/* 过滤 + 操作栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 类型过滤 */}
        <div className="flex flex-wrap rounded-lg border border-border/60 bg-secondary/40 p-0.5 gap-0.5">
          {(["ALL", "LOGIN", "RULE_CHANGE", "ALERT_ACK", "BLOCK", "SCAN", "EXPORT", "CONFIG"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t as EventType | "ALL")}
              className={cn("rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-colors",
                typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t === "ALL" ? "全部" : TYPE_META[t as EventType].label}
            </button>
          ))}
        </div>

        {/* 结果过滤 */}
        <select
          value={resultFilter}
          onChange={e => setResultFilter(e.target.value as Result | "ALL")}
          className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-[11px] text-foreground"
        >
          <option value="ALL">全部结果</option>
          <option value="SUCCESS">成功</option>
          <option value="WARNING">警告</option>
          <option value="FAILURE">失败</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={refresh} className={cn("flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground", loading && "opacity-60")}>
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            刷新
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground">
            <Download className="size-3.5" />导出 CSV
          </button>
        </div>
      </div>

      {/* 事件表格 */}
      <div className="overflow-hidden rounded-xl border border-border/70">
        {/* 表头 */}
        <div className="grid grid-cols-[140px_140px_120px_1fr_100px_80px_36px] gap-2 bg-secondary/30 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          <span>时间</span>
          <span>操作员</span>
          <span>类型</span>
          <span>操作 / 目标</span>
          <span>IP 地址</span>
          <span className="text-right">结果</span>
          <span />
        </div>

        <div className="divide-y divide-border/30">
          {filtered.map((ev, idx) => {
            const tm = TYPE_META[ev.type];
            const rm = RESULT_META[ev.result];
            const ResultIcon = rm.icon;
            const isNew = idx === 0;
            const isExpanded = expanded === ev.id;

            return (
              <div key={ev.id} className={cn("transition-colors", isNew && "animate-[fadeIn_0.5s_ease]")}>
                <div
                  className="grid cursor-pointer grid-cols-[140px_140px_120px_1fr_100px_80px_36px] items-center gap-2 px-4 py-3 hover:bg-secondary/20"
                  onClick={() => setExpanded(isExpanded ? null : ev.id)}
                >
                  <span className="font-mono text-[10.5px] text-muted-foreground">{ev.ts.split(" ")[1]}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-medium text-foreground/90">{ev.actor}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.id}</p>
                  </div>
                  <span className={cn("inline-block rounded px-2 py-0.5 text-[9.5px] font-bold", tm.bg, tm.color)}>
                    {tm.label}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] text-foreground/80">{ev.action}</p>
                    <p className="truncate text-[10.5px] text-muted-foreground">{ev.target}</p>
                  </div>
                  <span className="font-mono text-[10.5px] text-muted-foreground/70">{ev.actorIp}</span>
                  <div className="flex items-center justify-end gap-1">
                    <ResultIcon className={cn("size-3.5", rm.color)} />
                    <span className={cn("text-[10.5px] font-semibold", rm.color)}>{ev.result}</span>
                  </div>
                  <Eye className={cn("size-3.5 text-muted-foreground/40 transition-colors", isExpanded && "text-primary")} />
                </div>

                {/* 展开详情 */}
                {isExpanded && ev.details && (
                  <div className="border-t border-border/20 bg-secondary/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Terminal className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                      <div className="space-y-1.5 text-[11.5px]">
                        <p className="text-foreground/80 leading-relaxed">{ev.details}</p>
                        <div className="flex flex-wrap gap-3 pt-1">
                          {ev.chain && ev.chain !== "-" && (
                            <span className="font-mono text-[10px] text-sky-400">链: {ev.chain}</span>
                          )}
                          <span className="font-mono text-[10px] text-muted-foreground">事件ID: {ev.id}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">完整时间: {ev.ts}</span>
                          <button className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                            <ExternalLink className="size-3" />在区块浏览器中查看
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[13px] text-muted-foreground">
          当前过滤条件下无匹配事件
        </div>
      )}
    </div>
  );
}
