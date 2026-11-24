import type { ReactNode } from "react";

/** Heading + form container for the auth pages */
export function AuthCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <div className="animate-fade-up">
      {/* Mobile logo (the brand panel is hidden on small screens) */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </span>
        <p className="text-lg font-semibold">FleetCare</p>
      </div>
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-6">{icon}</span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <div className="mt-8 rounded-3xl border border-border bg-surface/80 p-6 shadow-lift backdrop-blur sm:p-8">{children}</div>
    </div>
  );
}
