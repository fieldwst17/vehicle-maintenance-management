"use client";

import { useState } from "react";
import { Building2, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, Select } from "@/components/ui/field";

export type ProviderOption = { value: string; label: string; isInternal: boolean };
type Mode = "IN_HOUSE" | "EXTERNAL";

const modes: { value: Mode; label: string; hint: string; icon: typeof Wrench }[] = [
  { value: "IN_HOUSE", label: "ซ่อมเอง", hint: "ช่างของบริษัท เบิกอะไหล่จากคลังได้", icon: Wrench },
  { value: "EXTERNAL", label: "ส่งอู่ / ศูนย์ภายนอก", hint: "จ่ายตามใบแจ้งหนี้ของอู่", icon: Building2 },
];

/**
 * Repair mode (in-house / outside garage) + garage picker.
 * Picking a garage switches the mode to match it (outside garage → EXTERNAL), but the mode can still be set by hand
 * (e.g. an outside garage that isn't registered yet).
 */
export function RepairModeFields({ providers, defaultMode = "IN_HOUSE", defaultProviderId = "", disabledMode = false }: {
  providers: ProviderOption[];
  defaultMode?: Mode;
  defaultProviderId?: string;
  /** the job is closed: the mode is shown but can't change */
  disabledMode?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [providerId, setProviderId] = useState(defaultProviderId);

  function pickProvider(id: string) {
    setProviderId(id);
    const p = providers.find((x) => x.value === id);
    if (p && !disabledMode) setMode(p.isInternal ? "IN_HOUSE" : "EXTERNAL");
  }

  return (
    <>
      {/* a div, not Field's <label>: a label around several buttons would forward clicks to the first one */}
      <div className="@container flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-fg">รูปแบบการซ่อม</span>
        <input type="hidden" name="repairMode" value={mode} />
        <div role="radiogroup" className="grid gap-2 @sm:grid-cols-2">
          {modes.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabledMode}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                  active ? "border-primary bg-primary-soft ring-4 ring-primary/10" : "border-border hover:border-primary/40 hover:bg-surface-2",
                )}
              >
                <m.icon className={cn("mt-0.5 size-4 shrink-0", active ? "text-primary" : "text-muted")} />
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", active && "text-primary")}>{m.label}</span>
                  <span className="block text-xs text-muted">{m.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <Field label={mode === "EXTERNAL" ? "อู่ / ศูนย์บริการที่ส่งซ่อม" : "อู่ / ศูนย์บริการ"} hint={mode === "EXTERNAL" && !providerId ? "ยังไม่มีในรายการ? เพิ่มได้ที่เมนู อู่ / ศูนย์บริการ" : undefined}>
        <Select name="providerId" options={providers} placeholder="— ไม่ระบุ —" value={providerId} onValueChange={pickProvider} />
      </Field>
    </>
  );
}
