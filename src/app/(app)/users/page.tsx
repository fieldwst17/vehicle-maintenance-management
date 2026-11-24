import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Plus, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createUser, toggleActive } from "@/app/actions/catalog";
import { ActionButton, ModalForm } from "@/components/ui/action-form";
import { Badge, LabelBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { Field, FormGrid, Input, Select } from "@/components/ui/field";
import { options, userRole } from "@/lib/labels";

export const metadata = { title: "ผู้ใช้งาน" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        icon={<Users />}
        title="ผู้ใช้งาน"
        description="พนักงานขับรถ ช่าง และผู้จัดการ ใช้เลือกในฟอร์มต่าง ๆ"
        actions={
          <ModalForm action={createUser} triggerLabel="เพิ่มผู้ใช้" triggerIcon={<Plus />} title="เพิ่มผู้ใช้งาน" icon={<UserPlus />}>
            <FormGrid>
              <Field label="ชื่อ-นามสกุล" required>
                <Input name="name" required autoFocus />
              </Field>
              <Field label="อีเมล" required>
                <Input name="email" type="email" required />
              </Field>
              <Field label="โทรศัพท์">
                <Input name="phone" type="tel" />
              </Field>
              <Field label="บทบาท">
                <Select name="role" options={options(userRole)} defaultValue="DRIVER" />
              </Field>
            </FormGrid>
          </ModalForm>
        }
      />
      <Suspense fallback={<Card><TableSkeleton /></Card>}>
        <List />
      </Suspense>
    </>
  );
}

const initials = (name: string) => name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

async function List() {
  await connection();
  if (!(await getCurrentUser())) redirect("/auth/sign-in"); // guests cannot see the users page (staff contact details)
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { assignedVehicles: true, assignedWorkOrders: true } } },
  });

  return (
    <Card className="animate-fade-up overflow-hidden">
      {users.length === 0 ? (
        <EmptyState icon={<Users />} title="ยังไม่มีผู้ใช้งาน" description="เพิ่มพนักงานขับรถและช่าง เพื่อมอบหมายรถและงานซ่อม" />
      ) : (
        <Table>
          <thead>
            <tr><Th>ชื่อ</Th><Th>บทบาท</Th><Th>โทรศัพท์</Th><Th>รถที่รับผิดชอบ</Th><Th>งานที่ได้รับมอบหมาย</Th><Th>สถานะ</Th><Th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id} className={u.isActive ? "" : "opacity-55"}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-2 text-xs font-semibold text-white">{initials(u.name)}</span>
                    <div className="min-w-0">
                      <p className="font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><LabelBadge entry={userRole[u.role]} /></Td>
                <Td className="text-muted">{u.phone ?? "—"}</Td>
                <Td className="tabular-nums">{u._count.assignedVehicles}</Td>
                <Td className="tabular-nums">{u._count.assignedWorkOrders}</Td>
                <Td><Badge tone={u.isActive ? "success" : "neutral"} dot>{u.isActive ? "ใช้งาน" : "ปิดใช้งาน"}</Badge></Td>
                <Td className="text-right">
                  <ActionButton action={toggleActive} fields={{ kind: "user", id: u.id, active: String(!u.isActive) }} variant="ghost">
                    {u.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </ActionButton>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
