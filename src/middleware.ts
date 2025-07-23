import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ Skip middleware for public routes
  const PUBLIC_ROUTES = [
    "/",
    "/signin",
    "/signup",
    "/api",
    "/_next",
    "/favicon.ico",
  ];
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

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
