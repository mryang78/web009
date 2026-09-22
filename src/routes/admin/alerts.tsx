import { createFileRoute } from "@tanstack/react-router";
import { AdminAlertsClient } from "@/features/admin/alerts/client";
export const Route = createFileRoute("/admin/alerts")({
 head: () => ({ meta: [{ title: "安全告警 · Web3 Studio" }, { name: "description", content: "管理安全告警和处置状态。" }, { property: "og:title", content: "安全告警 · Web3 Studio" }, { property: "og:description", content: "管理安全告警和处置状态。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AdminAlertsClient,
});
