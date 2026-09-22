import { createFileRoute } from "@tanstack/react-router";
import { DAppsClient } from "@/features/admin/dapps/client";
export const Route = createFileRoute("/admin/dapps")({
 head: () => ({ meta: [{ title: "DApp 样本库 · Web3 Studio" }, { name: "description", content: "管理 DApp 风险样本。" }, { property: "og:title", content: "DApp 样本库 · Web3 Studio" }, { property: "og:description", content: "管理 DApp 风险样本。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: DAppsClient,
});
