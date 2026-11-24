import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

// Signs out, then sends the user back to the login page (used when an account isn't allowed in)
export async function GET(request: Request) {
  await auth.signOut();
  const reason = new URL(request.url).searchParams.get("reason");
  const to = new URL("/auth/sign-in", request.url);
  if (reason === "not-allowed") to.searchParams.set("error", "not-allowed");
  return NextResponse.redirect(to);
}
