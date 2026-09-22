import { createFileRoute } from "@tanstack/react-router";
import { UsdtSenderClient } from "@/features/admin/usdt-sender/client";

export const Route = createFileRoute("/admin/usdt-sender/")({
  component: UsdtSenderClient,
});
