import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface LeadUpdateBody {
  service_interest?: string;
  is_interested?: boolean | null;
  demo_website_sent?: boolean;
  demo_liked?: boolean | null;
  meeting_scheduled?: boolean;
  meeting_type?: string | null;
  meeting_date_time?: string | null;
  site_visit_requested?: boolean;
  notes?: string;
}

/**
 * Derives the lead status from boolean pipeline fields.
 * Priority order (highest → lowest):
 *   site_visit_requested > meeting_scheduled > demo_website_sent
 *   > is_interested === false (Dropped) > is_interested === true (Contacted)
 *   > New
 */
function deriveStatus(fields: LeadUpdateBody): LeadStatus {
  if (fields.site_visit_requested) return "Site Visit Requested";
  if (fields.meeting_scheduled) return "Meeting Scheduled";
  if (fields.demo_website_sent) return "Demo Sent";
  if (fields.is_interested === false) return "Dropped";
  if (fields.is_interested === true) return "Contacted";
  return "New";
}

// PATCH /api/leads/[id] — updates pipeline fields and auto-derives status.
// Requires an authenticated Supabase session (employee or admin).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify caller has a valid Supabase session
  const cookieStore = cookies();
  const authClient = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await authClient.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: LeadUpdateBody;
  try {
    body = (await request.json()) as LeadUpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = deriveStatus(body);

  const { data, error } = await supabase
    .from("leads")
    .update({ ...body, status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
