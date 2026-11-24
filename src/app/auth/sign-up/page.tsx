import { UserCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-form";

export const metadata = { title: "เปิดใช้งานบัญชี" };

export default function SignUpPage() {
  return (
    <AuthCard icon={<UserCheck />} title="เปิดใช้งานบัญชี" description="สำหรับผู้ที่ผู้ดูแลระบบเพิ่มอีเมลไว้แล้ว ตั้งรหัสผ่านเพื่อเริ่มใช้งาน">
      <SignUpForm />
    </AuthCard>
  );
}
