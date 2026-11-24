import { auth } from "@/lib/auth/server";

// Proxies Better Auth requests from the browser to Neon Auth (same-origin)
export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
