import { createFileRoute } from "@tanstack/react-router";
import { AdminRiskRulesClient } from "@/features/admin/risk-rules/client";

export const Route = createFileRoute("/admin/risk-rules")({
  head: () => ({
    meta: [
      { title: "风险规则 · Web3 Studio" },
      { name: "description", content: "风险评分与自动处置规则集合管理。" },
      { property: "og:title", content: "风险规则 · Web3 Studio" },
      { property: "og:description", content: "风险评分与自动处置规则集合管理。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRiskRulesClient,
});
