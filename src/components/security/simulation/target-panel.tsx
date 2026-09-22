import { Wallet, ShieldAlert } from "lucide-react";
import { RiskBadge } from "@/components/soc/badges";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

export function TargetPanel({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { wallet, approval, simulation } = snapshot;
  const spenderAddress = approval?.spenderAddress ?? `0xSPEND-PROTOCOL${wallet.id.toUpperCase()}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground/80">
          <Wallet className="size-4 text-sky-400" />
          目标钱包
        </div>
        <p className="mt-2 font-mono text-[12px] text-muted-foreground">{wallet.address}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
          <span className="rounded-full border border-border/70 bg-secondary/45 px-2.5 py-1 text-muted-foreground">{wallet.network}</span>
          <span className="rounded-full border border-border/70 bg-secondary/45 px-2.5 py-1 text-muted-foreground">
            ${wallet.totalValueUsd.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground/80">
          <ShieldAlert className="size-4 text-red-400" />
          可疑合约 / Spender
        </div>
        <p className="mt-2 truncate font-mono text-[12px] text-muted-foreground">{spenderAddress}</p>
        <div className="mt-3 flex items-center gap-2">
          <RiskBadge level={simulation.riskLevel} />
          <span className="font-mono text-[11.5px] text-foreground0">Risk Score {simulation.riskScore}</span>
        </div>
      </div>
    </div>
  );
}
