import { getViewer } from "@/lib/auth/viewer";
import { getNavBadges } from "@/lib/nav-badges";

// Sidebar badge counts (polled by the sidebar via TanStack Query). Guests may read it too.
export async function GET() {
  if (!(await getViewer())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await getNavBadges(), { headers: { "cache-control": "no-store" } });
}
