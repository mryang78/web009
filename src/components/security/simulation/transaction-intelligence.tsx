import { RiskBadge } from "@/components/soc/badges";
import type { ScenarioPlayerSnapshot } from "@/lib/attack-scenarios/scenario-player";

export function TransactionIntelligence({ snapshot }: { snapshot: ScenarioPlayerSnapshot }) {
  const { assetMovement, approval, signature, simulation } = snapshot;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "分析哈希", value: assetMovement?.mockTxHash ?? "尚未生成", mono: true },
    { label: "调用方法", value: signature ? signature.type : approval ? "approve()" : "-" },
    { label: "代币", value: assetMovement?.symbol ?? "-" },
    { label: "金额", value: assetMovement ? assetMovement.amount.toLocaleString() : approval?.requestedAmount ?? "-" },
    { label: "Mock Signature", value: signature?.mockSignature ?? "未产生签名", mono: true },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card/65 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-foreground/80">Transaction Intelligence</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
分析数据
          </span>
          <RiskBadge level={simulation.riskLevel} />
        </div>
      </div>
      <dl className="mt-3 space-y-2 text-[12px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-foreground0">{r.label}</dt>
            <dd className={r.mono ? "truncate font-mono text-foreground/80" : "truncate text-foreground/80"}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border/70 pt-3 text-[11px] text-foreground0">
        该哈希及交易数据均为虚拟分析字符串，不对应任何真实链上交易。
      </p>
    </div>
  );
}
