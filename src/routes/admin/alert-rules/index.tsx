"use client";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Shield, ToggleLeft, ToggleRight, Pencil, Play, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/alert-rules/")({
  head: () => ({ meta: [{ title: "告警规则 · Web3 Studio" }] }),
  component: AlertRulesPage,
});

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Chain = "ALL" | "ETH" | "BSC" | "ARB" | "Polygon" | "OP";

interface Rule {
  id: string;
  name: string;
  description: string;
  chain: Chain;
  severity: Severity;
  threshold: string;
  category: string;
  enabled: boolean;
  triggered: number;
  lastHit: string;
}

const SEV_STYLE: Record<Severity, string> = {
  CRITICAL: "bg-red-500/15 text-red-400",
  HIGH:     "bg-orange-500/15 text-orange-400",
  MEDIUM:   "bg-amber-500/15 text-amber-400",
  LOW:      "bg-sky-500/10 text-sky-400",
};

const INITIAL_RULES: Rule[] = [
  { id: "R-4421", name: "无限授权检测",         description: "检测 ERC-20 授权额度 > 10^30，疑似无限授权攻击", chain: "ALL",     severity: "CRITICAL", threshold: "amount > 1e30",          category: "授权安全", enabled: true,  triggered: 284, lastHit: "2 分钟前" },
  { id: "R-3388", name: "流动性池异常抽离",      description: "单笔 LP 移除超过池总量 80%，疑似 Rug Pull",      chain: "ETH",     severity: "CRITICAL", threshold: "lp_removed > pool*0.8",  category: "DeFi",    enabled: true,  triggered: 47,  lastHit: "41 分钟前" },
  { id: "R-5501", name: "MEV 三明治攻击",        description: "在目标交易前后各检测到 Gas 竞价插入交易",          chain: "ETH",     severity: "HIGH",     threshold: "sandwich_gap < 2 blocks", category: "MEV",     enabled: true,  triggered: 192, lastHit: "8 分钟前" },
  { id: "R-2210", name: "大额提取超限",           description: "24 小时内单钱包提取金额超过阈值",                 chain: "ALL",     severity: "HIGH",     threshold: "withdraw_24h > $50,000",  category: "限额",    enabled: true,  triggered: 88,  lastHit: "8 分钟前" },
  { id: "R-6601", name: "Sybil 地址聚类",        description: "图神经网络检测到多地址行为高度相似",               chain: "Polygon", severity: "MEDIUM",   threshold: "cluster_sim > 0.92",      category: "身份",    enabled: true,  triggered: 34,  lastHit: "23 分钟前" },
  { id: "R-1104", name: "高危合约函数检测",       description: "新部署合约包含 selfdestruct / delegatecall",     chain: "ETH",     severity: "MEDIUM",   threshold: "bytecode_risk >= HIGH",   category: "合约",    enabled: true,  triggered: 143, lastHit: "15 分钟前" },
  { id: "R-2211", name: "钱包余额骤降",           description: "10 分钟内余额降幅 > 75%",                        chain: "ALL",     severity: "HIGH",     threshold: "balance_drop_10m > 75%",  category: "资产",    enabled: true,  triggered: 21,  lastHit: "1 小时前" },
  { id: "R-0012", name: "异地 IP 登录",           description: "登录 IP 与常用地区差距 > 5000km 或来自 Tor",      chain: "-",       severity: "LOW",      threshold: "ip_distance > 5000km",    category: "账户",    enabled: true,  triggered: 97,  lastHit: "23 分钟前" },
  { id: "R-7702", name: "闪电贷价格操纵",         description: "单区块内价格波动 > 30%，含闪电贷交易",            chain: "ARB",     severity: "CRITICAL", threshold: "price_change_1block > 30%", category: "DeFi",  enabled: false, triggered: 12,  lastHit: "3 天前" },
  { id: "R-8801", name: "跨链桥大额转出",         description: "单笔跨链金额超过阈值触发人工审核",                chain: "ALL",     severity: "HIGH",     threshold: "bridge_amount > $100,000", category: "跨链",  enabled: false, triggered: 8,   lastHit: "1 天前" },
];

const CATEGORIES = ["全部", ...Array.from(new Set(INITIAL_RULES.map(r => r.category)))];
const CHAINS: Chain[] = ["ALL", "ETH", "BSC", "ARB", "Polygon", "OP"];

function AlertRulesPage() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [catFilter, setCatFilter] = useState("全部");
  const [sevFilter, setSevFilter] = useState<Severity | "ALL">("ALL");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "pass" | "triggered" | null>>({});

  const filtered = rules.filter(r =>
    (catFilter === "全部" || r.category === catFilter) &&
    (sevFilter === "ALL" || r.severity === sevFilter)
  );

  function toggle(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function testRule(id: string) {
    setTestingId(id);
    setTimeout(() => {
      setTestResult(prev => ({ ...prev, [id]: Math.random() > 0.4 ? "triggered" : "pass" }));
      setTestingId(null);
    }, 1200);
  }

  function exportCSV() {
    const header = ["ID","规则名","分类","链","级别","阈值","已触发次数","最后命中","状态"];
    const rows = rules.map(r => [r.id, r.name, r.category, r.chain, r.severity, r.threshold, r.triggered, r.lastHit, r.enabled ? "启用" : "禁用"]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "alert_rules.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const enabledCount = rules.filter(r => r.enabled).length;
  const totalTriggered = rules.reduce((s, r) => s + r.triggered, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "工作台", href: "/admin" }, { label: "告警规则" }]}
        title="告警规则配置"
        description={`${enabledCount}/${rules.length} 条规则启用中 · 累计触发 ${totalTriggered.toLocaleString()} 次`}
      />

      {/* 统计卡 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["CRITICAL","HIGH","MEDIUM","LOW"] as Severity[]).map(sev => {
          const cnt = rules.filter(r => r.severity === sev && r.enabled).length;
          return (
            <div key={sev} className="rounded-xl border border-border/70 bg-card/65 p-4">
              <span className={cn("rounded px-2 py-0.5 text-[9.5px] font-bold", SEV_STYLE[sev])}>{sev}</span>
              <p className="mt-2 font-mono text-2xl font-bold text-foreground">{cnt}</p>
              <p className="text-[10.5px] text-muted-foreground">条规则启用</p>
            </div>
          );
        })}
      </div>

      {/* 过滤 + 操作栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 分类 */}
        <div className="flex rounded-lg border border-border/60 bg-secondary/40 p-0.5">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn("rounded-md px-3 py-1 text-[11px] font-semibold transition-colors",
                catFilter === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>{c}</button>
          ))}
        </div>
        {/* 严重级别 */}
        <select
          value={sevFilter}
          onChange={e => setSevFilter(e.target.value as Severity | "ALL")}
          className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-[11px] text-foreground"
        >
          <option value="ALL">全部级别</option>
          {(["CRITICAL","HIGH","MEDIUM","LOW"] as Severity[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground">
            <Download className="size-3.5"/>导出 CSV
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="size-3.5"/>新建规则
          </button>
        </div>
      </div>

      {/* 规则表格 */}
      <div className="overflow-hidden rounded-xl border border-border/70">
        <div className="grid grid-cols-[80px_1fr_80px_80px_1fr_72px_72px_80px] gap-3 bg-secondary/30 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          <span>规则 ID</span>
          <span>规则名称 / 描述</span>
          <span>分类</span>
          <span>链</span>
          <span>触发阈值</span>
          <span className="text-right">命中次数</span>
          <span className="text-right">最后命中</span>
          <span className="text-right">操作</span>
        </div>
        <div className="divide-y divide-border/30">
          {filtered.map(rule => {
            const result = testResult[rule.id];
            return (
              <div key={rule.id} className={cn(
                "grid grid-cols-[80px_1fr_80px_80px_1fr_72px_72px_80px] items-center gap-3 px-4 py-3 transition-colors",
                !rule.enabled && "opacity-50",
                rule.enabled ? "hover:bg-secondary/20" : ""
              )}>
                <span className="font-mono text-[10.5px] text-muted-foreground">{rule.id}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12px] font-semibold text-foreground/90">{rule.name}</span>
                    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold", SEV_STYLE[rule.severity])}>{rule.severity}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{rule.description}</p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-center text-[10px] text-muted-foreground">{rule.category}</span>
                <span className="font-mono text-[10.5px] text-sky-400">{rule.chain}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground/80 truncate">{rule.threshold}</span>
                <span className="text-right font-mono text-[11px] font-semibold text-foreground">{rule.triggered.toLocaleString()}</span>
                <span className="text-right text-[10.5px] text-muted-foreground">{rule.lastHit}</span>
                <div className="flex items-center justify-end gap-1.5">
                  {/* 测试规则 */}
                  <button
                    onClick={() => testRule(rule.id)}
                    disabled={testingId === rule.id || !rule.enabled}
                    title="测试规则"
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      result === "triggered" ? "bg-amber-500/15 text-amber-400" :
                      result === "pass"      ? "bg-emerald-500/15 text-emerald-400" :
                      "text-muted-foreground/50 hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {testingId === rule.id
                      ? <span className="inline-block size-3.5 animate-spin rounded-full border border-current border-t-transparent"/>
                      : <Play className="size-3.5"/>
                    }
                  </button>
                  {/* 编辑 */}
                  <button title="编辑" className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground">
                    <Pencil className="size-3.5"/>
                  </button>
                  {/* 启用/禁用 */}
                  <button onClick={() => toggle(rule.id)} title={rule.enabled ? "禁用" : "启用"}
                    className={cn("rounded-md p-1 transition-colors", rule.enabled ? "text-emerald-400" : "text-muted-foreground/40 hover:text-foreground")}>
                    {rule.enabled ? <ToggleRight className="size-5"/> : <ToggleLeft className="size-5"/>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 测试结果提示 */}
      {Object.entries(testResult).some(([,v]) => v) && (
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 text-[12px] space-y-1.5">
          <p className="font-semibold text-foreground/80 text-[11px] uppercase tracking-wider mb-2">规则测试结果</p>
          {Object.entries(testResult).filter(([,v]) => v).map(([id, result]) => {
            const rule = rules.find(r => r.id === id);
            return (
              <div key={id} className="flex items-center gap-2">
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold",
                  result === "triggered" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                )}>
                  {result === "triggered" ? "已触发" : "通过"}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{id}</span>
                <span className="text-foreground/70">{rule?.name}</span>
                {result === "triggered" && <span className="text-amber-400/70 text-[10.5px]">· 阈值命中，将生成告警</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
