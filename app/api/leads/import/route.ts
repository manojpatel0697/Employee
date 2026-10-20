import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// Max CSV file size: 5 MB
const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Max rows per import
const MAX_ROWS = 5_000;

interface CsvRow {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  [key: string]: string | undefined;
}

/** Verifies that the request carries a valid admin secret key header. */
function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

// POST /api/leads/import — accepts multipart/form-data with a 'file' field (CSV).
// Rate limited: 10 imports per 5 minutes per IP (prevents bulk spam).
// Requires x-admin-key header matching ADMIN_SECRET_KEY.
export async function POST(request: Request) {
  // Rate limit: 10 CSV imports per 5 minutes per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`leads:import:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many import requests. Please wait before trying again." },
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = file as File;

  // File size guard
  if (blob.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` },
      { status: 413 }
    );
  }

  // MIME type guard — only CSV
  if (blob.type && !["text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"].includes(blob.type)) {
    return NextResponse.json({ error: "File must be a CSV" }, { status: 415 });
  }

  const csvText = await blob.text();

  const { data: rows, errors } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: errors.slice(0, 5) }, { status: 422 });
  }

  if (!rows.length) {
    return NextResponse.json({ inserted: 0 });
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS} per import)` },
      { status: 400 }
    );
  }

  // Sanitize every field before insertion
  const inserts = rows.map((row) => ({
    company_name: sanitizeText(row.company_name, 200),
    contact_person: sanitizeText(row.contact_person, 200),
    email: sanitizeEmail(row.email) || sanitizeText(row.email, 254),
    phone: sanitizePhone(row.phone),
    source: sanitizeText(row.source || "CSV Import", 100),
    status: "New" as const,
    service_interest: "Other" as const,
    is_interested: null,
    demo_website_sent: false,
    demo_liked: null,
    meeting_scheduled: false,
    meeting_type: null,
    meeting_date_time: null,
    site_visit_requested: false,
    notes: "",
  }));

  const { error, count } = await supabase
    .from("leads")
    .insert(inserts, { count: "exact" });

  if (error) {
    console.error("CSV import error:", error.message);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }

  return NextResponse.json({ inserted: count ?? inserts.length });
}
