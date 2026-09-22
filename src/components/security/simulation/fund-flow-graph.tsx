import { ArrowRight } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

const nodeIconBg = ["bg-sky-500/15 text-sky-400", "bg-amber-500/15 text-amber-400", "bg-red-500/15 text-red-400", "bg-emerald-500/15 text-emerald-400"];

export function FundFlowGraph({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { wallet, approval, assetMovement, simulation } = snapshot;
  const blocked = simulation.status === "BLOCKED" || approval?.status === "BLOCKED";

  const nodes = [
    { label: "源钱包（目标钱包）", sub: wallet.address },
    { label: "可疑合约（攻击合约）", sub: approval?.spenderAddress ?? `0xSPEND-PROTOCOL${wallet.id.toUpperCase()}` },
    { label: "目标地址（Mock Destination）", sub: assetMovement?.destinationAddress ?? "待推演" },
    { label: "安全引擎", sub: blocked ? "已拦截" : "监控中" },
  ];

  const amountLabel = assetMovement ? `${assetMovement.amount.toLocaleString()} ${assetMovement.symbol}` : approval?.requestedAmount ?? "待推演";
  const edgeLabels = [approval?.requestedAmount ?? "待推演", amountLabel, amountLabel, blocked ? "已拦截" : "监控中"];

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="text-[12.5px] font-semibold text-foreground/80">Fund Flow Graph</h3>
      <div className="mt-4 flex flex-col gap-3 overflow-x-auto sm:flex-row sm:items-center">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex shrink-0 items-center gap-3">
            <div className={cn("min-w-[160px] rounded-xl px-3.5 py-3 text-center", nodeIconBg[i])}>
              <div className="text-[11.5px] font-semibold">{n.label}</div>
              <div className="mt-0.5 truncate font-data text-[10px] opacity-80">{n.sub}</div>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex shrink-0 flex-col items-center gap-1 text-slate-600">
                <ArrowRight className="size-4" />
                <span className="rounded-full border border-border/70 bg-black/30 px-2 py-0.5 text-[10px] font-data text-muted-foreground">{edgeLabels[i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
