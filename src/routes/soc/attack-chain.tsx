import { createFileRoute } from "@tanstack/react-router";
import { AttackChainClient } from "@/features/soc/attack-chain/attack-chain-client";
export const Route = createFileRoute("/soc/attack-chain")({
 head: () => ({ meta: [{ title: "攻击链分析 · Web3 Studio" }, { name: "description", content: "分析完整攻击路径。" }, { property: "og:title", content: "攻击链分析 · Web3 Studio" }, { property: "og:description", content: "分析完整攻击路径。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AttackChainClient,
});
