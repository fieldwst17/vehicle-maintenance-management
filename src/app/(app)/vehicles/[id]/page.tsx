import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarClock, Car, ChevronLeft, ClipboardList, FilePlus2, FileText, Gauge, History, Info, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addMaintenancePlan, addVehicleDocument, recordOdometer, updateVehicleStatus } from "@/app/actions/vehicles";
import { NewWorkOrderButton } from "@/components/forms/work-order-form";
import { EditOnly } from "@/components/auth/read-only";
import { ActionButton, InlineForm, ModalForm } from "@/components/ui/action-form";
import { Badge, LabelBadge } from "@/components/ui/badge";
import { ButtonFallback } from "@/components/ui/button-fallback";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DetailList, EmptyState, PageHeader, Skeleton, Table, Td, Th, Tr } from "@/components/ui/data";
import { Field, FormGrid, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { daysUntil, formatDate, formatKm, formatMoney } from "@/lib/format";
import { documentType, fuelType, odometerSource, options, vehicleStatus, vehicleType, workOrderStatus } from "@/lib/labels";
import { dueState } from "@/lib/maintenance";
import { serviceTypeOptions } from "@/lib/queries";
import type { VehicleStatus } from "@/generated/prisma/enums";

export default function VehicleDetailPage({ params }: PageProps<"/vehicles/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <VehicleDetail params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-80" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

async function VehicleDetail({ params }: { params: PageProps<"/vehicles/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [vehicle, serviceTypes] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      include: {
        assignedDriver: { select: { name: true, phone: true } },
        odometerReadings: { orderBy: { recordedAt: "desc" }, take: 5 },
        documents: { orderBy: { expiryDate: "asc" } },
        maintenancePlans: { where: { isActive: true }, include: { serviceType: { select: { name: true } } }, orderBy: { nextDueAt: "asc" } },
        workOrders: { orderBy: { createdAt: "desc" }, take: 10, include: { provider: { select: { name: true } } } },
      },
    }),
    serviceTypeOptions(),
  ]);
  if (!vehicle) notFound();

  const totalSpent = await prisma.workOrder.aggregate({ where: { vehicleId: id, status: "COMPLETED" }, _sum: { totalCost: true } });

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/vehicles" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
            <ChevronLeft className="size-4" /> ยานพาหนะทั้งหมด
          </Link>
        }
        icon={<Car />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {vehicle.plateNumber} <span className="text-base font-normal text-muted">{vehicle.plateProvince}</span>
            <LabelBadge entry={vehicleStatus[vehicle.status]} pulse={vehicle.status === "IN_MAINTENANCE"} />
          </span>
        }
        description={`${vehicle.brand} ${vehicle.model}${vehicle.year ? ` · ปี ${vehicle.year}` : ""}`}
        actions={
          <Suspense fallback={<ButtonFallback label="แจ้งซ่อม" />}>
            <NewWorkOrderButton vehicleId={vehicle.id} label="แจ้งซ่อม / สร้างใบสั่งงาน" />
          </Suspense>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle info */}
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader icon={<Info />} title="ข้อมูลรถ" />
          <CardBody>
            <DetailList
              items={[
                { label: "ประเภท", value: vehicleType[vehicle.type].label },
                { label: "เชื้อเพลิง", value: fuelType[vehicle.fuelType].label },
                { label: "สี", value: vehicle.color ?? "—" },
                { label: "เลขตัวถัง (VIN)", value: vehicle.vin ?? "—" },
                { label: "วันที่ซื้อ", value: formatDate(vehicle.purchaseDate) },
                { label: "คนขับประจำ", value: vehicle.assignedDriver ? `${vehicle.assignedDriver.name}${vehicle.assignedDriver.phone ? ` · ${vehicle.assignedDriver.phone}` : ""}` : "—" },
                { label: "ค่าซ่อมสะสม", value: formatMoney(totalSpent._sum.totalCost) },
                { label: "หมายเหตุ", value: vehicle.notes ?? "—" },
              ]}
            />
            <EditOnly>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
              <span className="mr-1 text-xs text-muted">เปลี่ยนสถานะ:</span>
              {(Object.keys(vehicleStatus) as VehicleStatus[])
                .filter((s) => s !== vehicle.status)
                .map((s) => (
                  <ActionButton
                    key={s}
                    action={updateVehicleStatus}
                    fields={{ vehicleId: vehicle.id, status: s }}
                    confirm={s === "RETIRED" ? { title: "ปลดระวางรถคันนี้?", message: "สถานะรถจะเปลี่ยนเป็นปลดระวาง เปลี่ยนกลับได้ภายหลังจากหน้านี้", confirmLabel: "ปลดระวาง", tone: "danger" } : undefined}
                    variant="secondary"
                  >
                    {vehicleStatus[s].label}
                  </ActionButton>
                ))}
            </div>
            </EditOnly>
          </CardBody>
        </Card>

        {/* Odometer */}
        <Card className="animate-fade-up [animation-delay:60ms]">
          <CardHeader icon={<Gauge />} title="เลขไมล์" description="บันทึกเพื่อคำนวณรอบบำรุงรักษา" />
          <CardBody className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-2 p-5 text-white shadow-glow">
              <p className="text-xs opacity-80">เลขไมล์ล่าสุด</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{vehicle.currentOdometerKm.toLocaleString("th-TH")}</p>
              <p className="text-xs opacity-80">กิโลเมตร</p>
            </div>
            <InlineForm action={recordOdometer} className="flex gap-2">
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <Input name="readingKm" type="number" min={vehicle.currentOdometerKm} placeholder="เลขไมล์ใหม่" required className="flex-1" />
              <SubmitButton variant="soft">บันทึก</SubmitButton>
            </InlineForm>
            <ul className="space-y-2">
              {vehicle.odometerReadings.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted"><History className="size-3.5" />{formatDate(r.recordedAt)}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={odometerSource[r.source].tone}>{odometerSource[r.source].label}</Badge>
                    <span className="tabular-nums">{formatKm(r.readingKm)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Maintenance plans */}
      <Card className="mt-6 animate-fade-up [animation-delay:120ms]">
        <CardHeader
          icon={<CalendarClock />}
          title="แผนบำรุงรักษา"
          description="ระบบอัปเดตรอบถัดไปให้อัตโนมัติเมื่อปิดใบสั่งงานที่มีงานบริการนั้น"
          action={
            <ModalForm action={addMaintenancePlan} triggerLabel="เพิ่มแผน" triggerIcon={<Plus />} triggerVariant="soft" triggerSize="sm" title="เพิ่มแผนบำรุงรักษา" icon={<CalendarClock />}>
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <Field label="งานบริการ" required>
                <Select name="serviceTypeId" options={serviceTypes} placeholder="— เลือกงานบริการ —" required />
              </Field>
              <FormGrid>
                <Field label="ทุก ๆ (กม.)" hint="เว้นว่างเพื่อใช้ค่าเริ่มต้น">
                  <Input name="intervalKm" type="number" min={0} placeholder="เช่น 10000" />
                </Field>
                <Field label="หรือทุก ๆ (เดือน)" hint="เว้นว่างเพื่อใช้ค่าเริ่มต้น">
                  <Input name="intervalMonths" type="number" min={0} placeholder="เช่น 6" />
                </Field>
                <Field label="เข้ารับบริการครั้งล่าสุด">
                  <Input name="lastServiceAt" type="date" />
                </Field>
                <Field label="เลขไมล์ครั้งล่าสุด" hint={`ว่าง = ใช้เลขไมล์ปัจจุบัน (${vehicle.currentOdometerKm.toLocaleString("th-TH")})`}>
                  <Input name="lastServiceKm" type="number" min={0} />
                </Field>
              </FormGrid>
            </ModalForm>
          }
        />
        {vehicle.maintenancePlans.length === 0 ? (
          <EmptyState icon={<CalendarClock />} title="ยังไม่มีแผนบำรุงรักษา" description="เพิ่มแผน เช่น เปลี่ยนน้ำมันเครื่องทุก 10,000 กม. เพื่อให้ระบบเตือนเมื่อถึงกำหนด" />
        ) : (
          <Table>
            <thead>
              <tr><Th>งานบริการ</Th><Th>รอบ</Th><Th>ครั้งล่าสุด</Th><Th>ครั้งถัดไป</Th><Th>สถานะ</Th><Th /></tr>
            </thead>
            <tbody>
              {vehicle.maintenancePlans.map((p) => {
                const s = dueState(p, vehicle.currentOdometerKm);
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.serviceType.name}</Td>
                    <Td className="text-muted">{[p.intervalKm && `${p.intervalKm.toLocaleString("th-TH")} กม.`, p.intervalMonths && `${p.intervalMonths} เดือน`].filter(Boolean).join(" / ") || "—"}</Td>
                    <Td className="text-muted">{formatDate(p.lastServiceAt)}<br /><span className="text-xs">{formatKm(p.lastServiceKm)}</span></Td>
                    <Td>{formatDate(p.nextDueAt)}<br /><span className="text-xs text-muted">{formatKm(p.nextDueKm)}</span></Td>
                    <Td><Badge tone={s.tone} dot pulse={s.key === "overdue"}>{s.label}</Badge><p className="mt-1 text-xs text-muted">{s.detail}</p></Td>
                    <Td className="text-right">
                      {s.key === "overdue" || s.key === "soon" ? (
                        <Suspense fallback={null}>
                          <NewWorkOrderButton vehicleId={vehicle.id} maintenancePlanId={p.id} defaultTitle={p.serviceType.name} defaultType="PREVENTIVE" label="สร้างงาน" variant="soft" size="sm" />
                        </Suspense>
                      ) : null}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Documents */}
        <Card className="animate-fade-up">
          <CardHeader
            icon={<FileText />}
            title="เอกสารรถ"
            description="ภาษี พ.ร.บ. ประกัน ตรวจสภาพ"
            action={
              <ModalForm action={addVehicleDocument} triggerLabel="เพิ่มเอกสาร" triggerIcon={<FilePlus2 />} triggerVariant="soft" triggerSize="sm" title="เพิ่มเอกสารรถ" icon={<FileText />}>
                <input type="hidden" name="vehicleId" value={vehicle.id} />
                <FormGrid>
                  <Field label="ประเภทเอกสาร" required>
                    <Select name="type" options={options(documentType)} defaultValue="COMPULSORY_INSURANCE" />
                  </Field>
                  <Field label="เลขที่เอกสาร / กรมธรรม์">
                    <Input name="documentNumber" />
                  </Field>
                  <Field label="ผู้ออก / บริษัทประกัน">
                    <Input name="provider" />
                  </Field>
                  <Field label="ค่าใช้จ่าย (บาท)">
                    <Input name="cost" type="number" min={0} step="0.01" />
                  </Field>
                  <Field label="วันที่ออก">
                    <Input name="issueDate" type="date" />
                  </Field>
                  <Field label="วันหมดอายุ">
                    <Input name="expiryDate" type="date" />
                  </Field>
                </FormGrid>
              </ModalForm>
            }
          />
          {vehicle.documents.length === 0 ? (
            <EmptyState icon={<FileText />} title="ยังไม่มีเอกสาร" description="บันทึกวันหมดอายุเพื่อให้ระบบแจ้งเตือนล่วงหน้า" />
          ) : (
            <ul className="divide-y divide-border">
              {vehicle.documents.map((d) => {
                const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{documentType[d.type].label}{d.documentNumber ? <span className="text-muted"> · {d.documentNumber}</span> : null}</p>
                      <p className="text-xs text-muted">{d.provider ?? "—"} · หมดอายุ {formatDate(d.expiryDate)}</p>
                    </div>
                    {days === null ? null : (
                      <Badge tone={days < 0 ? "danger" : days <= 30 ? "warning" : "success"} dot>
                        {days < 0 ? "หมดอายุแล้ว" : days <= 30 ? `อีก ${days} วัน` : "ใช้งานได้"}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Work order history */}
        <Card className="animate-fade-up">
          <CardHeader icon={<ClipboardList />} title="ประวัติงานซ่อม" description="10 รายการล่าสุด" />
          {vehicle.workOrders.length === 0 ? (
            <EmptyState icon={<ClipboardList />} title="ยังไม่มีประวัติการซ่อม" />
          ) : (
            <ul className="divide-y divide-border">
              {vehicle.workOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/work-orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-primary-soft/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.title}</p>
                      <p className="truncate text-xs text-muted">{o.code} · {formatDate(o.completedAt ?? o.createdAt)}{o.provider ? ` · ${o.provider.name}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <LabelBadge entry={workOrderStatus[o.status]} />
                      <span className="text-xs tabular-nums text-muted">{formatMoney(o.totalCost)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
