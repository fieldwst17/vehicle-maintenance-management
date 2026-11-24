"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

/** Search box that updates ?q= in the URL (300ms debounce) */
export function SearchInput({ placeholder = "ค้นหา…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value) next.set("q", value);
      else next.delete("q");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <div className="group relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-9 text-sm shadow-soft transition-all hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
      />
      {pending ? <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" /> : null}
    </div>
  );
}

/** Date range filter (?from=&to=) with current-month / last-month / this-year shortcuts */
export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (f: string, t: string) => {
    const next = new URLSearchParams(params);
    next.set("from", f);
    next.set("to", t);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const now = new Date();
  const presets = [
    { label: "เดือนนี้", f: new Date(now.getFullYear(), now.getMonth(), 1), t: new Date(now.getFullYear(), now.getMonth() + 1, 0) },
    { label: "เดือนที่แล้ว", f: new Date(now.getFullYear(), now.getMonth() - 1, 1), t: new Date(now.getFullYear(), now.getMonth(), 0) },
    { label: "ปีนี้", f: new Date(now.getFullYear(), 0, 1), t: new Date(now.getFullYear(), 11, 31) },
  ];
  const dateInput =
    "h-10 rounded-xl border border-border bg-surface px-3 text-sm shadow-soft transition hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" aria-label="ตั้งแต่วันที่" value={from} max={to} onChange={(e) => e.target.value && apply(e.target.value, to)} className={dateInput} />
      <span className="text-sm text-muted">ถึง</span>
      <input type="date" aria-label="ถึงวันที่" value={to} min={from} onChange={(e) => e.target.value && apply(from, e.target.value)} className={dateInput} />
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-soft">
        {presets.map((p) => {
          const active = ymd(p.f) === from && ymd(p.t) === to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(ymd(p.f), ymd(p.t))}
              className={cn(
                "rounded-lg px-2.5 py-1 text-sm transition-all active:scale-95",
                active ? "bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {pending ? <Spinner className="text-primary" /> : null}
    </div>
  );
}

/** Filter tabs that set ?{param}=value, with an animated active pill */
export function FilterTabs({ param, options }: { param: string; options: { value: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get(param) ?? "";

  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1 shadow-soft">
      {options.map((o) => {
        const next = new URLSearchParams(params);
        if (o.value) next.set(param, o.value);
        else next.delete(param);
        const isActive = active === o.value;
        return (
          <Link
            key={o.value}
            href={`${pathname}?${next.toString()}`}
            scroll={false}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm transition-all duration-200",
              isActive ? "bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", isActive ? "bg-white/20" : "bg-surface-2")}>{o.count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
