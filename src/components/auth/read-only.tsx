"use client";

import { createContext, useContext, type ReactNode } from "react";

// Read-only mode (guest): edit controls hide themselves; the server also rejects every write
const ReadOnlyContext = createContext(false);

export const useReadOnly = () => useContext(ReadOnlyContext);

export function ReadOnlyProvider({ readOnly, children }: { readOnly: boolean; children: ReactNode }) {
  return <ReadOnlyContext.Provider value={readOnly}>{children}</ReadOnlyContext.Provider>;
}

/** Shows children only for users who can edit (hidden in guest mode) */
export function EditOnly({ children }: { children: ReactNode }) {
  return useReadOnly() ? null : <>{children}</>;
}
