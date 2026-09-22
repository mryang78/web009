import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AttackSimulation } from "@/components/security/simulation/attack-simulation";

const searchSchema = z.object({ scenario: z.string().optional().catch(undefined), wallet: z.string().optional().catch(undefined) });
export const Route = createFileRoute("/lab/security/simulation")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "攻击路径分析 · Web3 Studio" },
    { name: "description", content: "在实时分析中复现攻击路径并验证安全防护。" },
    { property: "og:title", content: "攻击路径分析 · Web3 Studio" },
    { property: "og:description", content: "在实时分析中复现攻击路径并验证安全防护。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: SimulationPage,
});
function SimulationPage() { const search = Route.useSearch(); return <main className="security-grid min-h-screen bg-background"><AttackSimulation scenarioId={search.scenario ?? "token-drain"} walletId={search.wallet} /></main>; }