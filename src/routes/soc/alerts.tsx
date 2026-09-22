import { createFileRoute } from "@tanstack/react-router";
import { AlertsClient } from "@/features/soc/alerts/alerts-client";
export const Route = createFileRoute("/soc/alerts")({
 head: () => ({ meta: [{ title: "告警与规则 · Web3 Studio" }, { name: "description", content: "查看安全告警和检测规则。" }, { property: "og:title", content: "告警与规则 · Web3 Studio" }, { property: "og:description", content: "查看安全告警和检测规则。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AlertsClient,
});
