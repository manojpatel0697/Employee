import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText, sanitizePhone, sanitizeUuid } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// Max file size: 10 MB (XLSX files are larger than CSV)
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Max rows per import batch
const MAX_ROWS = 5_000;

interface SheetRow {
  sl_no?: string | number;
  name?: string;
  phone?: string | number;
  category?: string;
  search_category?: string;
  area?: string;
  address?: string;
  map_link?: string;
  // Also accept legacy CSV column names
  company_name?: string;
  contact_person?: string;
  source?: string;
  [key: string]: unknown;
}

function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  return request.headers.get("x-admin-key") === adminKey;
}

/**
 * Normalise a row from either XLSX or CSV to our standard shape.
 * Column matching is case-insensitive and strips extra whitespace.
 */
function normaliseRow(rawRow: Record<string, unknown>): SheetRow {
  const row: SheetRow = {};
  for (const [key, val] of Object.entries(rawRow)) {
    const k = key.trim().toLowerCase().replace(/\s+/g, "_");
    row[k] = val;
  }
  return row;
}

// POST /api/leads/import
// Accepts multipart/form-data with:
//   file        — XLSX or CSV file
//   assignTo    — (optional) employee UUID to bulk-assign all imported leads
// Requires x-admin-key header.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`leads:import:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many import requests. Please wait before retrying." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const assignToRaw = formData.get("assignTo");
  const assignTo = assignToRaw ? sanitizeUuid(String(assignToRaw)) : null;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = file as File;

  if (blob.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` },
      { status: 413 }
    );
  }

  const fileName = blob.name?.toLowerCase() ?? "";
  const isXlsx =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    blob.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    blob.type === "application/vnd.ms-excel";
  const isCsv =
    fileName.endsWith(".csv") ||
    blob.type === "text/csv" ||
    blob.type === "text/plain" ||
    blob.type === "application/csv";

  if (!isXlsx && !isCsv) {
    return NextResponse.json(
      { error: "File must be an Excel (.xlsx) or CSV file" },
      { status: 415 }
    );
  }

  let rows: SheetRow[] = [];

  if (isXlsx) {
    // Dynamic import — xlsx is a large library, only load when needed
    const XLSX = await import("xlsx");
    const buffer = await blob.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false, // convert all values to strings
    });
    rows = rawRows.map(normaliseRow);
  } else {
    // CSV parsing
    const Papa = (await import("papaparse")).default;
    const csvText = await blob.text();
    const { data, errors } = Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parse error", details: errors.slice(0, 5) },
        { status: 422 }
      );
    }
    rows = data.map(normaliseRow);
  }

  if (!rows.length) {
    return NextResponse.json({ inserted: 0 });
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS} per import). Split your file into smaller batches.` },
      { status: 400 }
    );
  }

  // Build sanitised insert objects
  const inserts = rows.map((row) => {
    // Resolve name — prefer 'name', fall back to 'contact_person' or 'company_name'
    const resolvedName =
      sanitizeText(row.name, 200) ||
      sanitizeText(row.contact_person, 200) ||
      sanitizeText(row.company_name, 200) ||
      "";

    return {
      // New XLSX columns
      sl_no: row.sl_no ? String(row.sl_no).trim().slice(0, 20) : null,
      name: resolvedName,
      phone: sanitizePhone(row.phone !== undefined ? String(row.phone) : ""),
      category: sanitizeText(row.category, 200),
      search_category: sanitizeText(row.search_category, 200),
      area: sanitizeText(row.area, 200),
      address: sanitizeText(row.address, 500),
      map_link: sanitizeText(row.map_link, 500),

      // Legacy / required columns
      company_name: sanitizeText(row.company_name || resolvedName, 200),
      contact_person: resolvedName,
      email: "",
      source: sanitizeText(row.source as string || "XLSX Import", 100),

      // Assignment
      assigned_to: assignTo ?? null,

      // Pipeline defaults
      status: "New" as const,
      service_interest: "Other" as const,
      picked_up: false,
      call_status: null,
      is_interested: null,
      demo_website_sent: false,
      demo_liked: null,
      meeting_scheduled: false,
      meeting_type: null,
      meeting_date_time: null,
      site_visit_requested: false,
      notes: "",
    };
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert in batches of 500 to avoid payload limits
  const BATCH = 500;
  let totalInserted = 0;
  for (let i = 0; i < inserts.length; i += BATCH) {
    const batch = inserts.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("leads")
      .insert(batch, { count: "exact" });

    if (error) {
      console.error("Import batch error:", error.message);
      return NextResponse.json(
        { error: "Import failed", details: error.message, inserted: totalInserted },
        { status: 500 }
      );
    }
    totalInserted += count ?? batch.length;
  }

  return NextResponse.json({ inserted: totalInserted });
}
