import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsClient } from "@/features/admin/settings/client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "系统设置 · Web3 Studio" },
      { name: "description", content: "风险引擎、通知策略与平台安全边界配置。" },
      { property: "og:title", content: "系统设置 · Web3 Studio" },
      { property: "og:description", content: "风险引擎、通知策略与平台安全边界配置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSettingsClient,
});
