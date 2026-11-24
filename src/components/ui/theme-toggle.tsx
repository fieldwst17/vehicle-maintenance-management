"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark" | "system";
export const THEME_KEY = "fc-theme";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "โหมดสว่าง", icon: Sun },
  { value: "dark", label: "โหมดมืด", icon: Moon },
  { value: "system", label: "ตามระบบ", icon: Monitor },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Light / dark / system theme toggle (saved in localStorage, applied by the script in the root layout before first paint) */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  // Read the saved value after mount (localStorage isn't available on the server)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage after mount
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* storage blocked: use the system theme */
    }
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: applies to this page only */
    }
  }

  const index = options.findIndex((o) => o.value === theme);

  return (
    <div role="radiogroup" aria-label="ธีมสี" className={cn("relative grid grid-cols-3 rounded-xl border border-border bg-surface-2/70 p-1", className)}>
      {/* Indicator that slides with the selection */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-surface shadow-soft ring-1 ring-border transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              "relative z-10 flex h-8 items-center justify-center rounded-lg transition-colors active:scale-90",
              active ? "text-primary" : "text-muted hover:text-fg",
            )}
          >
            <Icon className={cn("size-4 transition-transform duration-300", active && (value === "light" ? "rotate-90" : value === "dark" ? "-rotate-12" : ""))} />
          </button>
        );
      })}
    </div>
  );
}
