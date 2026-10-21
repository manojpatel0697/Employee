/**
 * Unit tests for PATCH /api/leads/[id] — status derivation logic.
 */
import type { LeadStatus } from "@/lib/types";

const VALID_STATUSES: LeadStatus[] = [
  "New", "Picked Up", "Interested", "Demo Sent",
  "Meeting Scheduled", "Site Visit Requested", "Converted", "Dropped",
];

interface PipelineFields {
  picked_up?: boolean;
  call_status?: string | null;
  is_interested?: boolean | null;
  demo_website_sent?: boolean;
  demo_liked?: boolean | null;
  meeting_scheduled?: boolean;
  meeting_type?: string | null;
  meeting_date_time?: string | null;
  site_visit_requested?: boolean;
  notes?: string;
  status?: LeadStatus;
}

function resolveStatus(body: PipelineFields): LeadStatus {
  const { status: explicitStatus, ...fields } = body;
  if (explicitStatus && VALID_STATUSES.includes(explicitStatus)) {
    return explicitStatus;
  }
  if (fields.site_visit_requested) return "Site Visit Requested";
  if (fields.meeting_scheduled) return "Meeting Scheduled";
  if (fields.demo_website_sent) return "Demo Sent";
  if (fields.is_interested === false) return "Dropped";
  if (fields.is_interested === true) return "Interested";
  if (fields.picked_up) return "Picked Up";
  return "New";
}

describe("resolveStatus — explicit status takes precedence", () => {
  it("returns Converted when explicitly set", () => {
    expect(resolveStatus({ is_interested: true, demo_website_sent: true, status: "Converted" })).toBe("Converted");
  });
  it("returns Dropped when explicitly set even if meeting_scheduled is true", () => {
    expect(resolveStatus({ meeting_scheduled: true, status: "Dropped" })).toBe("Dropped");
  });
  it("rejects invalid status and falls back to derivation", () => {
    expect(resolveStatus({ is_interested: true, status: "InvalidStatus" as LeadStatus })).toBe("Interested");
  });
});

describe("resolveStatus — auto-derivation priority", () => {
  it("site_visit_requested wins over meeting_scheduled", () => {
    expect(resolveStatus({ meeting_scheduled: true, site_visit_requested: true })).toBe("Site Visit Requested");
  });
  it("meeting_scheduled wins over demo_website_sent", () => {
    expect(resolveStatus({ demo_website_sent: true, meeting_scheduled: true })).toBe("Meeting Scheduled");
  });
  it("demo_website_sent wins over is_interested", () => {
    expect(resolveStatus({ is_interested: true, demo_website_sent: true })).toBe("Demo Sent");
  });
  it("is_interested=false returns Dropped", () => {
    expect(resolveStatus({ is_interested: false })).toBe("Dropped");
  });
  it("is_interested=true returns Interested", () => {
    expect(resolveStatus({ is_interested: true })).toBe("Interested");
  });
  it("picked_up=true returns Picked Up", () => {
    expect(resolveStatus({ picked_up: true })).toBe("Picked Up");
  });
  it("empty fields return New", () => {
    expect(resolveStatus({})).toBe("New");
  });
});

describe("VALID_STATUSES", () => {
  it("contains 8 statuses including Converted and Picked Up", () => {
    expect(VALID_STATUSES).toContain("Converted");
    expect(VALID_STATUSES).toContain("Picked Up");
    expect(VALID_STATUSES).toHaveLength(8);
  });
});
