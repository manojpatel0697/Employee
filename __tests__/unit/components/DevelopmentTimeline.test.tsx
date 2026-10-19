/**
 * Component unit tests — DevelopmentTimeline
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import DevelopmentTimeline from "@/components/developer/DevelopmentTimeline";
import type { DevelopmentStatusEnum } from "@/lib/types";

describe("DevelopmentTimeline", () => {
  const stages: DevelopmentStatusEnum[] = [
    "Not Started",
    "Frontend Built",
    "Backend & DB Hooked",
    "Deployed",
    "Live",
  ];

  it("renders all 5 stages", () => {
    render(<DevelopmentTimeline currentStatus="Not Started" />);
    stages.forEach((stage) => {
      expect(screen.getByText(stage)).toBeInTheDocument();
    });
  });

  it("applies bold indigo style to current stage", () => {
    render(<DevelopmentTimeline currentStatus="Frontend Built" />);
    const label = screen.getByText("Frontend Built");
    expect(label.className).toContain("font-bold");
    expect(label.className).toContain("text-indigo-700");
  });

  it("applies green style to past stages", () => {
    render(<DevelopmentTimeline currentStatus="Backend & DB Hooked" />);
    const notStarted = screen.getByText("Not Started");
    const frontendBuilt = screen.getByText("Frontend Built");
    expect(notStarted.className).toContain("text-green-700");
    expect(frontendBuilt.className).toContain("text-green-700");
  });

  it("applies muted gray style to future stages", () => {
    render(<DevelopmentTimeline currentStatus="Not Started" />);
    const future = screen.getByText("Frontend Built");
    expect(future.className).toContain("text-gray-400");
  });

  it("works for all 5 statuses without crashing", () => {
    stages.forEach((status) => {
      const { unmount } = render(<DevelopmentTimeline currentStatus={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });
});
