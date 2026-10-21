import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";
import type { LeadStatus } from "@/lib/types";

describe("Badge component", () => {
  const statuses: LeadStatus[] = [
    "New","Picked Up","Interested","Demo Sent",
    "Meeting Scheduled","Site Visit Requested","Converted","Dropped",
  ];

  statuses.forEach((status) => {
    it(`renders "${status}"`, () => {
      render(<Badge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  });

  it("Converted badge has green colour", () => {
    const { container } = render(<Badge status="Converted" />);
    expect(container.firstChild).toHaveClass("bg-green-100");
  });
  it("Dropped badge has red colour", () => {
    const { container } = render(<Badge status="Dropped" />);
    expect(container.firstChild).toHaveClass("bg-red-100");
  });
  it("Picked Up badge has blue colour", () => {
    const { container } = render(<Badge status="Picked Up" />);
    expect(container.firstChild).toHaveClass("bg-blue-100");
  });
  it("renders as span", () => {
    const { container } = render(<Badge status="New" />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });
});
