"use client";
// ─────────────────────────────────────────────────────────────────────────────
// 合约反编译 & 安全审计面板
// Slither 风格检测 + 高危函数高亮 + 综合评分
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Code2, AlertTriangle, ShieldCheck, Copy, CheckCheck, ChevronDown, ChevronRight } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

// ── 检测结果类型 ──
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
interface Finding {
  id: string;
  severity: Severity;
  title: string;
  location: string;
  description: string;
  impact: string;
  recommendation: string;
}

const SEV_STYLE: Record<Severity, { badge: string; dot: string; border: string }> = {
  CRITICAL: { badge: "bg-red-500/15 text-red-400",      dot: "bg-red-500",    border: "border-l-red-500"    },
  HIGH:     { badge: "bg-orange-500/15 text-orange-400", dot: "bg-orange-400", border: "border-l-orange-400" },
  MEDIUM:   { badge: "bg-amber-500/15 text-amber-400",   dot: "bg-amber-400",  border: "border-l-amber-400"  },
  LOW:      { badge: "bg-sky-500/10 text-sky-400",       dot: "bg-sky-400",    border: "border-l-sky-400"    },
  INFO:     { badge: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground", border: "border-l-border" },
};

// ── 模拟反编译伪代码（根据快照场景动态选择） ──
const PSEUDO_CODE = `// [反编译输出] SPENDER_CONTRACT_v2.sol
// 警告：此输出由字节码逆向生成，仅供参考

pragma solidity ^0.8.0;

contract SpenderV2 {
    address public owner;
    mapping(address => bool) public whitelist;

    // ⚠ CRITICAL: 无限授权提取函数
    function drainApproved(
        address token,
        address victim,
        uint256 amount   // 通常传入 type(uint256).max
    ) external {
        require(whitelist[msg.sender], "Not authorized");
        // ↓ 高危：未检查返回值，未设提取上限
        IERC20(token).transferFrom(victim, owner, amount);
    }

    // ⚠ HIGH: 所有者可随时修改白名单
    function addToWhitelist(address bot) external {
        require(msg.sender == owner);
        whitelist[bot] = true;   // 无事件日志
    }

    // ⚠ HIGH: 自毁函数可清除合约证据
    function destroy() external {
        require(msg.sender == owner);
        selfdestruct(payable(owner));  // ← selfdestruct
    }

    // ⚠ MEDIUM: delegatecall 可升级执行上下文
    function execute(address impl, bytes calldata data) external {
        require(whitelist[msg.sender]);
        (bool ok,) = impl.delegatecall(data);  // ← delegatecall
        require(ok);
    }

    // INFO: 普通转账包装
    function withdraw(uint256 amount) external {
        require(msg.sender == owner);
        payable(owner).transfer(amount);
    }
}`;

const FINDINGS: Finding[] = [
  {
    id: "SWC-107-01",
    severity: "CRITICAL",
    title: "无限 transferFrom 授权提取",
    location: "SpenderV2.drainApproved() L13",
    description: "合约未对 `amount` 参数设置上限，攻击者可传入 `type(uint256).max` 一次性提取受害者全部授权额度。",
    impact: "受害者全部已授权代币资产面临被提取风险，历史案例损失可达数百万美元。",
    recommendation: "添加额度检查：`require(amount <= MAX_DRAIN_LIMIT);` 并引入每日提取上限机制。",
  },
  {
    id: "SWC-106-01",
    severity: "CRITICAL",
    title: "返回值未检查（ERC-20 transferFrom）",
    location: "SpenderV2.drainApproved() L16",
    description: "直接调用 `IERC20.transferFrom` 未检查返回值 `bool`，若代币合约返回 `false` 表示失败，此处逻辑仍会继续执行。",
    impact: "在某些非标准 ERC-20 代币上可能导致逻辑绕过或静默失败。",
    recommendation: "使用 OpenZeppelin SafeERC20 的 `safeTransferFrom` 替代直接调用。",
  },
  {
    id: "SWC-106-02",
    severity: "HIGH",
    title: "selfdestruct 合约自毁",
    location: "SpenderV2.destroy() L27",
    description: "合约包含 `selfdestruct` 指令，owner 可在攻击完成后销毁合约，销毁链上证据，阻碍事后追查。",
    impact: "攻击后无法通过合约代码追溯攻击逻辑，取证难度大幅增加。",
    recommendation: "移除 `selfdestruct`，改用可暂停（Pausable）机制。",
  },
  {
    id: "SWC-112-01",
    severity: "HIGH",
    title: "delegatecall 任意代码执行",
    location: "SpenderV2.execute() L33",
    description: "白名单地址可通过 `execute()` 传入任意 `impl` 合约执行 delegatecall，可修改合约 storage、修改 owner、转移资产。",
    impact: "等价于任意代码执行漏洞，攻击面极大。",
    recommendation: "限制可调用 `impl` 白名单，或完全移除通用 delegatecall 接口。",
  },
  {
    id: "SWC-115-01",
    severity: "MEDIUM",
    title: "白名单变更无事件日志",
    location: "SpenderV2.addToWhitelist() L22",
    description: "`addToWhitelist` 修改关键权限状态时未 emit 事件，导致链上监控系统无法捕获权限变更。",
    impact: "安全监控盲区，白名单可被悄悄扩展而外部无感知。",
    recommendation: "添加 `emit WhitelistUpdated(bot, true)` 事件日志。",
  },
  {
    id: "SWC-100-01",
    severity: "LOW",
    title: "单一 Owner 中心化风险",
    location: "全合约",
    description: "所有特权操作仅由单一 `owner` 地址控制，私钥泄露即全局沦陷。",
    impact: "单点故障风险，owner 私钥被盗等价于合约完全失陷。",
    recommendation: "引入多签（Gnosis Safe）或时间锁（TimeLock）机制。",
  },
];

// 风险评分
function computeScore(findings: Finding[]) {
  let score = 100;
  findings.forEach(f => {
    if (f.severity === "CRITICAL") score -= 30;
    else if (f.severity === "HIGH")   score -= 15;
    else if (f.severity === "MEDIUM") score -= 7;
    else if (f.severity === "LOW")    score -= 2;
  });
  return Math.max(0, score);
}

const SCORE = computeScore(FINDINGS);

// 高亮危险关键词
function highlight(line: string, i: number) {
  const dangerWords = ["transferFrom", "selfdestruct", "delegatecall", "whitelist[msg.sender]", "type(uint256).max"];
  const warnWords = ["require", "owner", "payable", "external"];
  const commentStyle = line.trim().startsWith("//") || line.trim().startsWith("*") || line.trim().startsWith("/*");
  if (commentStyle) {
    const isWarning = line.includes("⚠");
    return (
      <span key={i} className={isWarning ? "text-amber-400/90" : "text-green-600/60"}>
        {line}
      </span>
    );
  }
  const parts = line.split(/(\b(?:transferFrom|selfdestruct|delegatecall|type\(uint256\)\.max|whitelist\[msg\.sender\]|require|owner|payable|external|mapping|address|uint256|bool|bytes|pragma|contract|function|modifier|event|struct)\b)/g);
  return (
    <span key={i}>
      {parts.map((part, j) => {
        if (dangerWords.some(d => part === d || part.includes(d)))
          return <span key={j} className="text-red-400 font-semibold">{part}</span>;
        if (warnWords.includes(part))
          return <span key={j} className="text-sky-400">{part}</span>;
        if (/^(pragma|contract|function|modifier|event|struct|mapping|address|uint256|bool|bytes)$/.test(part))
          return <span key={j} className="text-violet-400">{part}</span>;
        return <span key={j} className="text-slate-300/80">{part}</span>;
      })}
    </span>
  );
}

export function ContractAuditPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>("SWC-107-01");
  const [activeTab, setActiveTab] = useState<"code" | "findings" | "score">("findings");

  const spenderAddr = snapshot.approval?.spenderAddress ?? "0xSPEND…d44";
  const sevCount = {
    CRITICAL: FINDINGS.filter(f => f.severity === "CRITICAL").length,
    HIGH: FINDINGS.filter(f => f.severity === "HIGH").length,
    MEDIUM: FINDINGS.filter(f => f.severity === "MEDIUM").length,
    LOW: FINDINGS.filter(f => f.severity === "LOW").length,
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-violet-400"/>
            <h3 className="text-[13px] font-semibold text-foreground/90">合约安全审计</h3>
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[9.5px] font-bold text-violet-400">
              AI 静态分析
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{spenderAddr}</p>
        </div>
        {/* 总评分 */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex size-14 items-center justify-center rounded-full border-2 font-mono text-lg font-bold",
            SCORE < 30 ? "border-red-500 text-red-400 bg-red-500/10"
              : SCORE < 60 ? "border-orange-500 text-orange-400 bg-orange-500/10"
              : "border-amber-500 text-amber-400 bg-amber-500/10"
          )}>
            {SCORE}
          </div>
          <span className="mt-1 text-[9.5px] text-muted-foreground">安全评分</span>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-4 divide-x divide-border/40 border-b border-border/40">
        {(["CRITICAL","HIGH","MEDIUM","LOW"] as Severity[]).map(sev => {
          const s = SEV_STYLE[sev];
          return (
            <div key={sev} className="flex flex-col items-center py-2.5">
              <span className={cn("font-mono text-xl font-bold", sev === "CRITICAL" ? "text-red-400" : sev === "HIGH" ? "text-orange-400" : sev === "MEDIUM" ? "text-amber-400" : "text-sky-400")}>
                {sevCount[sev as keyof typeof sevCount]}
              </span>
              <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] font-bold mt-0.5", s.badge)}>{sev}</span>
            </div>
          );
        })}
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-border/40">
        {(["findings", "code", "score"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-[11.5px] font-semibold transition-colors",
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "findings" ? `检测结果 (${FINDINGS.length})` : tab === "code" ? "反编译代码" : "综合评分"}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="max-h-[420px] overflow-y-auto">
        {activeTab === "findings" && (
          <div className="divide-y divide-border/30">
            {FINDINGS.map(f => {
              const s = SEV_STYLE[f.severity];
              const expanded = expandedId === f.id;
              return (
                <div key={f.id} className={cn("border-l-2 transition-colors", s.border, expanded ? "bg-secondary/25" : "hover:bg-secondary/15")}>
                  <button
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandedId(expanded ? null : f.id)}
                  >
                    <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold", s.badge)}>
                      {f.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-foreground/90">{f.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{f.location} · {f.id}</p>
                    </div>
                    {expanded ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"/> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"/>}
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 space-y-2.5 text-[11.5px]">
                      <div>
                        <p className="text-muted-foreground/70 font-semibold text-[10px] uppercase tracking-wider mb-1">漏洞描述</p>
                        <p className="text-foreground/80 leading-relaxed">{f.description}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/70 font-semibold text-[10px] uppercase tracking-wider mb-1">风险影响</p>
                        <p className="text-foreground/80 leading-relaxed">{f.impact}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
                        <p className="text-[10px] font-semibold text-emerald-400 mb-0.5">修复建议</p>
                        <p className="text-foreground/75 leading-relaxed">{f.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "code" && (
          <div className="bg-[#0a0e1a] p-0">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <span className="font-mono text-[10px] text-white/30">SPENDER_CONTRACT_v2.sol — 反编译输出</span>
              <button
                onClick={() => { navigator.clipboard.writeText(PSEUDO_CODE).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                {copied ? <CheckCheck className="size-3 text-emerald-400"/> : <Copy className="size-3"/>}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6">
              {PSEUDO_CODE.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 w-6 shrink-0 select-none text-right text-white/15">{i+1}</span>
                  {highlight(line, i)}
                </div>
              ))}
            </pre>
          </div>
        )}

        {activeTab === "score" && (
          <div className="p-5 space-y-4">
            {/* 雷达形式的评分维度 */}
            {[
              { label: "访问控制",     score: 12, max: 25, color: "bg-red-500" },
              { label: "输入验证",     score: 10, max: 25, color: "bg-orange-500" },
              { label: "数学安全",     score: 20, max: 20, color: "bg-emerald-500" },
              { label: "拒绝服务防护", score: 15, max: 15, color: "bg-emerald-500" },
              { label: "可升级性风险", score: 3,  max: 15, color: "bg-red-500" },
            ].map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground/75">{d.label}</span>
                  <span className="font-mono font-semibold text-foreground">{d.score}/{d.max}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary/60">
                  <div className={cn("h-full rounded-full transition-all", d.color)} style={{ width: `${(d.score/d.max)*100}%` }}/>
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-[12px] text-red-300/80">
              <AlertTriangle className="mb-1 size-4 text-red-400"/>
              该合约综合安全评分 <span className="font-bold text-red-400">{SCORE}/100</span>，存在严重漏洞，建议立即停止与此合约的所有交互并撤销相关授权。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
