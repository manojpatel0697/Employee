/**
 * Component unit tests — Badge (lead status badge)
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";
import type { LeadStatus } from "@/lib/types";

describe("Badge component", () => {
  const statuses: LeadStatus[] = [
    "New",
    "Contacted",
    "Demo Sent",
    "Meeting Scheduled",
    "Site Visit Requested",
    "Converted",
    "Dropped",
  ];

  statuses.forEach((status) => {
    it(`renders status text for "${status}"`, () => {
      render(<Badge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  });

  it("Converted badge has green colour class", () => {
    const { container } = render(<Badge status="Converted" />);
    expect(container.firstChild).toHaveClass("bg-green-100");
    expect(container.firstChild).toHaveClass("text-green-700");
  });

  it("Dropped badge has red colour class", () => {
    const { container } = render(<Badge status="Dropped" />);
    expect(container.firstChild).toHaveClass("bg-red-100");
    expect(container.firstChild).toHaveClass("text-red-700");
  });

  it("New badge has gray colour class", () => {
    const { container } = render(<Badge status="New" />);
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });

  it("renders as a span element", () => {
    const { container } = render(<Badge status="New" />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });
});
