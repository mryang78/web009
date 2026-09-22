import {
  Wallet,
  Globe,
  BadgeCheck,
  Radar,
  KeyRound,
  FileWarning,
  Droplets,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { buildStepBlueprints, requireAttackScenario, type SimulationEventType } from "@/lib/simulation";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

const EVENT_ICON: Record<SimulationEventType, LucideIcon> = {
  DAPP_OPENED: Globe,
  REQUEST_CREATED: BadgeCheck,
  APPROVAL_REQUESTED: BadgeCheck,
  APPROVAL_ANALYZED: Radar,
  SIGNATURE_REQUESTED: KeyRound,
  SIGNATURE_ANALYZED: KeyRound,
  THREAT_DETECTED: FileWarning,
  ASSET_MOVEMENT_SIMULATED: Droplets,
  PROTECTION_TRIGGERED: ShieldCheck,
  SIMULATION_INITIALIZED: Wallet,
  SIMULATION_PAUSED: Wallet,
  SIMULATION_RESUMED: Wallet,
  SIMULATION_RESET: Wallet,
  SIMULATION_COMPLETED: ShieldCheck,
  SIMULATION_FAILED: FileWarning,
};

export function AttackCanvas({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { simulation, scenario } = snapshot;
  const attackScenario = requireAttackScenario(scenario.linkedAttackScenarioId);
  const blueprints = buildStepBlueprints(attackScenario);
  const activeIndex = simulation.currentStepIndex;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="text-[12.5px] font-semibold text-foreground/80">Attack Canvas</h3>
      <div className="mt-3 flex flex-col">
        {blueprints.map((step, i) => {
          const Icon = EVENT_ICON[step.eventType] ?? FileWarning;
          const reached = i <= activeIndex;
          const isRisky = step.riskLevel === "HIGH" || step.riskLevel === "CRITICAL";
          const isLast = i === blueprints.length - 1;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                    reached
                      ? isRisky
                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-400"
                      : "border-border/70 bg-card/45 text-slate-600"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                {!isLast && (
                  <div className="relative my-0.5 h-8 w-px overflow-hidden bg-accent/60">
                    <div
                      className={cn("absolute inset-x-0 top-0 w-px bg-sky-400 transition-all duration-500", i < activeIndex ? "h-full" : "h-0")}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-1 items-center gap-2 pb-6 last:pb-0">
                <span className={cn("text-[12.5px] font-medium", reached ? "text-foreground/90" : "text-slate-600")}>{step.title}</span>
                {reached && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">Simulated</span>}
                {reached && isLast && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
