import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/soc/")({
  head: () => ({ meta: [
    { title: "安全态势中心 · Web3 Studio" },
    { name: "description", content: "Web3 资产、授权、告警与攻击链分析的统一安全态势中心。" },
    { property: "og:title", content: "安全态势中心 · Web3 Studio" },
    { property: "og:description", content: "Web3 资产、授权、告警与攻击链分析的统一安全态势中心。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <Navigate to="/soc/dashboard" />,
});