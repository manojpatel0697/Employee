import React from "react";
import { render, screen } from "@testing-library/react";
import EmployeeStats from "@/components/admin/EmployeeStats";
import type { Lead, Profile } from "@/lib/types";

const emp1: Profile = { id: "emp-1", full_name: "Alice", role: "employee", created_at: "2026-01-01T00:00:00Z" };
const emp2: Profile = { id: "emp-2", full_name: "Bob", role: "employee", created_at: "2026-01-01T00:00:00Z" };

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: Math.random().toString(),
    sl_no: null, name: "TestCo", company_name: "TestCo",
    contact_person: "Test", phone: "", email: "", source: "",
    category: "", search_category: "", area: "", address: "", map_link: "",
    assigned_to: null, status: "New", service_interest: "Other",
    picked_up: false, call_status: null,
    is_interested: null, demo_website_sent: false, demo_liked: null,
    meeting_scheduled: false, meeting_type: null, meeting_date_time: null,
    site_visit_requested: false, notes: "",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("EmployeeStats — empty state", () => {
  it("shows 'No employees found' when empty", () => {
    render(<EmployeeStats leads={[]} employees={[]} />);
    expect(screen.getByText(/No employees found/i)).toBeInTheDocument();
  });
});

describe("EmployeeStats — analytics", () => {
  const leads = [
    makeLead({ assigned_to: "emp-1", status: "Converted" }),
    makeLead({ assigned_to: "emp-1", status: "Converted" }),
    makeLead({ assigned_to: "emp-1", status: "New" }),
    makeLead({ assigned_to: "emp-1", status: "New", meeting_scheduled: true }),
    makeLead({ assigned_to: "emp-1", status: "New", site_visit_requested: true }),
    makeLead({ assigned_to: "emp-2", status: "Interested" }),
  ];

  it("renders both employee names", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
  });

  it("counts total leads per employee (Alice=5)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("conversion rate for Alice (2/5 = 40.0%)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("40.0%").length).toBeGreaterThan(0);
  });

  it("0.0% for Bob who has no conversions", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("0.0%").length).toBeGreaterThan(0);
  });
});
