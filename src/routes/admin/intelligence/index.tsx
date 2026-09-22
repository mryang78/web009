import { createFileRoute } from "@tanstack/react-router";
import { AddressIntelligenceClient } from "@/features/admin/address-intelligence/client";

export const Route = createFileRoute("/admin/intelligence/")({
  head: () => ({
    meta: [
      { title: "地址情报 · Web3 Studio" },
      { name: "description", content: "链上地址深度情报分析 — 标签、风险评分、攻击关联与 Darkweb 记录。" },
      { property: "og:title", content: "地址情报 · Web3 Studio" },
      { property: "og:description", content: "链上地址深度情报分析" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddressIntelligenceClient,
});
