import { createFileRoute } from "@tanstack/react-router";
import { AdminAuditLogsClient } from "@/features/admin/audit-logs/client";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "操作日志 · Web3 Studio" },
      { name: "description", content: "后台管理动作的审计留痕与查询。" },
      { property: "og:title", content: "操作日志 · Web3 Studio" },
      { property: "og:description", content: "后台管理动作的审计留痕与查询。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAuditLogsClient,
});
