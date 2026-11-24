import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const control =
  "w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-fg shadow-[inset_0_1px_2px_rgb(0_0_0/0.03)] " +
  "placeholder:text-muted/70 transition-all duration-200 hover:border-primary/40 " +
  "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 aria-invalid:border-danger aria-invalid:ring-danger/15";

export function Field({ label, hint, error, required, children, className }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium text-fg">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={3} className={cn(control, "py-2.5", className)} {...props} />;
}

export function Select({ className, options, placeholder, ...props }: ComponentProps<"select"> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select className={cn(control, "h-10 cursor-pointer appearance-none pr-9", className)} {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Responsive grid for form fields */
export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  return <div className={cn("grid gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3")}>{children}</div>;
}
