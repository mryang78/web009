import { ArrowRight, ArrowDown, ShieldCheck, Radar } from "lucide-react";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

const TERMINAL_STATUSES = new Set(["BLOCKED", "DETECTED", "COMPLETED", "FAILED"]);

export function AssetFlow({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { wallet, approval, assetMovement, simulation } = snapshot;
  const done = TERMINAL_STATUSES.has(simulation.status);
  const blocked = simulation.status === "BLOCKED" || approval?.status === "BLOCKED";
  const extracting = !!assetMovement && !blocked;

  const nodes = [
    { label: "目标钱包", sub: wallet.address },
    { label: "攻击合约", sub: approval?.spenderAddress ?? `0xSPEND-PROTOCOL${wallet.id.toUpperCase()}` },
    { label: "Mock Destination", sub: assetMovement?.destinationAddress ?? "待推演" },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-foreground/80">Asset Flow</h3>
        <div className="flex gap-1.5">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            Simulated
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            Not Executed
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-3 @container sm:flex-row sm:items-center">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                "flex-1 rounded-xl border px-3.5 py-3 text-center",
                i === 2 && done && !blocked
                  ? "border-red-500/30 bg-red-500/[0.06]"
                  : "border-border/70 bg-secondary/45"
              )}
            >
              <div className="text-[12px] font-semibold text-foreground/90">{n.label}</div>
              <div className="mt-0.5 truncate font-mono text-[10.5px] text-foreground0">{n.sub}</div>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex shrink-0 items-center justify-center text-slate-600">
                <ArrowRight className="hidden size-4 sm:block" />
                <ArrowDown className="size-4 sm:hidden" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/45 px-3.5 py-2.5 text-[12px]">
        {blocked ? (
          <>
            <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
            <span className="text-emerald-400">安全引擎·已拦截 —— 资产异动仅为推演数字，钱包实际余额未发生变化。</span>
          </>
        ) : extracting ? (
          <>
            <Radar className="size-4 shrink-0 animate-pulse text-amber-400" />
            <span className="text-amber-400">正在推演资产异动（SIMULATED_ASSET_MOVEMENT，NOT EXECUTED）…</span>
          </>
        ) : (
          <span className="text-foreground0">等待安全引擎介入判定…</span>
        )}
      </div>
    </div>
  );
}
