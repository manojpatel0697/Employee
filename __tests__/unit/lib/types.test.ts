/**
 * Unit tests — TypeScript type guards and enum values.
 * These are pure compile-time checks that also serve as regression guards.
 */

import type {
  LeadStatus,
  ServiceInterest,
  MeetingType,
  LovableGenerationStatus,
  DevelopmentStatusEnum,
  UserRole,
  Lead,
  Profile,
  ProjectPRD,
} from "@/lib/types";

describe("LeadStatus enum values", () => {
  const validStatuses: LeadStatus[] = [
    "New",
    "Contacted",
    "Demo Sent",
    "Meeting Scheduled",
    "Site Visit Requested",
    "Converted",
    "Dropped",
  ];

  it("has 7 distinct status values", () => {
    expect(new Set(validStatuses).size).toBe(7);
  });

  it("includes Converted (required for conversion rate metric)", () => {
    expect(validStatuses).toContain("Converted");
  });

  it("includes Dropped", () => {
    expect(validStatuses).toContain("Dropped");
  });
});

describe("ServiceInterest enum values", () => {
  const values: ServiceInterest[] = ["Camera", "Web", "Both", "Other"];
  it("has 4 values", () => expect(values).toHaveLength(4));
});

describe("MeetingType enum values", () => {
  const values: MeetingType[] = ["Google Meet", "Onsite"];
  it("has 2 values", () => expect(values).toHaveLength(2));
});

describe("LovableGenerationStatus enum values", () => {
  const values: LovableGenerationStatus[] = [
    "Pending Email Intake",
    "Generated via Lovable",
    "In Development",
    "Review",
    "Completed",
  ];
  it("has 5 pipeline stages", () => expect(values).toHaveLength(5));
  it("starts with Pending Email Intake", () => expect(values[0]).toBe("Pending Email Intake"));
  it("ends with Completed", () => expect(values[4]).toBe("Completed"));
});

describe("DevelopmentStatusEnum values", () => {
  const values: DevelopmentStatusEnum[] = [
    "Not Started",
    "Frontend Built",
    "Backend & DB Hooked",
    "Deployed",
    "Live",
  ];
  it("has 5 stages", () => expect(values).toHaveLength(5));
});

describe("UserRole values", () => {
  const roles: UserRole[] = ["admin", "employee", "developer"];
  it("has 3 roles", () => expect(roles).toHaveLength(3));
});

describe("Lead interface shape", () => {
  const lead: Lead = {
    id: "uuid-1",
    company_name: "Acme Corp",
    contact_person: "John",
    phone: "1234567890",
    email: "john@acme.com",
    source: "CSV Import",
    assigned_to: null,
    status: "New",
    service_interest: "Web",
    is_interested: null,
    demo_website_sent: false,
    demo_liked: null,
    meeting_scheduled: false,
    meeting_type: null,
    meeting_date_time: null,
    site_visit_requested: false,
    notes: "",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("can be constructed with all required fields", () => {
    expect(lead.id).toBe("uuid-1");
    expect(lead.status).toBe("New");
  });

  it("allows null assigned_to", () => {
    expect(lead.assigned_to).toBeNull();
  });
});

describe("Profile interface shape", () => {
  const profile: Profile = {
    id: "uuid-emp",
    full_name: "Alice",
    role: "employee",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("has required fields", () => {
    expect(profile.role).toBe("employee");
  });
});

describe("ProjectPRD interface shape", () => {
  const prd: ProjectPRD = {
    id: "prd-1",
    client_name: "BizCo",
    client_email: "biz@co.com",
    prd_content: "Build a website",
    lovable_generation_status: "Pending Email Intake",
    development_status: "Not Started",
    current_blocker: null,
    assigned_developer_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("allows null current_blocker", () => {
    expect(prd.current_blocker).toBeNull();
  });
});
