import type { ReactNode } from "react";

/** A4 paper sheet (fixed light colors, unaffected by dark mode) */
export function Paper({ children }: { children: ReactNode }) {
  return (
    <>
      {/* A4 page settings for printing */}
      <style>{`@page { size: A4; margin: 12mm; }`}</style>
      <article className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[13px] leading-relaxed text-zinc-900 shadow-xl print:max-w-none print:p-0 print:shadow-none">
        {children}
      </article>
    </>
  );
}

export function DocHeader({ title, subtitle, meta }: { title: string; subtitle?: string; meta: { label: string; value: ReactNode }[] }) {
  return (
    <header className="flex items-start justify-between gap-6 border-b-2 border-zinc-900 pb-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-white print:bg-indigo-600 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </span>
        <div>
          <p className="text-xs text-zinc-500">FleetCare · ระบบซ่อมบำรุงยานพาหนะ</p>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle ? <p className="text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
      </div>
      <dl className="shrink-0 text-right text-xs">
        {meta.map((m) => (
          <div key={m.label} className="flex justify-end gap-2">
            <dt className="text-zinc-500">{m.label}</dt>
            <dd className="font-semibold">{m.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 text-sm font-bold text-indigo-700">{title}</h2>
      {children}
    </section>
  );
}

export function InfoGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border border-zinc-300 p-3">
      {items.map((i) => (
        <div key={i.label} className="flex gap-2">
          <dt className="w-36 shrink-0 text-zinc-500">{i.label}</dt>
          <dd className="min-w-0 font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SignatureBox({ role, name, date }: { role: string; name?: string; date?: string }) {
  return (
    <div className="break-inside-avoid text-center">
      <div className="mx-auto mt-10 w-52 border-b border-dotted border-zinc-500" />
      <p className="mt-1">({name || "...................................................."})</p>
      <p className="font-semibold">{role}</p>
      <p className="text-xs text-zinc-500">วันที่ {date || "........./........./............."}</p>
    </div>
  );
}
