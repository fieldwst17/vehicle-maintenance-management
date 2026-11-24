// Query keys in one place, so invalidation and reads always match
export const queryKeys = {
  navBadges: ["nav-badges"] as const,
  parts: (q: string) => ["parts", q] as const,
};

/** GET JSON from our own API; throws on a non-2xx so TanStack Query treats it as an error */
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

export type NavBadges = {
  /** Keyed by nav href */
  [href: string]: { count: number; tone: "danger" | "warning" | "primary" } | undefined;
};

export type PartHit = { id: string; name: string; partNumber: string; unit: string; unitCost: number; stockQuantity: number; low: boolean };
