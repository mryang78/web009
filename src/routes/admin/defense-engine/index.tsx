import { createFileRoute } from "@tanstack/react-router";
import { DefenseEngineClient } from "@/features/admin/defense-engine/client";

export const Route = createFileRoute("/admin/defense-engine/")({
  head: () => ({
    meta: [
      { title: "防御规则引擎 · Web3 Studio" },
      { name: "description", content: "自动化防御规则引擎 — 可视化条件触发规则、实时拦截日志与规则编辑器。" },
    ],
  }),
  component: DefenseEngineClient,
});
