import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next|.*\\..*).*)"],
};
