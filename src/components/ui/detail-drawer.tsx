"use client";
// ─────────────────────────────────────────────────────────────────────────────
// 通用侧抽屉 DetailDrawer — 从右侧滑入，带遮罩 + Escape 关闭
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: string; // tailwind w-* class, default "w-[480px]"
  children: React.ReactNode;
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  width = "w-[480px]",
  children,
}: DetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* 遮罩 */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 抽屉面板 */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col border-l border-border/70 bg-background shadow-2xl transition-transform duration-300 ease-out",
          width,
          "max-w-full",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 头部 */}
        {(title || subtitle) && (
          <div className="flex shrink-0 items-start justify-between border-b border-border/60 px-5 py-4">
            <div>
              {title && (
                <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-3 mt-0.5 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/60">
          {children}
        </div>
      </div>
    </>
  );
}
