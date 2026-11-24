import { CalendarClock, Car, ClipboardList, Coins, LayoutDashboard, Package, Users, Warehouse, Wrench } from "lucide-react";

export const navGroups = [
  {
    label: "ภาพรวม",
    items: [{ href: "/", label: "แดชบอร์ด", icon: LayoutDashboard }],
  },
  {
    label: "งานซ่อมบำรุง",
    items: [
      { href: "/vehicles", label: "ยานพาหนะ", icon: Car },
      { href: "/work-orders", label: "ใบสั่งงานซ่อม", icon: ClipboardList },
      { href: "/maintenance", label: "แผนบำรุงรักษา", icon: CalendarClock },
      { href: "/expenses", label: "ค่าใช้จ่าย & อนุมัติ", icon: Coins },
    ],
  },
  {
    label: "ข้อมูลหลัก",
    items: [
      { href: "/service-types", label: "ประเภทงานบริการ", icon: Wrench },
      { href: "/providers", label: "อู่ / ศูนย์บริการ", icon: Warehouse },
      { href: "/parts", label: "อะไหล่ & สต็อก", icon: Package },
      { href: "/users", label: "ผู้ใช้งาน", icon: Users },
    ],
  },
];
