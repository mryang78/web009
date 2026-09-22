import { createFileRoute } from "@tanstack/react-router";
import { FundFlowClient } from "@/features/admin/fund-flow/client";

export const Route = createFileRoute("/admin/fund-flow/")({
  head: () => ({
    meta: [
      { title: "链上资金流向追踪 · Web3 Studio" },
      { name: "description", content: "攻击资金路径可视化 — 混币追踪、跨链跳转分析与资产冻结状态。" },
    ],
  }),
  component: FundFlowClient,
});
