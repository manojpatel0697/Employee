import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeEnum,
  sanitizeUuid,
  sanitizePrdContent,
} from "@/lib/sanitize";
import type { LovableGenerationStatus, DevelopmentStatusEnum } from "@/lib/types";

export const dynamic = "force-dynamic";

const LOVABLE_STATUSES: LovableGenerationStatus[] = [
  "Pending Email Intake",
  "Generated via Lovable",
  "In Development",
  "Review",
  "Completed",
];

const DEV_STATUSES: DevelopmentStatusEnum[] = [
  "Not Started",
  "Frontend Built",
  "Backend & DB Hooked",
  "Deployed",
  "Live",
];

/** Verifies that the request carries a valid admin secret key header. */
function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

// GET /api/projects — returns all PRDs joined with assigned developer full_name.
// Rate limited: 60 req / minute per IP. Requires x-admin-key header.
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`projects:get:${ip}`, 60, 60_000);
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

  const { data, error } = await supabase
    .from("projects_prd")
    .select("*, profiles!assigned_developer_id(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("projects GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/projects — creates a new project PRD row.
// Rate limited: 20 creates per 10 minutes per IP.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`projects:post:${ip}`, 20, 10 * 60_000);
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

  // Sanitize all fields
  const client_name = sanitizeText(rawBody.client_name, 200);
  const client_email = sanitizeEmail(rawBody.client_email);
  const prd_content = sanitizePrdContent(rawBody.prd_content);
  const lovable_generation_status =
    sanitizeEnum(rawBody.lovable_generation_status, LOVABLE_STATUSES) ??
    "Pending Email Intake";
  const development_status =
    sanitizeEnum(rawBody.development_status, DEV_STATUSES) ?? "Not Started";
  const current_blocker = rawBody.current_blocker
    ? sanitizeText(rawBody.current_blocker, 500) || null
    : null;
  const assigned_developer_id = rawBody.assigned_developer_id
    ? sanitizeUuid(rawBody.assigned_developer_id)
    : null;

  if (!client_name) {
    return NextResponse.json({ error: "client_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects_prd")
    .insert({
      client_name,
      client_email,
      prd_content,
      lovable_generation_status,
      development_status,
      current_blocker,
      assigned_developer_id,
    })
    .select()
    .single();

  if (error) {
    console.error("projects POST error:", error.message);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/projects — updates an existing project PRD row by id.
// Rate limited: 60 updates per minute per IP.
export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`projects:patch:${ip}`, 60, 60_000);
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

  const id = sanitizeUuid(rawBody.id);
  if (!id) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  // Build a sanitized update payload — only update fields that are present
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (rawBody.client_name !== undefined)
    updates.client_name = sanitizeText(rawBody.client_name, 200);
  if (rawBody.client_email !== undefined)
    updates.client_email = sanitizeEmail(rawBody.client_email);
  if (rawBody.prd_content !== undefined)
    updates.prd_content = sanitizePrdContent(rawBody.prd_content);
  if (rawBody.lovable_generation_status !== undefined) {
    const v = sanitizeEnum(rawBody.lovable_generation_status, LOVABLE_STATUSES);
    if (v) updates.lovable_generation_status = v;
  }
  if (rawBody.development_status !== undefined) {
    const v = sanitizeEnum(rawBody.development_status, DEV_STATUSES);
    if (v) updates.development_status = v;
  }
  if ("current_blocker" in rawBody) {
    updates.current_blocker = rawBody.current_blocker
      ? sanitizeText(rawBody.current_blocker, 500) || null
      : null;
  }
  if (rawBody.assigned_developer_id !== undefined) {
    updates.assigned_developer_id = rawBody.assigned_developer_id
      ? sanitizeUuid(rawBody.assigned_developer_id)
      : null;
  }

  const { data, error } = await supabase
    .from("projects_prd")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("projects PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }

  return NextResponse.json(data);
}
