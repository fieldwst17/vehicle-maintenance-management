import type { ReactNode } from "react";

/** Printable document pages (A4): white background, no sidebar */
export default function DocumentsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-zinc-200 py-8 text-zinc-900 [color-scheme:light] print:bg-white print:py-0">{children}</div>;
}
