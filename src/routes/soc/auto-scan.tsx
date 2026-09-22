import { createFileRoute } from "@tanstack/react-router";
import { AutoScanClient } from "@/features/soc/auto-scan/auto-scan-client";
export const Route = createFileRoute("/soc/auto-scan")({
 head: () => ({ meta: [{ title: "自动扫描 · Web3 Studio" }, { name: "description", content: "执行资产安全扫描。" }, { property: "og:title", content: "自动扫描 · Web3 Studio" }, { property: "og:description", content: "执行资产安全扫描。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AutoScanClient,
});
