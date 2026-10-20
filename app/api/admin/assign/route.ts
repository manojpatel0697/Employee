import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeUuid } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/** Verifies that the request carries a valid admin secret key header. */
function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

// POST /api/admin/assign — assigns a lead to an employee.
// Rate limited: 60 assignments per minute per IP.
// Requires x-admin-key header.
export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin:assign:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
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

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Sanitize — both must be valid UUIDs
  const leadId = sanitizeUuid(rawBody.leadId);
  const employeeId = sanitizeUuid(rawBody.employeeId);

  if (!leadId || !employeeId) {
    return NextResponse.json(
      { error: "leadId and employeeId are required and must be valid UUIDs" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .update({
      assigned_to: employeeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("assign error:", error.message);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}
