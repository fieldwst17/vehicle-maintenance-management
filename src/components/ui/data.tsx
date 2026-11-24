import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// ── Page header ──
export function PageHeader({ title, description, icon, actions, breadcrumb }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2 text-sm text-muted">{breadcrumb}</div> : null}
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow [&_svg]:size-5">{icon}</span>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ── Stat card ──
const accents = {
  primary: "from-primary/15 text-primary",
  success: "from-success/15 text-success",
  warning: "from-warning/15 text-warning",
  danger: "from-danger/15 text-danger",
  info: "from-info/15 text-info",
} as const;

export function StatCard({ label, value, hint, icon, accent = "primary", delay = 0 }: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; accent?: keyof typeof accents; delay?: number }) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-300 animate-fade-up hover:-translate-y-1 hover:shadow-lift"
    >
      <div className={cn("pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br to-transparent opacity-70 transition-transform duration-500 group-hover:scale-125", accents[accent])} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        <span className={cn("grid size-11 place-items-center rounded-2xl bg-surface-2 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 [&_svg]:size-5", accents[accent])}>{icon}</span>
      </div>
    </div>
  );
}

// ── Empty state ──
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft text-primary [&_svg]:size-6">{icon}</span>
      <div>
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

// ── Table ──
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("sticky top-0 border-b border-border bg-surface-2/70 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted first:pl-5 last:pr-5", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-border px-4 py-3.5 align-middle first:pl-5 last:pr-5 [tr:last-child>&]:border-b-0", className)}>{children}</td>;
}
export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors duration-150 hover:bg-primary-soft/40", className)}>{children}</tr>;
}

// ── Key/value list ──
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs text-muted">{it.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
