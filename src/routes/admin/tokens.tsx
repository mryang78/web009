import { createFileRoute } from "@tanstack/react-router";
import { TokensClient } from "@/features/admin/tokens/client";
export const Route = createFileRoute("/admin/tokens")({
 head: () => ({ meta: [{ title: "Token 样本库 · Web3 Studio" }, { name: "description", content: "管理 Token 风险样本。" }, { property: "og:title", content: "Token 样本库 · Web3 Studio" }, { property: "og:description", content: "管理 Token 风险样本。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: TokensClient,
});
