import { createFileRoute } from "@tanstack/react-router";
import { AttackLibraryClient } from "@/features/soc/attack-library/library-client";
export const Route = createFileRoute("/soc/attack-library")({
 head: () => ({ meta: [{ title: "攻击案例库 · Web3 Studio" }, { name: "description", content: "检索典型链上攻击案例。" }, { property: "og:title", content: "攻击案例库 · Web3 Studio" }, { property: "og:description", content: "检索典型链上攻击案例。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AttackLibraryClient,
});
