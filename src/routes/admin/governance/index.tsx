import { createFileRoute } from "@tanstack/react-router";
import { GovernanceClient } from "@/features/admin/governance/client";

export const Route = createFileRoute("/admin/governance/")({
  head: () => ({
    meta: [
      { title: "治理攻击监控 · Web3 Studio" },
      { name: "description", content: "链上治理提案风险评估 — 闪电贷投票检测、鲸鱼积累追踪与仲裁风险分析。" },
    ],
  }),
  component: GovernanceClient,
});
