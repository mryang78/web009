"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  variant: "success" | "error";
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within AdminToastProvider");
  return ctx;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((variant: ToastItem["variant"], message: string) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value: ToastContextValue = {
    success: (message: string) => push("success", message),
    error: (message: string) => push("error", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-medium shadow-lg backdrop-blur",
              "animate-in slide-in-from-bottom-2 fade-in duration-200",
              t.variant === "success"
                ? "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
                : "border-red-500/25 bg-red-50 text-red-800 dark:bg-red-950/80 dark:text-red-200"
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
              className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
              aria-label="关闭"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
