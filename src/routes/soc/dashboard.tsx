import { createFileRoute } from "@tanstack/react-router";
import { SocDashboardClient } from "@/features/soc/dashboard/dashboard-client";
export const Route = createFileRoute("/soc/dashboard")({
 head: () => ({ meta: [{ title: "安全态势看板 · Web3 Studio" }, { name: "description", content: "统一查看安全风险和威胁趋势。" }, { property: "og:title", content: "安全态势看板 · Web3 Studio" }, { property: "og:description", content: "统一查看安全风险和威胁趋势。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: SocDashboardClient,
});
