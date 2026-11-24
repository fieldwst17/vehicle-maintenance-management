"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { enterGuestAction, signInAction, signUpAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-[15px] shadow-soft transition-all duration-200 " +
  "placeholder:text-muted/70 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

function IconInput({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="group block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary [&_svg]:size-[18px]">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function PasswordInput({ name, label, autoComplete, placeholder }: { name: string; label: string; autoComplete: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <IconInput icon={<Lock />} label={label}>
      <input name={name} type={visible ? "text" : "password"} required autoComplete={autoComplete} placeholder={placeholder ?? "••••••••"} className={cn(inputClass, "pr-12")} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg active:scale-90"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </IconInput>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger animate-pop">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const urlErrors: Record<string, string> = {
  "not-allowed": "บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน หรือถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
};

export function SignInForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signInAction, null);
  const urlError = urlErrors[params.get("error") ?? ""];
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="redirectTo" value={params.get("redirectTo") ?? params.get("callbackUrl") ?? "/"} />
      {state && !state.ok ? <ErrorBox message={state.message} /> : urlError ? <ErrorBox message={urlError} /> : null}
      <IconInput icon={<Mail />} label="อีเมล">
        <input name="email" type="email" required autoFocus autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </IconInput>
      <PasswordInput name="password" label="รหัสผ่าน" autoComplete="current-password" />
      <SubmitButton size="lg" className="w-full rounded-2xl" pendingText="กำลังเข้าสู่ระบบ…">
        เข้าสู่ระบบ
        <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        ผู้ใช้ใหม่ที่ได้รับสิทธิ์แล้ว?{" "}
        <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 transition hover:underline">
          เปิดใช้งานบัญชี
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-5">
      {state && !state.ok ? <ErrorBox message={state.message} /> : null}
      <IconInput icon={<UserRound />} label="ชื่อที่แสดง">
        <input name="name" autoComplete="name" placeholder="ว่างไว้เพื่อใช้ชื่อจากระบบ" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </IconInput>
      <IconInput icon={<Mail />} label="อีเมลที่ได้รับสิทธิ์">
        <input name="email" type="email" required autoFocus autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </IconInput>
      <PasswordInput name="password" label="ตั้งรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" autoComplete="new-password" />
      <PasswordInput name="confirmPassword" label="ยืนยันรหัสผ่าน" autoComplete="new-password" />
      <SubmitButton size="lg" className="w-full rounded-2xl" pendingText="กำลังเปิดใช้งาน…">
        เปิดใช้งานบัญชี
        <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        มีบัญชีแล้ว?{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary underline-offset-4 transition hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}

/** "Continue as guest" (view only) button, shown below the sign-in form */
export function GuestEntry() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        หรือ
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={enterGuestAction} className="mt-6">
        <SubmitButton variant="secondary" size="lg" className="w-full rounded-2xl" pendingText="กำลังเข้าชม…">
          <Eye />
          เข้าชมโดยไม่ต้องเข้าสู่ระบบ
        </SubmitButton>
      </form>
      <p className="mt-3 text-center text-xs text-muted">โหมดผู้เยี่ยมชม: ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่มหรือแก้ไขข้อมูล</p>
    </div>
  );
}
