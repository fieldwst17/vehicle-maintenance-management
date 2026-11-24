"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { navGroups } from "./nav-items";
import { NavBadge } from "./nav-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3 px-2">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow transition-transform duration-500 group-hover:rotate-[20deg]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="font-semibold">FleetCare</p>
        <p className="text-xs text-muted">ระบบซ่อมบำรุงยานพาหนะ</p>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate, hiddenHrefs = [] }: { onNavigate?: () => void; hiddenHrefs?: string[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted/80">{group.label}</p>
          <ul className="flex flex-col gap-1">
            {group.items.filter((item) => !hiddenHrefs.includes(item.href)).map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:translate-x-1 hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary-2 transition-all duration-300",
                        active ? "opacity-100" : "h-0 opacity-0",
                      )}
                    />
                    <Icon className={cn("size-[18px] transition-transform duration-200", active ? "" : "group-hover:scale-110")} />
                    <span className="flex-1">{label}</span>
                    <NavBadge href={href} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Fixed sidebar on desktop; drawer opened from the top bar on mobile */
export function Sidebar({ userSlot, hiddenHrefs }: { userSlot?: ReactNode; hiddenHrefs?: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 border-r border-border bg-surface/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <NavLinks hiddenHrefs={hiddenHrefs} />
        <div className="mt-auto space-y-3">
          <ThemeToggle />
          {userSlot}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface/80 px-3 py-3 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-fg active:scale-95">
          <Menu className="size-5" />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer (opens from the left, the same side as the menu button) */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-8 overflow-y-auto border-r border-border bg-surface px-4 py-6 shadow-lift transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Brand />
            <button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="rounded-xl p-2 text-muted transition hover:rotate-90 hover:bg-surface-2">
              <X className="size-5" />
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} hiddenHrefs={hiddenHrefs} />
          <div className="mt-auto space-y-3">
            <ThemeToggle />
            {userSlot}
          </div>
        </aside>
      </div>
    </>
  );
}
