/**
 * Component unit tests — PRDStatusCard (Developer portal)
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PRDStatusCard from "@/components/developer/PRDStatusCard";
import type { ProjectPRD } from "@/lib/types";

const basePRD: ProjectPRD & { developer_name?: string } = {
  id: "prd-1",
  client_name: "BizCo Ltd",
  client_email: "hello@bizco.com",
  prd_content: "Build a website with camera integration and web portal.",
  lovable_generation_status: "Pending Email Intake",
  development_status: "Not Started",
  current_blocker: null,
  assigned_developer_id: null,
  developer_name: undefined,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("PRDStatusCard — rendering", () => {
  it("renders client name", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText("BizCo Ltd")).toBeInTheDocument();
  });

  it("renders client email", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText("hello@bizco.com")).toBeInTheDocument();
  });

  it("renders PRD content snippet", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText(/Build a website/)).toBeInTheDocument();
  });

  it("truncates PRD content to 200 chars with ellipsis", () => {
    const longContent = "A".repeat(300);
    render(<PRDStatusCard project={{ ...basePRD, prd_content: longContent }} />);
    const text = screen.getByText(/^A+\.\.\./);
    expect(text.textContent).toHaveLength(203); // 200 + "..."
  });

  it("renders Lovable Generation Status section", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText(/Lovable Generation Status/i)).toBeInTheDocument();
  });

  it("renders Development Progress section", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText(/Development Progress/i)).toBeInTheDocument();
  });

  it("shows 'No developer assigned' when no developer", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText(/No developer assigned/i)).toBeInTheDocument();
  });

  it("shows developer name when assigned", () => {
    render(<PRDStatusCard project={{ ...basePRD, developer_name: "Alice Dev" }} />);
    expect(screen.getByText("Alice Dev")).toBeInTheDocument();
  });
});

describe("PRDStatusCard — blocker alert", () => {
  it("does NOT render alert when current_blocker is null", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders alert with blocker text when present", () => {
    render(
      <PRDStatusCard
        project={{ ...basePRD, current_blocker: "Waiting on client API keys" }}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Waiting on client API keys");
  });
});

describe("PRDStatusCard — Lovable stepper", () => {
  it("marks current step with aria-current=step", () => {
    render(<PRDStatusCard project={{ ...basePRD, lovable_generation_status: "In Development" }} />);
    const currentStep = document.querySelector("[aria-current='step']");
    expect(currentStep).toBeInTheDocument();
  });

  it("shows all 5 Lovable steps", () => {
    render(<PRDStatusCard project={basePRD} />);
    expect(screen.getByText("Pending Email Intake")).toBeInTheDocument();
    expect(screen.getByText("Generated via Lovable")).toBeInTheDocument();
    expect(screen.getByText("In Development")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
