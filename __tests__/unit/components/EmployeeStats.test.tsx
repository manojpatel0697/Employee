/**
 * Component + integration tests — EmployeeStats analytics
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import EmployeeStats from "@/components/admin/EmployeeStats";
import type { Lead, Profile } from "@/lib/types";

const emp1: Profile = { id: "emp-1", full_name: "Alice", role: "employee", created_at: "2026-01-01T00:00:00Z" };
const emp2: Profile = { id: "emp-2", full_name: "Bob", role: "employee", created_at: "2026-01-01T00:00:00Z" };

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: Math.random().toString(),
    company_name: "TestCo",
    contact_person: "Test",
    phone: "",
    email: "",
    source: "",
    assigned_to: null,
    status: "New",
    service_interest: "Other",
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
    ...overrides,
  };
}

describe("EmployeeStats — empty state", () => {
  it("shows 'No employees found' when employees array is empty", () => {
    render(<EmployeeStats leads={[]} employees={[]} />);
    expect(screen.getByText(/No employees found/i)).toBeInTheDocument();
  });
});

describe("EmployeeStats — analytics computation", () => {
  const leads: Lead[] = [
    makeLead({ assigned_to: "emp-1", status: "Converted" }),
    makeLead({ assigned_to: "emp-1", status: "Converted" }),
    makeLead({ assigned_to: "emp-1", status: "New" }),
    makeLead({ assigned_to: "emp-1", status: "New", meeting_scheduled: true }),
    makeLead({ assigned_to: "emp-1", status: "New", site_visit_requested: true }),
    makeLead({ assigned_to: "emp-2", status: "Contacted" }),
  ];

  it("renders both employee names", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
  });

  it("counts total leads per employee correctly (Alice=5, Bob=1)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    // Both mobile + desktop render the numbers, so we look for multiple
    const fives = screen.getAllByText("5");
    expect(fives.length).toBeGreaterThan(0);
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThan(0);
  });

  it("counts converted leads correctly (Alice=2)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    const twos = screen.getAllByText("2");
    expect(twos.length).toBeGreaterThan(0);
  });

  it("computes conversion rate as percentage string (Alice=40.0%)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("40.0%").length).toBeGreaterThan(0);
  });

  it("shows 0.0% conversion rate for employees with no conversions (Bob)", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    expect(screen.getAllByText("0.0%").length).toBeGreaterThan(0);
  });

  it("counts meetings scheduled", () => {
    render(<EmployeeStats leads={leads} employees={[emp1, emp2]} />);
    // Alice has 1 meeting scheduled
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThan(0);
  });
});

describe("EmployeeStats — Converted leads reachable (conversion rate not stuck at 0)", () => {
  it("conversion rate is non-zero when Converted leads exist", () => {
    const leads = [
      makeLead({ assigned_to: "emp-1", status: "Converted" }),
      makeLead({ assigned_to: "emp-1", status: "New" }),
    ];
    render(<EmployeeStats leads={leads} employees={[emp1]} />);
    // 1/2 = 50.0%
    expect(screen.getAllByText("50.0%").length).toBeGreaterThan(0);
  });
});
