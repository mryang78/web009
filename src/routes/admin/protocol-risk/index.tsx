import { createFileRoute } from "@tanstack/react-router";
import { ProtocolRiskClient } from "@/features/admin/protocol-risk/client";

export const Route = createFileRoute("/admin/protocol-risk/")({
  head: () => ({
    meta: [
      { title: "DeFi 协议风险矩阵 · Web3 Studio" },
      { name: "description", content: "主流 DeFi 协议综合安全评级 — TVL 监控、审计状态与历史漏洞记录。" },
    ],
  }),
  component: ProtocolRiskClient,
});
