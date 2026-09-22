import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminToastProvider } from "@/components/admin/ui/toast";
import { SocShell } from "@/components/soc/soc-shell";

export const Route = createFileRoute("/soc")({
  component: SocLayout,
});

function SocLayout() {
  return <AdminToastProvider><SocShell><Outlet /></SocShell></AdminToastProvider>;
}