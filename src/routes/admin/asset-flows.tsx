import { createFileRoute } from "@tanstack/react-router";
import { AssetFlowsClient } from "@/features/admin/asset-flows/asset-flows-client";
import { assetFlowEdges, assetFlowNodes } from "@/lib/admin/wallet-security-data";
export const Route = createFileRoute("/admin/asset-flows")({
 head: () => ({ meta: [{ title: "资产流转 · Web3 Studio" }, { name: "description", content: "追踪资产流转路径。" }, { property: "og:title", content: "资产流转 · Web3 Studio" }, { property: "og:description", content: "追踪资产流转路径。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: () => <AssetFlowsClient nodes={assetFlowNodes} edges={assetFlowEdges} />,
});
