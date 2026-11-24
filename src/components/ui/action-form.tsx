"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action-state";
import { Button } from "./button";
import type { ButtonSize, ButtonVariant } from "./button-styles";
import { Modal } from "./modal";
import { SubmitButton } from "./submit-button";
import { useToast } from "./toast";
import { useReadOnly } from "@/components/auth/read-only";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Runs `action`, shows a toast, and calls onSuccess when it returns ok */
function useActionWithToast(action: Action, onSuccess?: () => void) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => {
    if (!state) return;
    toast({ ok: state.ok, message: state.message });
    if (state.ok) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return { state, formAction, pending };
}

/**
 * Button that opens a modal holding a form wired to a server action.
 * On success: toast, close, and clear the form. On failure: toast + error message in the form.
 */
export function ModalForm({
  action,
  triggerLabel,
  triggerIcon,
  triggerVariant = "primary",
  triggerSize = "md",
  title,
  description,
  icon,
  submitLabel = "บันทึก",
  size,
  children,
}: {
  action: Action;
  triggerLabel: ReactNode;
  triggerIcon?: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  title: string;
  description?: string;
  icon?: ReactNode;
  submitLabel?: string;
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (useReadOnly()) return null; // guest: hide add/edit buttons

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerIcon}
        {triggerLabel}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} icon={icon} size={size}>
        {/* Rendered only while open, so form state resets every time */}
        <ModalFormBody action={action} submitLabel={submitLabel} onClose={() => setOpen(false)}>
          {children}
        </ModalFormBody>
      </Modal>
    </>
  );
}

function ModalFormBody({ action, submitLabel, onClose, children }: { action: Action; submitLabel: string; onClose: () => void; children: ReactNode }) {
  const { state, formAction } = useActionWithToast(action, onClose);
  return (
    <form action={formAction} className="flex flex-col">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
        {children}
        {state && !state.ok ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface-2/60 px-6 py-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          ยกเลิก
        </Button>
        <SubmitButton pendingText="กำลังบันทึก…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

/** Inline form (no modal), e.g. adding a work order line or recording mileage */
export function InlineForm({
  action,
  children,
  className,
  resetOnSuccess = true,
  readOnlyMode = "hide",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Guest mode: "hide" = don't render, "disable" = render the form but disable every field (to show values) */
  readOnlyMode?: "hide" | "disable";
}) {
  const readOnly = useReadOnly();
  const [formKey, setFormKey] = useState(0);
  const { formAction } = useActionWithToast(action, () => resetOnSuccess && setFormKey((k) => k + 1));
  if (readOnly && readOnlyMode === "hide") return null;
  return (
    <form key={formKey} action={formAction} className={className}>
      <fieldset disabled={readOnly} className="contents">
        {children}
      </fieldset>
    </form>
  );
}

/** Single-action button (e.g. change status) with hidden fields; optional confirm before submitting */
export function ActionButton({
  action,
  fields,
  confirm,
  children,
  variant = "secondary",
  size = "sm",
}: {
  action: Action;
  fields: Record<string, string>;
  confirm?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const readOnly = useReadOnly();
  const { formAction } = useActionWithToast(action);
  if (readOnly) return null; // guest: hide action buttons
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} size={size}>
        {children}
      </SubmitButton>
    </form>
  );
}
