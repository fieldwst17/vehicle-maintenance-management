import { Compass, Home } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center animate-fade-up">
      <span className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow">
        <Compass className="size-9" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-1 text-sm text-muted">ข้อมูลอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
      </div>
      <ButtonLink href="/" variant="primary">
        <Home /> กลับหน้าแดชบอร์ด
      </ButtonLink>
    </div>
  );
}
