import { createFileRoute } from "@tanstack/react-router";
import { WalletSimulatorClient } from "@/features/admin/wallet-simulator/wallet-simulator-client";
import { userAssetRows, walletRows } from "@/lib/admin/wallet-security-data";
export const Route = createFileRoute("/admin/wallet-simulator")({
 head: () => ({ meta: [{ title: "钱包安全分析 · Web3 Studio" }, { name: "description", content: "验证钱包授权和风险防护流程。" }, { property: "og:title", content: "钱包安全分析 · Web3 Studio" }, { property: "og:description", content: "验证钱包授权和风险防护流程。" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: () => <WalletSimulatorClient wallets={walletRows} users={userAssetRows} />,
});
