import { SIMULATION_EVENT_LABEL, type ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";
import { cn } from "@/lib/utils";

const BUSINESS_EVENT_TYPES = new Set([
  "DAPP_OPENED",
  "REQUEST_CREATED",
  "APPROVAL_REQUESTED",
  "APPROVAL_ANALYZED",
  "SIGNATURE_REQUESTED",
  "SIGNATURE_ANALYZED",
  "THREAT_DETECTED",
  "ASSET_MOVEMENT_SIMULATED",
  "PROTECTION_TRIGGERED",
]);

/** Attack Timeline：直接渲染 Simulation Engine 真实产生的事件流，不再依赖静态 timelineTemplate。 */
export function AttackTimeline({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const events = snapshot.simulation.events.filter((e) => BUSINESS_EVENT_TYPES.has(e.type) || e.type === "SIMULATION_COMPLETED");

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      <h3 className="text-[12.5px] font-semibold text-foreground/80">Attack Timeline</h3>
      {events.length === 0 ? (
        <p className="mt-3 text-[12px] text-foreground0">尚未产生任何 Simulation Event，点击 Play 开始播放。</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 text-[12px]">
              <span className="mt-0.5 w-16 shrink-0 font-mono text-foreground0">{new Date(e.timestamp).toLocaleTimeString("zh-CN", { hour12: false })}</span>
              <span
                className={cn(
                  "mt-1 size-1.5 shrink-0 rounded-full",
                  e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL" ? "bg-red-400" : e.riskLevel === "SAFE" ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-sky-400">{SIMULATION_EVENT_LABEL[e.type]}</span>
                  <span className="text-foreground/90">{e.title}</span>
                </div>
                <div className="text-[11px] text-foreground0">{e.component}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
