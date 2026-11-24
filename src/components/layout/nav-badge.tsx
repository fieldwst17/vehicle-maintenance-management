"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { fetchJson, queryKeys, type NavBadges } from "@/lib/query-keys";

const tones = {
  danger: "bg-danger text-white",
  warning: "bg-warning text-white",
  primary: "bg-primary text-primary-fg",
};

/** Shared by every nav item: one request (same query key), refreshed every minute and when the tab regains focus */
export function useNavBadges() {
  return useQuery({
    queryKey: queryKeys.navBadges,
    queryFn: ({ signal }) => fetchJson<NavBadges>("/api/nav-badges", signal),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function NavBadge({ href }: { href: string }) {
  const { data } = useNavBadges();
  const badge = data?.[href];
  if (!badge) return null;
  return (
    <span
      key={badge.count} // re-mount on change so the pop animation plays when the number moves
      className={cn("min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums shadow-soft animate-pop", tones[badge.tone])}
      title={`${badge.count} รายการที่ต้องดำเนินการ`}
    >
      {badge.count > 99 ? "99+" : badge.count}
    </span>
  );
}
