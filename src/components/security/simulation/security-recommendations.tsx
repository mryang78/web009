import { ShieldCheck } from "lucide-react";
import type { AttackScenario } from "@/lib/attack-scenarios";

/** 安全建议直接来自这个场景自己的 recommendations 字段（Attack Scenario Engine），不再是与场景无关的 4 条固定文案。 */
export function SecurityRecommendations({ scenario }: { scenario: AttackScenario }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      <h3 className="text-[12.5px] font-semibold text-foreground/80">Security Recommendations</h3>
      <ul className="mt-3 space-y-2">
        {scenario.recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-foreground/80">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            {rec}
          </li>
        ))}
      </ul>
    </div>
  );
}
