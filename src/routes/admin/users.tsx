import { createFileRoute } from "@tanstack/react-router";
import { UsersClient } from "@/features/admin/users/users-client";
import { userRows } from "@/lib/admin/mock";
export const Route = createFileRoute("/admin/users")({
 head: () => ({ meta: [{ title: "用户管理 · Web3 Studio" }, { name: "description", content: "查看与管理平台用户和安全状态。" }, { property: "og:title", content: "用户管理 · Web3 Studio" }, { property: "og:description", content: "查看与管理平台用户和安全状态。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: () => <UsersClient rows={userRows} />,
});
