import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-8 first:pt-0", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  change,
  changeTone = "neutral",
}: {
  label: string;
  value: string;
  change?: string;
  changeTone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <div className="text-[11.5px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-foreground">{value}</div>
      {change && (
        <div
          className={cn(
            "mt-1 text-[12px] font-medium tabular-nums",
            changeTone === "up" && "text-emerald-600 dark:text-emerald-400",
            changeTone === "down" && "text-red-600 dark:text-red-400",
            changeTone === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
