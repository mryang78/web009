import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminToastProvider } from "@/components/admin/ui/toast";
import { WalletAuthProvider } from "@/lib/wallet-auth-context";
import { WalletConnectModal } from "@/components/wallet-connect-modal";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <WalletAuthProvider>
      <AdminToastProvider>
        <AdminShell>
          <Outlet />
        </AdminShell>
        <WalletConnectModal />
      </AdminToastProvider>
    </WalletAuthProvider>
  );
}
