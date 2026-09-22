import { createFileRoute } from "@tanstack/react-router";
import { AdminWalletsClient } from "@/features/admin/wallets/client";

export const Route = createFileRoute("/admin/wallets")({
  head: () => ({
    meta: [
      { title: "链上钱包监控 · Web3 Studio" },
      { name: "description", content: "实时读取多链钱包余额、代币、NFT 与授权状态。" },
      { property: "og:title", content: "链上钱包监控 · Web3 Studio" },
      { property: "og:description", content: "实时读取多链钱包余额、代币、NFT 与授权状态。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminWalletsClient,
});
