import { createFileRoute } from "@tanstack/react-router";
import { AdminAddressesClient } from "@/features/admin/addresses/client";

export const Route = createFileRoute("/admin/addresses")({
  head: () => ({
    meta: [
      { title: "风险地址名单 · Web3 Studio" },
      { name: "description", content: "恶意地址与钓鱼合约的拦截名单管理。" },
      { property: "og:title", content: "风险地址名单 · Web3 Studio" },
      { property: "og:description", content: "恶意地址与钓鱼合约的拦截名单管理。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAddressesClient,
});
