import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  primary: "bg-primary-soft text-primary border-primary/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/20",
  info: "bg-info-soft text-info border-info/20",
};

export function Badge({ tone = "neutral", dot, pulse, children, className }: { tone?: Tone; dot?: boolean; pulse?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot ? (
        <span className="relative flex size-1.5">
          {pulse ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" /> : null}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** Badge from a label map entry, e.g. <LabelBadge entry={vehicleStatus[v.status]} /> */
export function LabelBadge({ entry, dot = true, pulse }: { entry: { label: string; tone: Tone }; dot?: boolean; pulse?: boolean }) {
  return (
    <Badge tone={entry.tone} dot={dot} pulse={pulse}>
      {entry.label}
    </Badge>
  );
}
