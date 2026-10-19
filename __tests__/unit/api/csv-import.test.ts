/**
 * Unit tests — CSV parsing logic for /api/leads/import
 */
import Papa from "papaparse";

interface CsvRow {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  [key: string]: string | undefined;
}

function buildInserts(rows: CsvRow[]) {
  return rows.map((row) => ({
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
}

describe("CSV parsing and insert building", () => {
  const VALID_CSV = `company_name,contact_person,email,phone,source
Acme Corp,John Doe,john@acme.com,1234567890,LinkedIn
BizCo,Jane Smith,jane@biz.co,0987654321,Referral`;

  it("parses a valid CSV into rows", () => {
    const { data, errors } = Papa.parse<CsvRow>(VALID_CSV, {
      header: true,
      skipEmptyLines: true,
    });
    expect(errors).toHaveLength(0);
    expect(data).toHaveLength(2);
    expect(data[0].company_name).toBe("Acme Corp");
    expect(data[1].email).toBe("jane@biz.co");
  });

  it("buildInserts maps CSV rows to lead insert objects", () => {
    const { data } = Papa.parse<CsvRow>(VALID_CSV, {
      header: true,
      skipEmptyLines: true,
    });
    const inserts = buildInserts(data);
    expect(inserts).toHaveLength(2);
    expect(inserts[0].company_name).toBe("Acme Corp");
    expect(inserts[0].status).toBe("New");
    expect(inserts[0].service_interest).toBe("Other");
    expect(inserts[0].is_interested).toBeNull();
    expect(inserts[0].demo_website_sent).toBe(false);
    expect(inserts[0].notes).toBe("");
  });

  it("uses CSV Import as source fallback when source column is missing", () => {
    const csv = `company_name,email\nTestCo,test@co.com`;
    const { data } = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
    const inserts = buildInserts(data);
    expect(inserts[0].source).toBe("CSV Import");
  });

  it("preserves explicit source value from CSV", () => {
    const csv = `company_name,source\nTestCo,Webinar`;
    const { data } = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
    const inserts = buildInserts(data);
    expect(inserts[0].source).toBe("Webinar");
  });

  it("returns empty array for empty CSV", () => {
    const { data } = Papa.parse<CsvRow>("company_name,email\n", {
      header: true,
      skipEmptyLines: true,
    });
    expect(buildInserts(data)).toHaveLength(0);
  });

  it("handles missing fields with empty string defaults", () => {
    const csv = `company_name\nMissingCo`;
    const { data } = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
    const inserts = buildInserts(data);
    expect(inserts[0].email).toBe("");
    expect(inserts[0].phone).toBe("");
    expect(inserts[0].contact_person).toBe("");
  });
});
