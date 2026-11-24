import { cn } from "@/lib/cn";

// Shared button styles: used by <Button> (client) and <ButtonLink> (works in server components)
export type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl font-medium " +
  "transition-all duration-200 ease-out will-change-transform " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0 " +
  "[&_svg]:transition-transform [&_svg]:duration-200";

const variants: Record<ButtonVariant, string> = {
  primary:
    "btn-shine text-primary-fg bg-gradient-to-br from-primary to-primary-2 shadow-glow " +
    "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_var(--primary)] hover:[&_svg]:scale-110",
  secondary:
    "bg-surface text-fg border border-border shadow-soft hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift hover:[&_svg]:text-primary",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  soft: "bg-primary-soft text-primary hover:-translate-y-0.5 hover:bg-primary hover:text-primary-fg hover:shadow-glow",
  danger:
    "btn-shine text-white bg-gradient-to-br from-danger to-[#be123c] shadow-[0_8px_24px_-8px_var(--danger)] hover:-translate-y-0.5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-9",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
