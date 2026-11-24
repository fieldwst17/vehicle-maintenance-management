import type { ReactNode } from "react";
import { BellRing, CalendarClock, Gauge, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  { icon: CalendarClock, title: "แจ้งเตือนรอบบำรุงรักษา", text: "ตามระยะ กม. หรือเวลา อย่างใดถึงก่อน" },
  { icon: Gauge, title: "ติดตามเลขไมล์และค่าซ่อม", text: "ประวัติครบทุกคัน ดูต้นทุนได้ทันที" },
  { icon: BellRing, title: "เอกสารไม่หลุดกำหนด", text: "ภาษี พ.ร.บ. ประกัน แจ้งก่อนหมดอายุ" },
];

/** Auth pages: brand panel on the left (desktop), form on the right */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#7c3aed] p-12 text-white lg:flex lg:flex-col">
        {/* Floating background shapes */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-96 animate-[float_14s_ease-in-out_infinite] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 size-[28rem] animate-[float_18s_ease-in-out_infinite_reverse] rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.12)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold">FleetCare</p>
            <p className="text-xs text-white/70">ระบบซ่อมบำรุงยานพาหนะ</p>
          </div>
        </div>

        <div className="relative my-auto max-w-md animate-fade-up">
          <h1 className="text-4xl font-semibold leading-tight">ดูแลรถทุกคัน<br />ให้พร้อมใช้งานเสมอ</h1>
          <p className="mt-4 text-white/75">วางแผนบำรุงรักษา ติดตามงานซ่อม และควบคุมค่าใช้จ่ายของยานพาหนะทั้งหมดได้ในที่เดียว</p>
          <ul className="mt-10 space-y-3">
            {features.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                style={{ animationDelay: `${150 + i * 90}ms` }}
                className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur transition-all duration-300 animate-fade-up hover:translate-x-1 hover:bg-white/15"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="size-4" /> เข้าใช้งานได้เฉพาะบัญชีที่ได้รับสิทธิ์จากผู้ดูแลระบบ
        </p>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        {/* Theme toggle pinned to the top-right corner (the wrapper does the positioning, since ThemeToggle is already `relative`) */}
        <div className="absolute right-4 top-4 z-10 w-[7.5rem] sm:right-6 sm:top-6">
          <ThemeToggle className="bg-surface/80 shadow-soft backdrop-blur" />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
