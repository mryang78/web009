import { createFileRoute } from "@tanstack/react-router";
import { AdminSecuritySimulationsPage } from "@/features/admin/security/simulations/client";
export const Route = createFileRoute("/admin/security/simulations")({
 head: () => ({ meta: [{ title: "攻击链分析 · Web3 Studio" }, { name: "description", content: "复现攻击路径并验证拦截能力。" }, { property: "og:title", content: "攻击链分析 · Web3 Studio" }, { property: "og:description", content: "复现攻击路径并验证拦截能力。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AdminSecuritySimulationsPage,
});
