import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, interactive }: { className?: string; children: ReactNode; interactive?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft",
        interactive && "transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, description, icon, action }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary [&_svg]:size-[18px]">{icon}</span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold">{title}</h2>
          {description ? <p className="truncate text-xs text-muted">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
