import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Verifies that the request carries a valid admin secret key header. */
function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

// GET /api/leads — returns all leads joined with assigned profile full_name.
// Rate limited: 60 req / minute per IP.
// Requires x-admin-key header matching ADMIN_SECRET_KEY.
export async function GET(request: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`leads:get:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("leads")
    .select("*, profiles!assigned_to(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }

  return NextResponse.json(data);
}
