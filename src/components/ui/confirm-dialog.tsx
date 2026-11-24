"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export type ConfirmTone = "primary" | "danger" | "info";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  /** null = alert style (a single OK button, no cancel) */
  cancelLabel?: string | null;
  tone?: ConfirmTone;
};

const toneStyles: Record<ConfirmTone, { icon: ReactNode; ring: string }> = {
  danger: { icon: <AlertTriangle />, ring: "bg-danger-soft text-danger ring-danger/20" },
  primary: { icon: <HelpCircle />, ring: "bg-primary-soft text-primary ring-primary/20" },
  info: { icon: <Info />, ring: "bg-primary-soft text-primary ring-primary/20" },
};

/**
 * Styled replacement for window.confirm / window.alert.
 *
 *   const [confirm, dialog] = useConfirm();
 *   if (await confirm({ title: "ลบรายการนี้?", tone: "danger" })) ...
 *   return <>{dialog}...</>
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false); // a previous dialog still open counts as cancelled
    setOptions(next);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  return [confirm, <ConfirmDialog key="confirm" options={options} onSettle={settle} />];
}

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions | null; onSettle: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = options !== null;
  // Keep the last options while the close animation would run, so the content doesn't blank out
  const [shown, setShown] = useState<ConfirmOptions | null>(options);
  if (options && options !== shown) setShown(options);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const tone = shown?.tone ?? "primary";
  const { icon, ring } = toneStyles[tone];
  const isAlert = shown?.cancelLabel === null;

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby="confirm-title"
      // Esc / backdrop click = cancel
      onCancel={(e) => (e.preventDefault(), onSettle(false))}
      onClick={(e) => e.target === ref.current && onSettle(false)}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-border bg-surface p-0 text-left font-normal text-fg shadow-lift"
    >
      {shown ? (
        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          <span className={cn("grid size-14 place-items-center rounded-2xl ring-8 [&_svg]:size-7", ring, tone === "danger" && "animate-[wiggle_0.5s_ease-in-out_0.15s]")}>{icon}</span>
          <h2 id="confirm-title" className="mt-5 text-lg font-semibold">
            {shown.title}
          </h2>
          {shown.message ? <div className="mt-1.5 text-sm text-muted">{shown.message}</div> : null}
          <div className={cn("mt-6 grid w-full gap-2", !isAlert && "grid-cols-2")}>
            {isAlert ? null : (
              <Button type="button" variant="secondary" onClick={() => onSettle(false)}>
                {shown.cancelLabel ?? "ยกเลิก"}
              </Button>
            )}
            <Button type="button" variant={tone === "danger" ? "danger" : "primary"} onClick={() => onSettle(true)} autoFocus>
              {shown.confirmLabel ?? (isAlert ? "ตกลง" : "ยืนยัน")}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
