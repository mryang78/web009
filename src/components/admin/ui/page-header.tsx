import Link from "@/components/app-link";
import type { ReactNode } from "react";

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb: { label: string; href?: string }[];
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 border-b border-border/50 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-[12px] text-muted-foreground/60">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="select-none text-border/80">/</span>}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="transition-colors hover:text-foreground/80"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-muted-foreground">{b.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Title with left accent bar */}
          <div className="mt-2 flex items-center gap-0">
            <span className="mr-3 inline-block h-6 w-[3px] shrink-0 rounded-full bg-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
          </div>

          {description && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
