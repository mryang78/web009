import { createFileRoute } from "@tanstack/react-router";
import { ThreatFeedClient } from "@/features/admin/threat-feed/client";

export const Route = createFileRoute("/admin/threat-feed/")({
  head: () => ({
    meta: [
      { title: "实时威胁情报流 · Web3 Studio" },
      { name: "description", content: "SOC 实时威胁情报监控 — 攻击事件流、IOC 追踪与自动阻断记录。" },
    ],
  }),
  component: ThreatFeedClient,
});
