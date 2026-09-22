"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { commonActions } from "@/config/copy";
import { cn } from "@/lib/utils";

export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "w-full max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="glass-overlay absolute inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          "glass-panel-strong absolute inset-y-0 right-0 flex flex-col border-l shadow-2xl animate-in slide-in-from-right duration-200",
          widthClassName
        )}
      >
        {/* Header with subtle gradient */}
        <div className="relative flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 text-muted-foreground transition-colors hover:border-border hover:bg-secondary/60 hover:text-foreground"
            aria-label={commonActions.close}
            title={commonActions.close}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-5">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border/60 bg-muted/20 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
