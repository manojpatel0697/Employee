import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // Admin secret-key guard: /admin/<secretKey>/...
  // ------------------------------------------------------------------
  if (pathname.startsWith("/admin/")) {
    // Extract the segment immediately after /admin/
    const segments = pathname.split("/"); // ['', 'admin', '<key>', ...]
    const providedKey = segments[2] ?? "";
    const adminKey = process.env.ADMIN_SECRET_KEY ?? "";

    if (!adminKey || providedKey !== adminKey) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }
  }

  // ------------------------------------------------------------------
  // Employee dashboard session guard: /employee/dashboard
  // ------------------------------------------------------------------
  if (pathname === "/employee/dashboard") {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/employee/login", request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/dashboard"],
};
