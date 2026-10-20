import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // Admin secret-key guard: /admin/<secretKey>/...
  // Allows /admin/login through without a key check.
  // ------------------------------------------------------------------
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login")) {
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

  // ------------------------------------------------------------------
  // Developer portal session guard: /developer (not /developer/login)
  // Requires a Supabase session with role = 'developer'.
  // ------------------------------------------------------------------
  if (pathname === "/developer") {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/developer/login", request.url));
    }

    // Verify the user has the developer role in the profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "developer") {
      // Valid session but wrong role — sign them out and redirect
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/developer/login", request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/dashboard", "/developer"],
};
