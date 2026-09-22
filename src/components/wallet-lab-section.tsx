"use client";

import { useState } from "react";
import {
  Wallet,
  ShieldAlert,
  ShieldCheck,
  FileSignature,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { OnchainWalletPanel } from "@/components/chain/onchain-wallet-panel";
import type { RiskLevel } from "@/lib/shared/types";
import { cn } from "@/lib/utils";

const RISK_STYLE: Record<RiskLevel, string> = {
  SAFE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  LOW: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  HIGH: "border-orange-500/40 bg-orange-500/10 text-orange-500",
  CRITICAL: "border-red-500/40 bg-red-500/10 text-red-500",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  SAFE: "安全",
  LOW: "低风险",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "严重风险",
};

interface SignatureScenario {
  id: string;
  kind: "Approve" | "Permit" | "Permit2";
  title: string;
  spender: string;
  payload: string;
  riskLevel: RiskLevel;
  factors: string[];
  verdict: string;
}

const SCENARIOS: SignatureScenario[] = [
  {
    id: "approve-unlimited",
    kind: "Approve",
    title: "approve(spender, 2^256-1)",
    spender: "未验证合约 · 0x1a8c…9f32",
    payload: "USDT 授权额度：Unlimited (2^256-1)，有效期：永久",
    riskLevel: "CRITICAL",
    factors: ["无限授权额度", "spender 为未验证合约", "合约部署时间少于 48 小时"],
    verdict: "拦截建议：无限额度会让 spender 随时取走全部 USDT，应改为按次精确额度。",
  },
  {
    id: "permit-2612",
    kind: "Permit",
    title: "Permit (EIP-2612) 离线授权签名",
    spender: "未知聚合器 · 0x7b41…a20e",
    payload: "value: 全部余额 · deadline: 2^256-1 · nonce: 0",
    riskLevel: "HIGH",
    factors: ["签名即授权，无需上链交易", "deadline 为无限期", "value 覆盖全部余额"],
    verdict: "拦截建议：Permit 签名不会出现在交易记录里，无限期签名等同于交出代币控制权。",
  },
  {
    id: "permit2-batch",
    kind: "Permit2",
    title: "Permit2 批量授权签名",
    spender: "跨链迁移合约 · 0x92f0…61bd",
    payload: "批量授权 4 个代币 + 1 个 NFT 系列，统一 spender",
    riskLevel: "CRITICAL",
    factors: ["一次签名授权多种资产", "包含 NFT setApprovalForAll", "目标地址命中风险名单"],
    verdict: "拦截建议：批量签名把多种资产的控制权一次性交出，典型的 Drainer 手法。",
  },
  {
    id: "approve-exact",
    kind: "Approve",
    title: "approve(spender, 500 USDC)",
    spender: "已验证路由合约",
    payload: "USDC 授权额度：500，有效期：单次交易",
    riskLevel: "LOW",
    factors: ["精确额度", "spender 已验证并开源", "无历史风险记录"],
    verdict: "可继续：额度受限且 spender 可信，风险处于可接受区间。",
  },
];

export function WalletLabSection() {
  const [address, setAddress] = useState<string | null>(null);
  const [openScenario, setOpenScenario] = useState<string | null>(null);

  return (
    <section id="wallet-lab" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Wallet className="size-3.5" />
              链上钱包安全中心
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              实时读取链上资产与授权风险
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              连接浏览器钱包或输入公开地址，实时读取多链余额、代币、NFT 与现有授权；同时预览
              Approve、Permit 和 Permit2 请求的风险判定。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            主网只读通道
          </div>
        </div>

        <OnchainWalletPanel className="mt-6" onAddressChange={setAddress} />

        <div className="mt-6 rounded-lg border border-border bg-background p-5">
                <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  <FileSignature className="size-3.5 text-primary" />
                  Approve / Permit 签名风险预览
                </h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  以下为常见授权与签名请求的风险判定。点击任意请求查看风险因素与处置建议，不会产生任何链上操作。
                </p>
                <div className="mt-4 space-y-3">
                  {SCENARIOS.map((s) => {
                    const open = openScenario === s.id;
                    const danger = s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH";
                    return (
                      <div
                        key={s.id}
                        className="overflow-hidden rounded-xl border border-border/70 bg-card"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => setOpenScenario(open ? null : s.id)}
                          className="h-auto w-full items-start justify-between rounded-none px-4 py-3 text-left hover:bg-accent/40"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-border bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                                {s.kind}
                              </span>
                              <span className="text-[13px] font-semibold text-foreground">{s.title}</span>
                            </div>
                            <div className="mt-1 truncate text-[11px] text-muted-foreground">
                              请求方：{s.spender}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                              RISK_STYLE[s.riskLevel]
                            )}
                          >
                            {RISK_LABEL[s.riskLevel]}
                          </span>
                        </Button>
                        {open && (
                          <div className="border-t border-border/70 px-4 py-3">
                            <div className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-foreground">
                              {s.payload}
                            </div>
                            <ul className="mt-3 space-y-1.5">
                              {s.factors.map((f) => (
                                <li
                                  key={f}
                                  className="flex items-start gap-2 text-[12px] text-muted-foreground"
                                >
                                  <ShieldAlert
                                    className={cn(
                                      "mt-px size-3.5 shrink-0",
                                      danger ? "text-red-500" : "text-emerald-500"
                                    )}
                                  />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <div
                              className={cn(
                                "mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px] leading-relaxed",
                                danger
                                  ? "border-red-500/30 bg-red-500/5 text-red-500"
                                  : "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                              )}
                            >
                              {danger ? (
                                <ShieldAlert className="mt-px size-3.5 shrink-0" />
                              ) : (
                                <ShieldCheck className="mt-px size-3.5 shrink-0" />
                              )}
                              {s.verdict}
                            </div>
                            <div className="mt-2 font-mono text-[10.5px] text-muted-foreground/70">
                              ANALYSIS_REF:{s.id}-{address?.slice(2, 10) ?? "pending"}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
        </div>


      </Reveal>
    </section>
  );
}
