import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { FileCheck2, Package, Save, Settings } from "lucide-react";
import { updateAppSettings } from "@/app/actions/settings";
import { InlineForm } from "@/components/ui/action-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, Skeleton } from "@/components/ui/data";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAppSettings } from "@/lib/settings";

export const metadata = { title: "ตั้งค่าระบบ" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader icon={<Settings />} title="ตั้งค่าระบบ" description="ปรับระบบให้เข้ากับวิธีซ่อมบำรุงของบริษัท" />
      <Suspense fallback={<Skeleton className="h-80 max-w-2xl rounded-2xl" />}>
        <SettingsForm />
      </Suspense>
    </>
  );
}

async function SettingsForm() {
  await connection();
  const me = await getCurrentUser();
  if (!me) redirect("/auth/sign-in");
  const settings = await getAppSettings();
  const isAdmin = me.role === "ADMIN";

  return (
    <Card className="max-w-2xl animate-fade-up">
      <CardHeader icon={<Settings />} title="วิธีซ่อมบำรุงของบริษัท" description={isAdmin ? "มีผลกับผู้ใช้ทุกคนทันที" : "เฉพาะผู้ดูแลระบบที่แก้ไขได้"} />
      <CardBody>
        <InlineForm action={updateAppSettings} resetOnSuccess={false} readOnlyMode="disable" className="space-y-3">
          <fieldset disabled={!isAdmin} className="space-y-3">
            <Toggle
              name="inventoryEnabled"
              defaultChecked={settings.inventoryEnabled}
              icon={<Package />}
              title="บริษัทมีคลังอะไหล่ของตัวเอง"
              description="เปิด: เบิกอะไหล่จากคลังในใบสั่งงาน ตัดสต็อกอัตโนมัติ และแจ้งเตือนอะไหล่ใกล้หมด · ปิด: ซ่อนเมนูคลัง ทุกรายการอะไหล่พิมพ์ตามใบเสร็จ"
            />
            <Toggle
              name="requireInvoiceForExternal"
              defaultChecked={settings.requireInvoiceForExternal}
              icon={<FileCheck2 />}
              title="งานส่งอู่ภายนอก ต้องมีเลขที่ใบแจ้งหนี้ก่อนปิดงาน"
              description="ให้ผู้อนุมัติตรวจยอดเทียบกับใบแจ้งหนี้ของอู่ได้ทุกครั้ง"
            />
          </fieldset>
          {isAdmin ? (
            <div className="flex justify-end pt-2">
              <SubmitButton variant="primary"><Save />บันทึกการตั้งค่า</SubmitButton>
            </div>
          ) : null}
        </InlineForm>
      </CardBody>
    </Card>
  );
}

function Toggle({ name, defaultChecked, icon, title, description }: { name: string; defaultChecked: boolean; icon: React.ReactNode; title: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border p-4 transition hover:border-primary/40 has-[:checked]:border-primary/40 has-[:checked]:bg-primary-soft/40 has-[:disabled]:cursor-not-allowed">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary [&_svg]:size-5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
      {/* switch: a styled checkbox (peer) so it submits like a normal form field */}
      <span className="relative mt-1 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
