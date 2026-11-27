import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Eye, LogIn, LogOut } from "lucide-react";
import { exitGuestAction, signOutAction } from "@/app/actions/auth";
import { ReadOnlyProvider } from "@/components/auth/read-only";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";
import { Skeleton } from "@/components/ui/data";
import { SubmitButton } from "@/components/ui/submit-button";
import { deniedRedirectPath, getViewer, type Viewer } from "@/lib/auth/viewer";
import { userRole } from "@/lib/labels";
import { getAppSettings } from "@/lib/settings";

/** Layout for every page after sign-in / guest mode: sidebar + access check */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Suspense fallback={<Skeleton className="h-16 w-80" />}>
            <AccessGate>{children}</AccessGate>
          </Suspense>
        </div>
      </main>
    </QueryProvider>
  );
}


/**
 * Checks access on the server: users must be on the users page and active; guests get read-only access.
 * Someone with a session who isn't on the allowlist is signed out.
 */
async function AccessGate({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect(await deniedRedirectPath());

  if (viewer.kind === "guest") {
    return (
      <ReadOnlyProvider readOnly>
        <GuestBanner />
        {children}
      </ReadOnlyProvider>
    );
  }
  return <ReadOnlyProvider readOnly={false}>{children}</ReadOnlyProvider>;
}

function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-info/25 bg-info-soft px-4 py-3 animate-fade-up sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-info/15 text-info"><Eye className="size-[18px]" /></span>
        <div>
          <p className="font-medium text-fg">คุณกำลังดูในโหมดผู้เยี่ยมชม</p>
          <p className="text-muted">ดูข้อมูลได้อย่างเดียว เข้าสู่ระบบเพื่อเพิ่มหรือแก้ไขข้อมูล</p>
        </div>
      </div>
      <form action={exitGuestAction}>
        <SubmitButton size="sm" variant="primary"><LogIn />เข้าสู่ระบบ</SubmitButton>
      </form>
    </div>
  );
}

/** Static sidebar placeholder while the user loads (no hooks like usePathname, which aren't allowed in a Suspense fallback) */
function SidebarSkeleton() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-border bg-surface/80 px-4 py-6 backdrop-blur-xl lg:flex">
      <Skeleton className="h-10 w-40" />
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
      <Skeleton className="mt-auto h-16 rounded-2xl" />
    </aside>
  );
}

const initials = (name: string) => name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

async function AppSidebar() {
  const [viewer, settings] = await Promise.all([getViewer(), getAppSettings()]);
  const hidden = [
    ...(viewer?.kind === "user" ? [] : ["/users", "/settings"]),
    ...(settings.inventoryEnabled ? [] : ["/parts"]), // no stock kept → no stock menu
  ];
  return <Sidebar hiddenHrefs={hidden} userSlot={<ViewerCard viewer={viewer} />} />;
}

function ViewerCard({ viewer }: { viewer: Viewer }) {
  if (!viewer) return null;
  const guest = viewer.kind === "guest";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
      <span
        className={
          guest
            ? "grid size-10 shrink-0 place-items-center rounded-full bg-info-soft text-info"
            : "grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-2 text-sm font-semibold text-white shadow-glow"
        }
      >
        {guest ? <Eye className="size-[18px]" /> : initials(viewer.user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{guest ? "ผู้เยี่ยมชม" : viewer.user.name}</p>
        <p className="truncate text-xs text-muted">{guest ? "ดูได้อย่างเดียว" : userRole[viewer.user.role].label}</p>
      </div>
      <form action={guest ? exitGuestAction : signOutAction}>
        <SubmitButton
          variant="ghost"
          size="icon"
          aria-label={guest ? "เข้าสู่ระบบ" : "ออกจากระบบ"}
          title={guest ? "เข้าสู่ระบบ" : "ออกจากระบบ"}
          className={guest ? "hover:bg-primary-soft hover:text-primary" : "hover:bg-danger-soft hover:text-danger"}
        >
          {guest ? <LogIn /> : <LogOut />}
        </SubmitButton>
      </form>
    </div>
  );
}
