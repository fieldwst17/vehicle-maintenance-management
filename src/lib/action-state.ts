// Shared result type for every server action used with <ActionForm> / <ActionButton>
export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string> } | null;

export const ok = (message: string): ActionState => ({ ok: true, message });
export const fail = (message: string, fieldErrors?: Record<string, string>): ActionState => ({ ok: false, message, fieldErrors });
