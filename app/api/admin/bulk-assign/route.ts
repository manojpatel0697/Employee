import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeUuid } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

/**
 * POST /api/admin/bulk-assign
 *
 * Assigns multiple leads to one employee in a single operation.
 * Body: { leadIds: string[], employeeId: string }
 *
 * Used by the admin dashboard when selecting 1-2000 leads
 * and assigning them all at once.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin:bulk-assign:${ip}`, 30, 60_000);
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

  let rawBody: { leadIds?: unknown; employeeId?: unknown };
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = sanitizeUuid(rawBody.employeeId);
  if (!employeeId) {
    return NextResponse.json({ error: "Valid employeeId is required" }, { status: 400 });
  }

  if (!Array.isArray(rawBody.leadIds) || rawBody.leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds must be a non-empty array" }, { status: 400 });
  }

  if (rawBody.leadIds.length > 5000) {
    return NextResponse.json({ error: "Cannot assign more than 5000 leads at once" }, { status: 400 });
  }

  // Validate every lead ID is a proper UUID
  const leadIds: string[] = [];
  for (const id of rawBody.leadIds) {
    const safe = sanitizeUuid(id);
    if (!safe) {
      return NextResponse.json({ error: `Invalid lead ID: ${String(id)}` }, { status: 400 });
    }
    leadIds.push(safe);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error, count } = await supabase
    .from("leads")
    .update({ assigned_to: employeeId, updated_at: new Date().toISOString() })
    .in("id", leadIds)
    .select("id");

  const assigned = Array.isArray(count) ? count.length : leadIds.length;  if (error) {
    console.error("Bulk assign error:", error.message);
    return NextResponse.json({ error: "Bulk assignment failed" }, { status: 500 });
  }

  return NextResponse.json({ assigned });
}
