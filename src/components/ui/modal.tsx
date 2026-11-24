"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isPopoverEscape } from "./escape-guard";

/** Native <dialog> modal: closes with Esc / backdrop click, animated open, blurred backdrop */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => isPopoverEscape() && e.preventDefault()}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        // text-left / font-normal: reset styles the modal would inherit when opened from inside a table cell
        "m-auto w-[calc(100%-2rem)] rounded-3xl border border-border bg-surface p-0 text-left font-normal text-fg shadow-lift",
        size === "md" ? "max-w-lg" : "max-w-2xl",
      )}
    >
      <div className="flex items-start gap-3 border-b border-border px-6 py-5">
        {icon ? <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow [&_svg]:size-5">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-xl p-2 text-muted transition hover:rotate-90 hover:bg-surface-2 hover:text-fg">
          <X className="size-5" />
        </button>
      </div>
      {open ? children : null}
    </dialog>
  );
}
