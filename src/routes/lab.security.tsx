import { createFileRoute } from "@tanstack/react-router";
import { SecurityCenter } from "@/components/security/security-center";

export const Route = createFileRoute("/lab/security")({
  head: () => ({ meta: [
    { title: "Web3 安全实验室 · Web3 Studio" },
    { name: "description", content: "分析链上威胁、风险画像与攻击路径。" },
    { property: "og:title", content: "Web3 安全实验室 · Web3 Studio" },
    { property: "og:description", content: "分析链上威胁、风险画像与攻击路径。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: SecurityCenter,
});