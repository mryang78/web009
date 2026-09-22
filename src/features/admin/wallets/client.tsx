"use client";

import { Radio, ShieldCheck, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { OnchainWalletPanel } from "@/components/chain/onchain-wallet-panel";

export function AdminWalletsClient() {
  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "资产与钱包" }, { label: "钱包管理" }]}
        title="链上钱包监控"
        description="连接浏览器钱包或查询公开地址，实时读取四条主网的资产、NFT 与授权状态。"
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Radio, label: "数据通道", value: "主网实时读取" },
          { icon: WalletCards, label: "支持网络", value: "4 条 EVM 主网" },
          { icon: ShieldCheck, label: "访问权限", value: "公开数据只读" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"><item.icon className="size-4" /></div>
            <div><div className="text-xs text-muted-foreground">{item.label}</div><div className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</div></div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <OnchainWalletPanel />
      </div>
    </div>
  );
}
