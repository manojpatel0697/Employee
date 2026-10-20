import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { LeadStatus } from "@/lib/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  sanitizeText,
  sanitizeEnum,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUuid,
} from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "New",
  "Contacted",
  "Demo Sent",
  "Meeting Scheduled",
  "Site Visit Requested",
  "Converted",
  "Dropped",
] as const;

const VALID_SERVICE_INTERESTS = ["Camera", "Web", "Both", "Other"] as const;
const VALID_MEETING_TYPES = ["Google Meet", "Onsite"] as const;

/**
 * Derives the lead status from boolean pipeline fields.
 * Only used when the caller does not supply an explicit status.
 */
function deriveStatus(fields: Record<string, unknown>): LeadStatus {
  if (fields.site_visit_requested) return "Site Visit Requested";
  if (fields.meeting_scheduled) return "Meeting Scheduled";
  if (fields.demo_website_sent) return "Demo Sent";
  if (fields.is_interested === false) return "Dropped";
  if (fields.is_interested === true) return "Contacted";
  return "New";
}

// PATCH /api/leads/[id] — updates pipeline fields for a lead.
// Rate limited: 30 req / minute per user session.
// Requires an authenticated Supabase session (employee or admin).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 updates per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`leads:patch:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // Await params — required in Next.js 15
  const { id: rawId } = await params;

  // Validate lead ID
  const leadId = sanitizeUuid(rawId);
  if (!leadId) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  // Verify caller has a valid Supabase session (Next.js 15: pass cookies directly)
  const authClient = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await authClient.auth.getSession();
  if (!session) {
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

  // ── Sanitize and validate every field ──────────────────────────
  const service_interest = sanitizeEnum(rawBody.service_interest, VALID_SERVICE_INTERESTS);
  const meeting_type =
    rawBody.meeting_type === null || rawBody.meeting_type === undefined
      ? null
      : sanitizeEnum(rawBody.meeting_type, VALID_MEETING_TYPES);

  // Booleans
  const toBool = (v: unknown): boolean | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    return null;
  };

  const is_interested = toBool(rawBody.is_interested);
  const demo_website_sent = typeof rawBody.demo_website_sent === "boolean" ? rawBody.demo_website_sent : false;
  const demo_liked = toBool(rawBody.demo_liked);
  const meeting_scheduled = typeof rawBody.meeting_scheduled === "boolean" ? rawBody.meeting_scheduled : false;
  const site_visit_requested = typeof rawBody.site_visit_requested === "boolean" ? rawBody.site_visit_requested : false;

  // Datetime — validate ISO 8601 format
  const meeting_date_time_raw = rawBody.meeting_date_time;
  let meeting_date_time: string | null = null;
  if (typeof meeting_date_time_raw === "string" && meeting_date_time_raw.trim()) {
    const dt = new Date(meeting_date_time_raw);
    meeting_date_time = isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  // Notes — strip HTML
  const notes = sanitizeText(rawBody.notes, 5_000);

  // Explicit status — validate or derive
  const explicitStatus = sanitizeEnum(rawBody.status, VALID_STATUSES);

  const pipelineFields = {
    service_interest,
    is_interested,
    demo_website_sent,
    demo_liked,
    meeting_scheduled,
    meeting_type: meeting_scheduled ? meeting_type : null,
    meeting_date_time: meeting_scheduled ? meeting_date_time : null,
    site_visit_requested,
    notes,
  };

  const status: LeadStatus =
    explicitStatus ??
    deriveStatus({
      site_visit_requested,
      meeting_scheduled,
      demo_website_sent,
      is_interested,
    });

  const { data, error } = await supabase
    .from("leads")
    .update({ ...pipelineFields, status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    // Never expose raw DB error messages to clients
    console.error("leads PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }

  return NextResponse.json(data);
}
