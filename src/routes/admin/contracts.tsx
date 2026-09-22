import { createFileRoute } from "@tanstack/react-router";
import { AdminContractsClient } from "@/features/admin/contracts/client";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({
    meta: [
      { title: "合约管理 · Web3 Studio" },
      { name: "description", content: "合约风险特征与恶意合约判定台账。" },
      { property: "og:title", content: "合约管理 · Web3 Studio" },
      { property: "og:description", content: "合约风险特征与恶意合约判定台账。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminContractsClient,
});
