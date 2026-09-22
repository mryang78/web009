import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsClient } from "@/features/admin/approvals/approvals-client";
export const Route = createFileRoute("/admin/approvals")({
 head: () => ({ meta: [{ title: "授权记录 · Web3 Studio" }, { name: "description", content: "复核授权记录与风险事件。" }, { property: "og:title", content: "授权记录 · Web3 Studio" }, { property: "og:description", content: "复核授权记录与风险事件。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: ApprovalsClient,
});
