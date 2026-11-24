"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { control } from "./field-styles";

/**
 * Searchable select: pick from the list, or type to filter it.
 * Text that isn't in the list is still accepted (the form submits whatever is in the box),
 * so a brand/model missing from the list never blocks the user.
 */
export function Combobox({
  name,
  options,
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder,
  required,
  disabled,
  emptyText = "ไม่พบในรายการ",
  allowCustom = true,
}: {
  name: string;
  options: readonly string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  emptyText?: string;
  /** Allow a value that isn't in the list (default true) */
  allowCustom?: boolean;
}) {
  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = controlledValue ?? innerValue;
  const [open, setOpen] = useState(false);
  // While typing, filter by the text; when just opened, show everything (even if a value is already chosen)
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = query?.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const exactMatch = options.some((o) => o.toLowerCase() === value.trim().toLowerCase());
  const showCustom = allowCustom && query !== null && value.trim() !== "" && !exactMatch;

  function set(v: string) {
    if (controlledValue === undefined) setInnerValue(v);
    onChange?.(v);
  }

  function choose(v: string) {
    set(v);
    setQuery(null);
    setOpen(false);
  }

  function move(delta: number) {
    if (!open) return setOpen(true);
    const next = Math.max(0, Math.min(filtered.length - 1, active + delta));
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && open) {
      // Enter picks the highlighted option instead of submitting the form
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
      else setOpen(false);
    } else if (e.key === "Escape" && open) {
      e.preventDefault(); // keep the modal open, just close the list
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(control, "h-10 pr-9 disabled:cursor-not-allowed disabled:opacity-60")}
        onFocus={() => (setOpen(true), setQuery(null), setActive(Math.max(0, options.indexOf(value))))}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery(null);
          // Not allowed to keep free text → clear it
          if (!allowCustom && !exactMatch) set("");
        }}
        onChange={(e) => {
          set(e.target.value);
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <ChevronDown aria-hidden className={cn("pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted transition-transform duration-200", open && "rotate-180")} />

      {open && !disabled ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-fade-up [animation-duration:150ms]">
          <ul ref={listRef} id={listId} role="listbox" className={cn("max-h-60 overflow-y-auto overscroll-contain p-1", filtered.length === 0 && "hidden")}>
            {filtered.map((o, i) => (
              <li
                key={o}
                role="option"
                aria-selected={o === value}
                // mousedown + preventDefault: pick before the input blurs (which would close the list)
                onMouseDown={(e) => (e.preventDefault(), choose(o))}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  i === active ? "bg-primary-soft text-primary" : "text-fg",
                )}
              >
                <span className="truncate">{o}</span>
                {o === value ? <Check className="size-4 shrink-0" /> : null}
              </li>
            ))}
          </ul>
          {filtered.length === 0 && !showCustom ? <p className="px-3 py-3 text-sm text-muted">{emptyText}</p> : null}
          {showCustom ? (
            <button
              type="button"
              onMouseDown={(e) => (e.preventDefault(), choose(value.trim()))}
              className="flex w-full items-center gap-2 border-border px-4 [ul:not(.hidden)~&]:border-t py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Plus className="size-4" /> ใช้ “{value.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
