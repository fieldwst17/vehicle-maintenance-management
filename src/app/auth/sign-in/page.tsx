import { Suspense } from "react";
import { LogIn } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { GuestEntry, SignInForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/data";

export const metadata = { title: "เข้าสู่ระบบ" };

export default function SignInPage() {
  return (
    <AuthCard icon={<LogIn />} title="ยินดีต้อนรับกลับมา" description="เข้าสู่ระบบเพื่อจัดการงานซ่อมบำรุงยานพาหนะ">
      <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
        <SignInForm />
      </Suspense>
      <GuestEntry />
    </AuthCard>
  );
}
