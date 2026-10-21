import type { LeadStatus, ServiceInterest, MeetingType, LovableGenerationStatus, DevelopmentStatusEnum, UserRole, Lead, Profile, ProjectPRD } from "@/lib/types";

describe("LeadStatus enum values", () => {
  const validStatuses: LeadStatus[] = ["New","Picked Up","Interested","Demo Sent","Meeting Scheduled","Site Visit Requested","Converted","Dropped"];
  it("has 8 distinct status values", () => expect(new Set(validStatuses).size).toBe(8));
  it("includes Converted", () => expect(validStatuses).toContain("Converted"));
  it("includes Picked Up", () => expect(validStatuses).toContain("Picked Up"));
  it("includes Dropped", () => expect(validStatuses).toContain("Dropped"));
});
describe("ServiceInterest", () => {
  it("has 4 values", () => expect(["Camera","Web","Both","Other"] as ServiceInterest[]).toHaveLength(4));
});
describe("MeetingType", () => {
  it("has 2 values", () => expect(["Google Meet","Onsite"] as MeetingType[]).toHaveLength(2));
});
describe("LovableGenerationStatus", () => {
  const v: LovableGenerationStatus[] = ["Pending Email Intake","Generated via Lovable","In Development","Review","Completed"];
  it("has 5 stages", () => expect(v).toHaveLength(5));
});
describe("DevelopmentStatusEnum", () => {
  it("has 5 stages", () => expect(["Not Started","Frontend Built","Backend & DB Hooked","Deployed","Live"] as DevelopmentStatusEnum[]).toHaveLength(5));
});
describe("UserRole", () => {
  it("has 3 roles", () => expect(["admin","employee","developer"] as UserRole[]).toHaveLength(3));
});

const baseLead: Lead = {
  id: "uuid-1", sl_no: "1", name: "Acme Corp", company_name: "Acme Corp",
  contact_person: "John", phone: "1234567890", email: "john@acme.com",
  source: "XLSX Import", assigned_to: null,
  category: "Restaurant", search_category: "Restaurants", area: "MG Road",
  address: "123 MG Road", map_link: "https://maps.google.com",
  status: "New", service_interest: "Other",
  picked_up: false, call_status: null,
  is_interested: null, demo_website_sent: false, demo_liked: null,
  meeting_scheduled: false, meeting_type: null, meeting_date_time: null,
  site_visit_requested: false, notes: "",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

describe("Lead interface", () => {
  it("has all required fields", () => expect(baseLead.id).toBe("uuid-1"));
  it("allows null assigned_to", () => expect(baseLead.assigned_to).toBeNull());
  it("has new XLSX fields", () => {
    expect(baseLead.name).toBe("Acme Corp");
    expect(baseLead.category).toBe("Restaurant");
    expect(baseLead.area).toBe("MG Road");
  });
});

describe("Profile interface", () => {
  const p: Profile = { id: "uuid-emp", full_name: "Alice", role: "employee", created_at: "2026-01-01T00:00:00Z" };
  it("has required fields", () => expect(p.role).toBe("employee"));
});

describe("ProjectPRD interface", () => {
  const prd: ProjectPRD = {
    id: "prd-1", client_name: "BizCo", client_email: "biz@co.com", prd_content: "Build",
    lovable_generation_status: "Pending Email Intake", development_status: "Not Started",
    current_blocker: null, assigned_developer_id: null,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  };
  it("allows null current_blocker", () => expect(prd.current_blocker).toBeNull());
});
