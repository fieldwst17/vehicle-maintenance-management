"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Toast = { id: number; ok: boolean; message: string };
const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/** Toast notifications at the bottom-right corner; auto-dismiss after 3.5s */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-surface/95 p-3.5 pr-2 shadow-lift backdrop-blur animate-toast-in",
              t.ok ? "border-success/30" : "border-danger/30",
            )}
          >
            {t.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />}
            <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-muted transition hover:bg-surface-2 hover:text-fg" aria-label="ปิด">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
