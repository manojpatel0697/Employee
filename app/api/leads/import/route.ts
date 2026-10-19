import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

interface CsvRow {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  // Allow any additional columns in the CSV
  [key: string]: string | undefined;
}

/** Verifies that the request carries a valid admin secret key header. */
function isAdminAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  const provided = request.headers.get("x-admin-key");
  return provided === adminKey;
}

// POST /api/leads/import — accepts multipart/form-data with a 'file' field (CSV)
// Requires x-admin-key header matching ADMIN_SECRET_KEY.
export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: "Failed to parse form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "No file provided in form data" },
      { status: 400 }
    );
  }

  const csvText = await (file as File).text();

  const { data: rows, errors } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "CSV parse errors", details: errors },
      { status: 422 }
    );
  }

  if (!rows.length) {
    return NextResponse.json({ inserted: 0 });
  }

  const inserts = rows.map((row) => ({
    company_name: row.company_name ?? "",
    contact_person: row.contact_person ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    source: row.source ?? "CSV Import",
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: count ?? inserts.length });
}
