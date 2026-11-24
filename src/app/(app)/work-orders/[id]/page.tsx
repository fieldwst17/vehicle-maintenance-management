import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Ban, BadgeCheck, Car, Check, CheckCircle2, ChevronLeft, ClipboardList, FileSpreadsheet, FileText, Pause, Play, Receipt, Save, ShieldCheck, Trash2, CalendarCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { approveWorkOrderCost, changeWorkOrderStatus, rejectWorkOrderCost, removeWorkOrderItem, updateWorkOrderNotes } from "@/app/actions/work-orders";
import { WorkOrderItemForm } from "@/components/forms/work-order-item-form";
import { EditOnly } from "@/components/auth/read-only";
import { ActionButton, InlineForm, ModalForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LabelBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DetailList, EmptyState, PageHeader, Skeleton, Table, Td, Th, Tr } from "@/components/ui/data";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { formatDateTime, formatKm, formatMoney, formatNumber } from "@/lib/format";
import { approvalStatus, itemType, priority, workOrderStatus, workOrderType } from "@/lib/labels";
import { providerOptions, serviceTypeOptions, userOptions } from "@/lib/queries";
import type { WorkOrderStatus } from "@/generated/prisma/enums";

export default function WorkOrderDetailPage({ params }: PageProps<"/work-orders/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-16 w-96" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      }
    >
      <WorkOrderDetail params={params} />
    </Suspense>
  );
}

const steps: { status: WorkOrderStatus; label: string }[] = [
  { status: "DRAFT", label: "แจ้งปัญหา" },
  { status: "SCHEDULED", label: "นัดหมาย" },
  { status: "IN_PROGRESS", label: "ดำเนินการ" },
  { status: "COMPLETED", label: "เสร็จสิ้น" },
];

/** Progress steps for the work order */
function Stepper({ status }: { status: WorkOrderStatus }) {
  const cancelled = status === "CANCELLED";
  // COMPLETED = every step done (checkmark on all of them)
  const current = status === "COMPLETED" ? steps.length : status === "ON_HOLD" ? 2 : steps.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = !cancelled && i < current;
        const active = !cancelled && i === current;
        return (
          <li key={s.status} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-all duration-500",
                  done && "border-transparent bg-gradient-to-br from-primary to-primary-2 text-white",
                  active && "border-primary bg-primary-soft text-primary ring-4 ring-primary/15",
                  !done && !active && "border-border text-muted",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", active ? "font-medium text-fg" : "text-muted")}>
                {s.label}
                {active && status === "ON_HOLD" ? " (พักงาน)" : ""}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                <span className={cn("block h-full bg-gradient-to-r from-primary to-primary-2 transition-all duration-700", done ? "w-full" : "w-0")} />
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

async function WorkOrderDetail({ params }: { params: PageProps<"/work-orders/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [wo, serviceTypes, providers, technicians] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        provider: true,
        reportedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
        maintenancePlan: { include: { serviceType: { select: { name: true } } } },
        items: { orderBy: { createdAt: "asc" }, include: { serviceType: { select: { name: true } }, part: { select: { partNumber: true } } } },
      },
    }),
    serviceTypeOptions(),
    providerOptions(),
    userOptions(["TECHNICIAN", "MANAGER"]),
  ]);
  if (!wo) notFound();

  const closed = wo.status === "COMPLETED" || wo.status === "CANCELLED";
  const approved = wo.approvalStatus === "APPROVED";
  const me = await getCurrentUser();
  const canApprove = me?.role === "ADMIN" || me?.role === "MANAGER";
  const fields = (status: WorkOrderStatus) => ({ workOrderId: wo.id, status });

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/work-orders" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
            <ChevronLeft className="size-4" /> ใบสั่งงานทั้งหมด
          </Link>
        }
        icon={<ClipboardList />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {wo.title}
            <LabelBadge entry={workOrderStatus[wo.status]} pulse={wo.status === "IN_PROGRESS"} />
          </span>
        }
        description={<span className="font-mono">{wo.code}</span>}
        actions={
          closed ? null : (
            <>
              {wo.status === "DRAFT" ? (
                <ActionButton action={changeWorkOrderStatus} fields={fields("SCHEDULED")} variant="secondary" size="md"><CalendarCheck />ยืนยันนัดหมาย</ActionButton>
              ) : null}
              {wo.status !== "IN_PROGRESS" ? (
                <ActionButton action={changeWorkOrderStatus} fields={fields("IN_PROGRESS")} variant="secondary" size="md"><Play />{wo.status === "ON_HOLD" ? "ดำเนินการต่อ" : "เริ่มงาน"}</ActionButton>
              ) : (
                <ActionButton action={changeWorkOrderStatus} fields={fields("ON_HOLD")} variant="secondary" size="md"><Pause />พักงาน</ActionButton>
              )}
              <ActionButton action={changeWorkOrderStatus} fields={fields("CANCELLED")} confirm={{ title: "ยกเลิกใบสั่งงานนี้?", message: "สถานะจะเปลี่ยนเป็นยกเลิก และจะแก้ไขรายการต่อไม่ได้", confirmLabel: "ยกเลิกใบสั่งงาน", cancelLabel: "กลับ", tone: "danger" }} variant="ghost" size="md"><Ban />ยกเลิก</ActionButton>
              <ActionButton action={changeWorkOrderStatus} fields={fields("COMPLETED")} confirm={{ title: "ปิดงานนี้?", message: "หลังปิดแล้วจะแก้ไขรายการไม่ได้ ระบบจะอัปเดตแผนบำรุงรักษาและเลขไมล์ แล้วส่งค่าใช้จ่ายไปรออนุมัติ", confirmLabel: "ปิดงาน" }} variant="primary" size="md"><CheckCircle2 />ปิดงาน</ActionButton>
            </>
          )
        }
      />

      <Card className="mb-6 animate-fade-up">
        <CardBody>
          {wo.status === "CANCELLED" ? <p className="text-sm text-danger">ใบสั่งงานนี้ถูกยกเลิกแล้ว</p> : <Stepper status={wo.status} />}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <Card className="animate-fade-up [animation-delay:60ms]">
            <CardHeader icon={<Receipt />} title="รายการค่าใช้จ่าย" description={closed ? "ปิดงานแล้ว ไม่สามารถแก้ไขรายการได้" : "เพิ่มค่าแรง อะไหล่ และค่าใช้จ่ายอื่น ๆ"} />
            {wo.items.length === 0 ? (
              <EmptyState icon={<Receipt />} title="ยังไม่มีรายการ" description="ผูกรายการกับงานบริการ เพื่อให้ระบบอัปเดตแผนบำรุงรักษาเมื่อปิดงาน" />
            ) : (
              <Table>
                <thead>
                  <tr><Th>รายการ</Th><Th>ประเภท</Th><Th className="text-right">จำนวน</Th><Th className="text-right">ราคา/หน่วย</Th><Th className="text-right">รวม</Th>{closed ? null : <Th />}</tr>
                </thead>
                <tbody>
                  {wo.items.map((it) => (
                    <Tr key={it.id}>
                      <Td>
                        <p className="font-medium">{it.description}</p>
                        <p className="text-xs text-muted">{[it.serviceType?.name, it.part?.partNumber].filter(Boolean).join(" · ") || " "}</p>
                      </Td>
                      <Td><LabelBadge entry={itemType[it.itemType]} dot={false} /></Td>
                      <Td className="text-right tabular-nums">{formatNumber(it.quantity)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(it.unitCost)}</Td>
                      <Td className="text-right font-medium tabular-nums">{formatMoney(it.totalCost)}</Td>
                      {closed ? null : (
                        <Td className="text-right">
                          <ActionButton action={removeWorkOrderItem} fields={{ itemId: it.id }} confirm={{ title: "ลบรายการนี้?", message: "ยอดรวมจะคำนวณใหม่ ถ้าเป็นอะไหล่จะคืนเข้าสต็อก", confirmLabel: "ลบ", tone: "danger" }} variant="ghost" size="icon">
                            <Trash2 className="text-danger" />
                          </ActionButton>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
            {closed ? null : (
              <EditOnly>
                <div className="border-t border-border p-5">
                  <WorkOrderItemForm workOrderId={wo.id} serviceTypes={serviceTypes} />
                </div>
              </EditOnly>
            )}
            {/* Totals */}
            <div className="grid gap-3 border-t border-border bg-surface-2/50 p-5 sm:grid-cols-4">
              {[
                { label: "ค่าแรง", value: wo.laborCost },
                { label: "ค่าอะไหล่", value: wo.partsCost },
                { label: "อื่น ๆ", value: wo.otherCost },
              ].map((t) => (
                <div key={t.label}>
                  <p className="text-xs text-muted">{t.label}</p>
                  <p className="font-medium tabular-nums">{formatMoney(t.value)}</p>
                </div>
              ))}
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-white shadow-glow">
                <p className="text-xs opacity-80">รวมทั้งสิ้น</p>
                <p className="text-lg font-semibold tabular-nums">{formatMoney(wo.totalCost)}</p>
              </div>
            </div>
          </Card>

          {wo.status === "COMPLETED" ? (
            <ApprovalCard
              wo={{ id: wo.id, approvalStatus: wo.approvalStatus, approvalNumber: wo.approvalNumber, approvedAt: wo.approvedAt, approvalNote: wo.approvalNote, expenseAccount: wo.expenseAccount, approvedBy: wo.approvedBy?.name ?? null, totalCost: formatMoney(wo.totalCost) }}
              canApprove={canApprove}
            />
          ) : null}

          {wo.description ? (
            <Card className="animate-fade-up">
              <CardHeader icon={<ClipboardList />} title="อาการ / รายละเอียด" />
              <CardBody><p className="whitespace-pre-wrap text-sm leading-relaxed">{wo.description}</p></CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {/* Vehicle */}
          <Link href={`/vehicles/${wo.vehicle.id}`} className="group block">
            <Card interactive className="animate-fade-up [animation-delay:80ms]">
              <CardBody className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110"><Car className="size-6" /></span>
                <div className="min-w-0">
                  <p className="font-semibold group-hover:text-primary">{wo.vehicle.plateNumber} {wo.vehicle.plateProvince}</p>
                  <p className="truncate text-sm text-muted">{wo.vehicle.brand} {wo.vehicle.model} · {formatKm(wo.vehicle.currentOdometerKm)}</p>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Card className="animate-fade-up [animation-delay:120ms]">
            <CardHeader title="ข้อมูลงาน" />
            <CardBody>
              <DetailList
                items={[
                  { label: "ประเภทงาน", value: <LabelBadge entry={workOrderType[wo.type]} dot={false} /> },
                  { label: "ความเร่งด่วน", value: <LabelBadge entry={priority[wo.priority]} /> },
                  { label: "นัดหมาย", value: formatDateTime(wo.scheduledAt) },
                  { label: "เลขไมล์เข้ารับบริการ", value: formatKm(wo.odometerKm) },
                  { label: "เริ่มงาน", value: formatDateTime(wo.startedAt) },
                  { label: "ปิดงาน", value: formatDateTime(wo.completedAt) },
                  { label: "ผู้แจ้ง", value: wo.reportedBy?.name ?? "—" },
                  { label: "จากแผน", value: wo.maintenancePlan?.serviceType.name ?? "—" },
                ]}
              />
            </CardBody>
          </Card>

          <Card className="animate-fade-up [animation-delay:160ms]">
            <CardHeader title="อู่ / ผู้รับผิดชอบ / เอกสาร" />
            <CardBody>
              <InlineForm action={updateWorkOrderNotes} resetOnSuccess={false} readOnlyMode="disable" className="space-y-4">
                <input type="hidden" name="workOrderId" value={wo.id} />
                <Field label="อู่ / ศูนย์บริการ">
                  <Select name="providerId" options={providers} placeholder="— ไม่ระบุ —" defaultValue={wo.providerId ?? ""} />
                </Field>
                <Field label="ผู้รับผิดชอบ">
                  <Select name="assignedToId" options={technicians} placeholder="— ไม่ระบุ —" defaultValue={wo.assignedToId ?? ""} />
                </Field>
                <Field label="เลขที่ใบแจ้งหนี้">
                  <Input name="invoiceNumber" defaultValue={wo.invoiceNumber ?? ""} />
                </Field>
                <Field label="บันทึกเพิ่มเติม">
                  <Textarea name="notes" defaultValue={wo.notes ?? ""} />
                </Field>
                {approved ? <p className="text-center text-xs text-muted">อนุมัติค่าใช้จ่ายแล้ว ข้อมูลถูกล็อก</p> : <EditOnly><SubmitButton variant="soft" className="w-full"><Save />บันทึก</SubmitButton></EditOnly>}
              </InlineForm>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

/** Cost approval section (shown after the job is closed) */
function ApprovalCard({
  wo,
  canApprove,
}: {
  wo: { id: string; approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null; approvalNumber: string | null; approvedAt: Date | null; approvalNote: string | null; expenseAccount: string | null; approvedBy: string | null; totalCost: string };
  canApprove: boolean;
}) {
  const status = wo.approvalStatus ?? "PENDING";
  const approved = status === "APPROVED";
  return (
    <Card className={cn("animate-fade-up", approved && "border-success/30")}>
      <CardHeader
        icon={<ShieldCheck />}
        title="การอนุมัติค่าใช้จ่าย"
        description={approved ? "ใช้เป็นเอกสารประกอบการบันทึกบัญชีได้" : "ผู้จัดการ/ผู้ดูแลระบบตรวจสอบและอนุมัติยอดค่าใช้จ่ายของงานนี้"}
        action={<LabelBadge entry={approvalStatus[status]} pulse={status === "PENDING"} />}
      />
      <CardBody className="space-y-5">
        <DetailList
          items={[
            { label: "ยอดที่ขออนุมัติ", value: wo.totalCost },
            { label: "เลขที่ใบอนุมัติ", value: wo.approvalNumber ? <span className="font-mono">{wo.approvalNumber}</span> : "—" },
            { label: status === "REJECTED" ? "ผู้พิจารณา" : "ผู้อนุมัติ", value: wo.approvedBy ?? "—" },
            { label: "วันที่", value: formatDateTime(wo.approvedAt) },
            { label: "รหัสบัญชีค่าใช้จ่าย", value: wo.expenseAccount ?? "—" },
            { label: status === "REJECTED" ? "เหตุผลที่ไม่อนุมัติ" : "หมายเหตุ", value: wo.approvalNote ?? "—" },
          ]}
        />

        {approved ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            <ButtonLink href={`/documents/approval/${wo.id}`} target="_blank" variant="primary"><FileText />ใบอนุมัติ (PDF)</ButtonLink>
            <ButtonLink href={`/export/approval/${wo.id}`} prefetch={false} variant="secondary"><FileSpreadsheet />Excel</ButtonLink>
          </div>
        ) : canApprove ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            <ModalForm action={approveWorkOrderCost} triggerLabel="อนุมัติค่าใช้จ่าย" triggerIcon={<BadgeCheck />} title="อนุมัติค่าใช้จ่าย" description={`ยอดรวม ${wo.totalCost} · ระบบจะออกเลขที่ใบอนุมัติให้อัตโนมัติ`} icon={<BadgeCheck />} submitLabel="ยืนยันอนุมัติ">
              <input type="hidden" name="workOrderId" value={wo.id} />
              <Field label="รหัสบัญชีค่าใช้จ่าย" hint="เช่น 5310 ค่าซ่อมแซมและบำรุงรักษายานพาหนะ (ไม่บังคับ)">
                <Input name="expenseAccount" placeholder="เช่น 5310" defaultValue={wo.expenseAccount ?? ""} />
              </Field>
              <Field label="หมายเหตุ">
                <Textarea name="approvalNote" placeholder="ไม่บังคับ" />
              </Field>
            </ModalForm>
            <ModalForm action={rejectWorkOrderCost} triggerLabel="ไม่อนุมัติ" triggerIcon={<XCircle />} triggerVariant="secondary" title="ไม่อนุมัติค่าใช้จ่าย" icon={<XCircle />} submitLabel="บันทึกผล">
              <input type="hidden" name="workOrderId" value={wo.id} />
              <Field label="เหตุผล" required>
                <Textarea name="approvalNote" required placeholder="เช่น ขอใบเสร็จฉบับจริง / ราคาอะไหล่สูงกว่าปกติ" />
              </Field>
            </ModalForm>
          </div>
        ) : (
          <p className="border-t border-border pt-5 text-sm text-muted">รอผู้จัดการหรือผู้ดูแลระบบอนุมัติ</p>
        )}
      </CardBody>
    </Card>
  );
}
