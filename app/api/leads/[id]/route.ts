import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { LeadStatus } from "@/lib/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText, sanitizeEnum, sanitizeUuid } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "New", "Picked Up", "Interested", "Demo Sent",
  "Meeting Scheduled", "Site Visit Requested", "Converted", "Dropped",
] as const;

const VALID_CALL_STATUSES = ["Answered", "Not Answered", "Busy", "Switched Off"] as const;
const VALID_MEETING_TYPES = ["Google Meet", "Onsite"] as const;

// PATCH /api/leads/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`leads:patch:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { id: rawId } = await params;
  const leadId = sanitizeUuid(rawId);
  if (!leadId) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

  // Auth check
  const authClient = createServerComponentClient({ cookies });
  const { data: { session } } = await authClient.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const toBool = (v: unknown): boolean | null => typeof v === "boolean" ? v : null;

  // Sanitise all writable fields
  const update: Record<string, unknown> = {
    // Pipeline booleans
    picked_up: typeof raw.picked_up === "boolean" ? raw.picked_up : undefined,
    call_status: raw.call_status !== undefined
      ? sanitizeEnum(raw.call_status, VALID_CALL_STATUSES)
      : undefined,
    is_interested: raw.is_interested !== undefined ? toBool(raw.is_interested) : undefined,
    demo_website_sent: typeof raw.demo_website_sent === "boolean" ? raw.demo_website_sent : undefined,
    demo_liked: raw.demo_liked !== undefined ? toBool(raw.demo_liked) : undefined,
    meeting_scheduled: typeof raw.meeting_scheduled === "boolean" ? raw.meeting_scheduled : undefined,
    meeting_type: raw.meeting_type !== undefined
      ? (raw.meeting_type === null ? null : sanitizeEnum(raw.meeting_type, VALID_MEETING_TYPES))
      : undefined,
    meeting_date_time: (() => {
      if (raw.meeting_date_time === null || raw.meeting_date_time === undefined) return raw.meeting_date_time;
      const d = new Date(String(raw.meeting_date_time));
      return isNaN(d.getTime()) ? null : d.toISOString();
    })(),
    site_visit_requested: typeof raw.site_visit_requested === "boolean" ? raw.site_visit_requested : undefined,
    notes: raw.notes !== undefined ? sanitizeText(raw.notes, 5_000) : undefined,
    status: raw.status !== undefined ? sanitizeEnum(raw.status, VALID_STATUSES) : undefined,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined fields
  const payload = Object.fromEntries(
    Object.entries(update).filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("leads PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }

  return NextResponse.json(data);
}
