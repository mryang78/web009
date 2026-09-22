import { createFileRoute } from "@tanstack/react-router";
import { AttackCasesClient } from "@/features/admin/attack-cases/client";
export const Route = createFileRoute("/admin/attack-cases")({
 head: () => ({ meta: [{ title: "攻击案例库 · Web3 Studio" }, { name: "description", content: "查看典型攻击案例。" }, { property: "og:title", content: "攻击案例库 · Web3 Studio" }, { property: "og:description", content: "查看典型攻击案例。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AttackCasesClient,
});
