import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsClient } from "@/features/soc/approvals/approvals-client";
export const Route = createFileRoute("/soc/approvals")({
 head: () => ({ meta: [{ title: "授权分析 · Web3 Studio" }, { name: "description", content: "分析授权链路和风险。" }, { property: "og:title", content: "授权分析 · Web3 Studio" }, { property: "og:description", content: "分析授权链路和风险。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: ApprovalsClient,
});
