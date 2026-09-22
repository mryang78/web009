import { Siren, ShieldAlert, FileWarning, ShieldCheck } from "lucide-react";
import { securityStats } from "@/lib/security-data";

const icons = {
  siren: Siren,
  "shield-alert": ShieldAlert,
  "file-warning": FileWarning,
  "shield-check": ShieldCheck,
};

export function SecurityStats() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {securityStats.map((s) => {
          const Icon = icons[s.icon];
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border/70 bg-card/65 p-4 sm:p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card/75">
                <Icon className="size-4.5 text-sky-400" />
              </div>
              <div className="mt-3.5 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-[28px]">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
