"use client";

import { useRef, useState } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { markPopoverEscape } from "./escape-guard";
import { control } from "./field-styles";

export type SelectOption = { value: string; label: string };

// Radix items can't have an empty value, so the "none" choice (placeholder) uses this sentinel
const NONE = "__none__";

/**
 * Dropdown built on Radix Select (keyboard support, typeahead, animated list), a drop-in for the old native <select>.
 * The form value goes through its own input, so the server action receives exactly what it did before
 * ("" for none), and `required` still triggers the browser's validation message.
 */
export function Select({
  name,
  options,
  placeholder,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  required,
  disabled,
  className,
}: {
  name: string;
  options: SelectOption[];
  /** Text shown when nothing is chosen; also added as the first item so the choice can be cleared (unless required) */
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = controlledValue ?? innerValue;
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Inside a native <dialog> (top layer), the list must be portaled into the dialog or it renders behind it
  const [container, setContainer] = useState<HTMLElement | null>(null);

  function change(v: string) {
    const next = v === NONE ? "" : v;
    if (controlledValue === undefined) setInnerValue(next);
    onValueChange?.(next);
  }

  const clearable = placeholder !== undefined && !required;

  return (
    <div className="relative">
      <RadixSelect.Root
        value={value === "" ? undefined : value}
        onValueChange={change}
        disabled={disabled}
        onOpenChange={(open) => open && setContainer(triggerRef.current?.closest("dialog") ?? null)}
      >
        <RadixSelect.Trigger
          ref={triggerRef}
          className={cn(
            control,
            "group flex h-10 w-full cursor-pointer items-center justify-between gap-2 text-left",
            "data-[placeholder]:text-muted/70 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/15",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          <span className="truncate">
            <RadixSelect.Value placeholder={placeholder ?? "— เลือก —"} />
          </span>
          <RadixSelect.Icon asChild>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal container={container}>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            // Esc closes only the list, not the modal it's in (see escape-guard)
            onEscapeKeyDown={markPopoverEscape}
            className={cn(
              "z-50 w-[var(--radix-select-trigger-width)] min-w-[10rem] overflow-hidden rounded-xl border border-border bg-surface text-fg shadow-lift",
              "max-h-[min(18rem,var(--radix-select-content-available-height))]",
              "origin-[var(--radix-select-content-transform-origin)] data-[state=open]:animate-[select-in_160ms_cubic-bezier(0.22,1,0.36,1)]",
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-muted">
              <ChevronUp className="size-4" />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport className="p-1">
              {clearable ? <Item value={NONE} label={placeholder} muted /> : null}
              {options.map((o) => (
                <Item key={o.value} value={o.value} label={o.label} />
              ))}
            </RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-muted">
              <ChevronDown className="size-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {/* The value the form submits. A visually hidden text input (not type="hidden") so `required` is validated;
          when the browser focuses it to show the message, hand focus to the trigger */}
      <input
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        onFocus={() => triggerRef.current?.focus()}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
      />
    </div>
  );
}

function Item({ value, label, muted }: { value: string; label: string; muted?: boolean }) {
  return (
    <RadixSelect.Item
      value={value}
      className={cn(
        "relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
        "data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary data-[state=checked]:font-medium",
        muted && "text-muted",
      )}
    >
      <RadixSelect.ItemText>{label}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator>
        <Check className="size-4 text-primary" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
