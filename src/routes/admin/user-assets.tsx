import { createFileRoute } from "@tanstack/react-router";
import { UserAssetsClient } from "@/features/admin/user-assets/user-assets-client";
import { userAssetRows } from "@/lib/admin/wallet-security-data";
export const Route = createFileRoute("/admin/user-assets")({
 head: () => ({ meta: [{ title: "用户资产 · Web3 Studio" }, { name: "description", content: "查看用户资产和风险状态。" }, { property: "og:title", content: "用户资产 · Web3 Studio" }, { property: "og:description", content: "查看用户资产和风险状态。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: () => <UserAssetsClient rows={userAssetRows} />,
});
