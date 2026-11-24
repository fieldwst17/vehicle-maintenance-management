"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Package, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { control } from "@/components/ui/field-styles";
import { formatMoney } from "@/lib/format";
import { fetchJson, queryKeys, type PartHit } from "@/lib/query-keys";

/** Waits until typing pauses before the value changes (so the API isn't hit on every keystroke) */
function useDebounced<T>(value: T, ms = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Part picker that searches the server as you type (TanStack Query: cached per search term, previous
 * results stay visible while the next ones load). Shows live stock, so you see what's left before choosing.
 * Submits the chosen part's id as `name`.
 */
export function PartPicker({ name, onSelect }: { name: string; onSelect?: (part: PartHit | null) => void }) {
  const [selected, setSelected] = useState<PartHit | null>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const q = useDebounced(text.trim());

  const { data = [], isFetching, isError, isPending } = useQuery({
    queryKey: queryKeys.parts(q),
    queryFn: ({ signal }) => fetchJson<PartHit[]>(`/api/parts?q=${encodeURIComponent(q)}`, signal),
    enabled: open, // fetch only once the list is opened
    placeholderData: keepPreviousData,
    staleTime: 10_000, // stock changes: keep it fresh
  });

  function choose(part: PartHit | null) {
    setSelected(part);
    onSelect?.(part);
    setText("");
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const next = Math.max(0, Math.min(data.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && open) {
      e.preventDefault(); // pick, don't submit the form
      if (data[active]) choose(data[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Backspace" && !text && selected) {
      choose(null);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className={cn(control, "flex h-10 items-center gap-2 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15")}>
        {selected && !open ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Package className="size-4 shrink-0 text-primary" />
            <span className="truncate">{selected.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted">{selected.partNumber}</span>
          </span>
        ) : (
          <Search className="size-4 shrink-0 text-muted" />
        )}
        <input
          value={text}
          onChange={(e) => (setText(e.target.value), setActive(0), setOpen(true))}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={selected ? "" : "ค้นหาชื่อหรือรหัสอะไหล่…"}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className={cn("h-full min-w-0 bg-transparent outline-none placeholder:text-muted/70", selected && !open ? "w-0 flex-none" : "flex-1")}
        />
        {isFetching && open ? <Loader2 className="size-4 shrink-0 animate-spin text-muted" /> : null}
        {selected ? (
          <button type="button" onMouseDown={(e) => (e.preventDefault(), choose(null))} aria-label="ล้างอะไหล่ที่เลือก" className="rounded-md p-0.5 text-muted transition hover:bg-surface-2 hover:text-fg">
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
        )}
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-[select-in_160ms_cubic-bezier(0.22,1,0.36,1)]">
          {isPending ? (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted"><Loader2 className="size-4 animate-spin" />กำลังค้นหา…</p>
          ) : isError ? (
            <p className="px-3 py-3 text-sm text-danger">โหลดรายการอะไหล่ไม่สำเร็จ</p>
          ) : data.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">{q ? `ไม่พบอะไหล่ “${q}”` : "ยังไม่มีอะไหล่ในระบบ"}</p>
          ) : (
            <ul ref={listRef} id={listId} role="listbox" className={cn("max-h-72 overflow-y-auto overscroll-contain p-1 transition-opacity", isFetching && "opacity-60")}>
              {data.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={p.id === selected?.id}
                  onMouseDown={(e) => (e.preventDefault(), choose(p))}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", i === active && "bg-primary-soft")}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate", i === active && "text-primary")}>{p.name}</p>
                    <p className="font-mono text-xs text-muted">{p.partNumber} · {formatMoney(p.unitCost)}/{p.unit}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                      p.stockQuantity <= 0 ? "bg-danger-soft text-danger" : p.low ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
                    )}
                  >
                    {p.stockQuantity <= 0 ? "หมดสต็อก" : `คงเหลือ ${p.stockQuantity.toLocaleString("th-TH")} ${p.unit}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
