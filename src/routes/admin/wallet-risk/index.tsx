import { createFileRoute } from "@tanstack/react-router";
import { WalletRiskClient } from "@/features/admin/wallet-risk/client";

export const Route = createFileRoute("/admin/wallet-risk/")({
  head: () => ({
    meta: [
      { title: "钱包风险画像 · Web3 Studio" },
      { name: "description", content: "多维度钱包风险评估 — 授权暴露、交易行为分析与链上关联图谱。" },
    ],
  }),
  component: WalletRiskClient,
});
