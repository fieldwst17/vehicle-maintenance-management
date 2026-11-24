"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query, for data the browser fetches itself (live badges, search-as-you-type).
 * Pages still load their main data in Server Components; this is not a replacement for that.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session (useState, not a module global, so server renders never share it)
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // data fetched in the last 30s is reused without a refetch
            retry: 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
